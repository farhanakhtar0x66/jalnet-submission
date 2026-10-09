import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { normalizeStackOutputs, outputsSchema } from "../scripts/aws-safety.js";

// Validate the actual synthesized artifact. Run pnpm synth before pnpm test.
const template = JSON.parse(
  readFileSync("cdk.out/JalNetDev.template.json", "utf8"),
) as {
  Resources: Record<
    string,
    {
      Type: string;
      Properties: Record<string, unknown>;
      DeletionPolicy?: string;
    }
  >;
  Parameters: Record<
    string,
    { Default?: unknown; MinLength?: number; AllowedPattern?: string }
  >;
  Outputs: Record<string, unknown>;
};
const resources = Object.values(template.Resources);
describe("synthesized security boundaries (LOCAL, not deployment evidence)", () => {
  it("resolves every required cutover output using the actual synthesized logical names", () => {
    const unitOutputs = Object.fromEntries(
      Object.keys(template.Outputs).map((key) => [
        key,
        "LOCAL_UNRESOLVED_TOKEN",
      ]),
    );
    const normalized = normalizeStackOutputs(unitOutputs);
    for (const key of Object.keys(outputsSchema.shape))
      expect(normalized[key], `Missing synthesized output for ${key}`).toBe(
        "LOCAL_UNRESOLVED_TOKEN",
      );
  });
  it("requires a nonempty model and exact model ARNs without an empty/manual deployment default", () => {
    expect(template.Parameters.BedrockModelId?.Default).toBeUndefined();
    expect(template.Parameters.BedrockModelId?.MinLength).toBe(1);
    expect(template.Parameters.BedrockInvokeArns?.Default).toBeUndefined();
    expect(template.Parameters.BedrockInvokeArns?.AllowedPattern).not.toContain(
      "*",
    );
    const functions = resources.filter(
      (r) => r.Type === "AWS::Lambda::Function",
    );
    for (const fn of functions) {
      const env = (
        fn.Properties.Environment as { Variables: Record<string, unknown> }
      ).Variables;
      expect(env.COGNITO_ISSUER).toBeDefined();
      expect(env.COGNITO_CLIENT_ID).toBeDefined();
      expect(env.MEDIA_QUEUE_ARN).toBeDefined();
    }
  });
  it("retains canonical tables without event TTL and encrypts private evidence", () => {
    const tables = resources.filter((r) => r.Type === "AWS::DynamoDB::Table");
    expect(tables).toHaveLength(4);
    for (const table of tables) {
      expect(table.DeletionPolicy).toBe("Retain");
      expect(table.Properties.TimeToLiveSpecification).toBeUndefined();
    }
    const bucket = resources.find((r) => r.Type === "AWS::S3::Bucket");
    expect(bucket?.Properties.PublicAccessBlockConfiguration).toEqual({
      BlockPublicAcls: true,
      BlockPublicPolicy: true,
      IgnorePublicAcls: true,
      RestrictPublicBuckets: true,
    });
    expect(bucket?.Properties.BucketEncryption).toBeDefined();
  });
  it("protects every private API route with JWT, keeping health operational", () => {
    for (const resource of resources.filter(
      (r) => r.Type === "AWS::ApiGatewayV2::Route",
    ))
      expect(resource.Properties.AuthorizationType).toBe(
        resource.Properties.RouteKey === "GET /health" ? "NONE" : "JWT",
      );
    const clients = resources.filter(
      (r) => r.Type === "AWS::Cognito::UserPoolClient",
    );
    expect(clients[0]?.Properties.GenerateSecret).toBe(false);
  });
  it("never grants wildcard actions or unrestricted Bedrock resources", () => {
    const text = JSON.stringify(
      resources.filter((r) => r.Type === "AWS::IAM::Policy"),
    );
    expect(text).not.toContain('"Action":"*"');
    expect(text).not.toContain('"bedrock:*"');
    const policies = resources.filter((r) => r.Type === "AWS::IAM::Policy");
    const statements = policies.flatMap(
      (p) =>
        (
          p.Properties.PolicyDocument as {
            Statement: { Action: string | string[]; Resource: unknown }[];
          }
        ).Statement,
    );
    for (const statement of statements)
      if (JSON.stringify(statement.Action).includes("bedrock:InvokeModel"))
        expect(statement.Resource).toEqual({ Ref: "BedrockInvokeArns" });
    const routePolicy = statements.find((s) =>
      JSON.stringify(s.Action).includes("geo-routes:CalculateRoutes"),
    );
    const routeResource = JSON.stringify(routePolicy?.Resource);
    expect(routeResource).toContain("geo-routes:");
    expect(routeResource).toContain("::provider/default");
    expect(routeResource).not.toContain("AWS::AccountId");
    expect(text).not.toContain("dynamodb:DeleteTable");
    expect(text).not.toContain("s3:DeleteObject");
    for (const statement of statements)
      if (JSON.stringify(statement.Action).includes("logs:PutLogEvents")) {
        expect(statement.Resource).not.toBe("*");
        expect(JSON.stringify(statement.Resource)).toContain("Logs");
      }
    expect(
      JSON.stringify(resources.filter((r) => r.Type === "AWS::IAM::Role")),
    ).not.toContain("AWSLambdaBasicExecutionRole");
  });
});
