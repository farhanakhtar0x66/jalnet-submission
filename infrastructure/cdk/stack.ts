import { resolve } from "node:path";
import {
  ArnFormat,
  CfnOutput,
  CfnParameter,
  Duration,
  RemovalPolicy,
  Stack,
  Tags,
  type StackProps,
} from "aws-cdk-lib";
import {
  type CfnStage,
  HttpApi,
  HttpMethod,
  HttpNoneAuthorizer,
} from "aws-cdk-lib/aws-apigatewayv2";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as sqs from "aws-cdk-lib/aws-sqs";
import type { Construct } from "constructs";

export class JalnetStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    Tags.of(this).add("Project", "JalNet");
    Tags.of(this).add("Environment", "p0-dev");
    const modelId = new CfnParameter(this, "BedrockModelId", {
      type: "String",
      minLength: 1,
      allowedPattern: "[A-Za-z0-9._:/-]+",
      description:
        "Actual image-capable Nova model or inference profile ID; deployment does not verify model access.",
    });
    const modelArns = new CfnParameter(this, "BedrockInvokeArns", {
      type: "CommaDelimitedList",
      allowedPattern:
        "arn:aws:bedrock:[a-z0-9-]+:[0-9]{0,12}:(foundation-model|inference-profile|application-inference-profile)/[A-Za-z0-9._:/-]+",
      description:
        "Actual model/profile ARNs required by the selected profile. No wildcard default.",
    });
    const table = (name: string, partition: string, sort?: string) =>
      new dynamodb.Table(this, name, {
        partitionKey: { name: partition, type: dynamodb.AttributeType.STRING },
        ...(sort
          ? { sortKey: { name: sort, type: dynamodb.AttributeType.STRING } }
          : {}),
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
        removalPolicy: RemovalPolicy.RETAIN,
      });
    const events = table("Events", "id");
    events.addGlobalSecondaryIndex({
      indexName: "ByH3",
      partitionKey: { name: "h3R8", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    const reports = table("Reports", "id");
    const users = table("Users", "userId", "id");
    const ledger = table("DropletLedger", "id");
    ledger.addGlobalSecondaryIndex({
      indexName: "ByUser",
      partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "createdAt", type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
    const bucket = new s3.Bucket(this, "Evidence", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      removalPolicy: RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          expiration: Duration.days(14),
          abortIncompleteMultipartUploadAfter: Duration.days(1),
        },
      ],
    });
    const dead = new sqs.Queue(this, "AnalysisDLQ", {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      retentionPeriod: Duration.days(7),
    });
    const queue = new sqs.Queue(this, "AnalysisQueue", {
      encryption: sqs.QueueEncryption.SQS_MANAGED,
      visibilityTimeout: Duration.minutes(6),
      deadLetterQueue: { queue: dead, maxReceiveCount: 3 },
    });
    const pool = new cognito.UserPool(this, "Citizens", {
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });
    const client = pool.addClient("Mobile", {
      generateSecret: false,
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: ["jalnet://auth"],
        logoutUrls: ["jalnet://signout"],
      },
      authFlows: { userSrp: true },
      preventUserExistenceErrors: true,
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
    });
    const domain = pool.addDomain("LoginDomain", {
      cognitoDomain: { domainPrefix: `jalnet-${this.account}-${this.region}` },
    });
    new CfnOutput(this, "CognitoDomain", { value: domain.baseUrl() });
    const environment = {
      EVENTS_TABLE: events.tableName,
      REPORTS_TABLE: reports.tableName,
      USERS_TABLE: users.tableName,
      DROPLET_LEDGER_TABLE: ledger.tableName,
      EVIDENCE_BUCKET: bucket.bucketName,
      MEDIA_QUEUE_URL: queue.queueUrl,
      MEDIA_QUEUE_ARN: queue.queueArn,
      BEDROCK_MODEL_ID: modelId.valueAsString,
      COGNITO_ISSUER: `https://cognito-idp.${this.region}.amazonaws.com/${pool.userPoolId}`,
      COGNITO_CLIENT_ID: client.userPoolClientId,
    };
    const fn = (name: string, entry: string, timeout = 30) => {
      const logGroup = new logs.LogGroup(this, `${name}Logs`, {
        retention: logs.RetentionDays.ONE_WEEK,
      });
      const role = new iam.Role(this, `${name}Role`, {
        assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      });
      logGroup.grantWrite(role);
      return new NodejsFunction(this, name, {
        entry: resolve(`services/aws/${entry}.ts`),
        runtime: lambda.Runtime.NODEJS_24_X,
        handler: "handler",
        timeout: Duration.seconds(timeout),
        memorySize: 256,
        reservedConcurrentExecutions: 2,
        environment,
        role,
        logGroup,
        bundling: {
          target: "node24",
          minify: true,
          sourceMap: true,
          externalModules: [],
        },
      });
    };
    const reportFn = fn("ReportsAPI", "reports");
    const grant = (
      target: NodejsFunction,
      table: dynamodb.Table,
      actions: string[],
    ) =>
      target.addToRolePolicy(
        new iam.PolicyStatement({
          actions: actions.map((action) => `dynamodb:${action}`),
          resources: [table.tableArn, `${table.tableArn}/index/*`],
        }),
      );
    grant(reportFn, reports, ["GetItem", "PutItem"]);
    grant(reportFn, events, ["GetItem", "PutItem", "Query"]);
    grant(reportFn, ledger, ["GetItem", "PutItem", "Query"]);
    reportFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: [bucket.arnForObjects("private/*")],
      }),
    );
    queue.grantSendMessages(reportFn);
    const eventFn = fn("EventsAPI", "events");
    grant(eventFn, events, ["GetItem", "PutItem", "Query"]);
    const routeFn = fn("RoutesAPI", "routes");
    grant(routeFn, users, ["Query", "PutItem", "DeleteItem"]);
    grant(routeFn, events, ["Query"]);
    grant(routeFn, ledger, ["GetItem", "PutItem"]);
    routeFn.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["geo-routes:CalculateRoutes"],
        resources: [
          this.formatArn({
            service: "geo-routes",
            account: "",
            arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
            resource: "provider",
            resourceName: "default",
          }),
        ],
      }),
    );
    const profileFn = fn("ProfileAPI", "profile");
    grant(profileFn, ledger, ["Query"]);
    const worker = fn("AnalyzeMedia", "worker", 60);
    grant(worker, reports, ["GetItem", "PutItem"]);
    grant(worker, ledger, ["GetItem", "PutItem"]);
    worker.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("private/*")],
      }),
    );
    worker.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: modelArns.valueAsList,
      }),
    );
    worker.addEventSource(
      new SqsEventSource(queue, {
        batchSize: 1,
        reportBatchItemFailures: true,
      }),
    );
    const health = fn("Health", "health");
    const api = new HttpApi(this, "API", {
      defaultAuthorizer: new HttpUserPoolAuthorizer("CitizensAuth", pool, {
        userPoolClients: [client],
      }),
    });
    const add = (
      path: string,
      methods: HttpMethod[],
      handler: NodejsFunction,
    ) =>
      api.addRoutes({
        path,
        methods,
        integration: new HttpLambdaIntegration(
          `${handler.node.id}${path}`,
          handler,
        ),
      });
    add("/v1/reports", [HttpMethod.POST], reportFn);
    add("/v1/reports/{reportId}", [HttpMethod.GET], reportFn);
    add("/v1/reports/{reportId}/confirm", [HttpMethod.POST], reportFn);
    add("/v1/uploads/presign", [HttpMethod.POST], reportFn);
    add("/v1/events", [HttpMethod.GET], eventFn);
    add("/v1/events/{eventId}", [HttpMethod.GET], eventFn);
    add("/v1/events/{eventId}/confirm", [HttpMethod.POST], eventFn);
    add("/v1/events/{eventId}/resolve-request", [HttpMethod.POST], eventFn);
    add("/v1/routes", [HttpMethod.GET, HttpMethod.POST], routeFn);
    add("/v1/routes/preview", [HttpMethod.POST], routeFn);
    add("/v1/routes/{routeId}/risk", [HttpMethod.GET], routeFn);
    add("/v1/routes/{routeId}", [HttpMethod.DELETE], routeFn);
    add("/v1/me", [HttpMethod.GET], profileFn);
    api.addRoutes({
      path: "/health",
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration("HealthIntegration", health),
      authorizer: new HttpNoneAuthorizer(),
    });
    const stage = api.defaultStage?.node.defaultChild as CfnStage;
    stage.defaultRouteSettings = {
      throttlingBurstLimit: 10,
      throttlingRateLimit: 5,
    };
    new CfnOutput(this, "ApiUrl", { value: api.apiEndpoint });
    new CfnOutput(this, "ApiId", { value: api.apiId });
    new CfnOutput(this, "UserPoolId", { value: pool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: client.userPoolClientId });
    new CfnOutput(this, "AnalysisWorkerName", { value: worker.functionName });
    new CfnOutput(this, "AnalysisDLQUrl", { value: dead.queueUrl });
    new CfnOutput(this, "AnalysisDLQArn", { value: dead.queueArn });
    new CfnOutput(this, "LocationMapsResourceArn", {
      value: `arn:${this.partition}:geo-maps:${this.region}::provider/default`,
    });
    new CfnOutput(this, "LocationRoutesResourceArn", {
      value: `arn:${this.partition}:geo-routes:${this.region}::provider/default`,
    });
    for (const [name, value] of Object.entries(environment))
      new CfnOutput(this, name, { value });
  }
}
