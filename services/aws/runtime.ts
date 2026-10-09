import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from "aws-lambda";
import { readServerConfig } from "../../packages/contracts/src/config.js";
import { ApiFailure, Application } from "../core/application.js";
import { dispatch, errorResponse, parseRequestBody } from "../core/http.js";
import { AmazonRoutes, NovaAnalysis, S3Evidence } from "../providers/aws.js";
import { DynamoRepository } from "../providers/dynamo-repository.js";

export function cloudApplication(profile?: "jalnet") {
  const config = readServerConfig(process.env);
  const region = config.AWS_REGION;
  return new Application(
    new DynamoRepository(
      {
        reports: config.REPORTS_TABLE,
        events: config.EVENTS_TABLE,
        routes: config.USERS_TABLE,
        ledger: config.DROPLET_LEDGER_TABLE,
      },
      region,
      profile,
    ),
    new S3Evidence(config.EVIDENCE_BUCKET, region, profile),
    new NovaAnalysis(config.BEDROCK_MODEL_ID, region, profile),
    new AmazonRoutes(region, profile),
  );
}
// Cryptographic JWT verification belongs to API Gateway. Never decode a raw
// Authorization header here or use its payload as an authenticated identity.
export function authorizerSubject(
  event: APIGatewayProxyEventV2WithJWTAuthorizer,
) {
  const claims = event.requestContext.authorizer?.jwt?.claims;
  const valid =
    Boolean(process.env.COGNITO_ISSUER && process.env.COGNITO_CLIENT_ID) &&
    claims &&
    typeof claims.sub === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      claims.sub,
    ) &&
    claims.token_use === "access" &&
    claims.iss === process.env.COGNITO_ISSUER &&
    claims.client_id === process.env.COGNITO_CLIENT_ID;
  if (!valid) throw new ApiFailure("AUTH_REQUIRED", 401, "Sign in to continue");
  return claims.sub as string;
}
export function makeHandler(prefixes: readonly string[]) {
  let app: Application | undefined;
  return async (event: APIGatewayProxyEventV2WithJWTAuthorizer) => {
    try {
      if (
        !prefixes.some(
          (prefix) =>
            event.rawPath === prefix || event.rawPath.startsWith(`${prefix}/`),
        )
      )
        return { statusCode: 404, body: "{}" };
      const userId = authorizerSubject(event);
      app ??= cloudApplication();
      const result = await dispatch(
        app,
        {
          method: event.requestContext.http.method,
          path: event.rawPath,
          userId,
          query: event.queryStringParameters ?? {},
          body: event.body
            ? parseRequestBody(
                event.isBase64Encoded
                  ? Buffer.from(event.body, "base64").toString()
                  : event.body,
              )
            : {},
        },
        async (id) => {
          const config = readServerConfig(process.env);
          await new SQSClient({
            region: config.AWS_REGION,
            maxAttempts: 2,
          }).send(
            new SendMessageCommand({
              QueueUrl: config.MEDIA_QUEUE_URL,
              MessageBody: JSON.stringify({ reportId: id }),
            }),
            { abortSignal: AbortSignal.timeout(10_000) },
          );
        },
      );
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result),
      };
    } catch (error) {
      const result = errorResponse(error, event.requestContext.requestId);
      return {
        statusCode: result.status,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(result.body),
      };
    }
  };
}
