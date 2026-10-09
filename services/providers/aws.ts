import {
  BedrockRuntimeClient,
  ConverseCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  CalculateRoutesCommand,
  GeoRoutesClient,
} from "@aws-sdk/client-geo-routes";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import {
  mediaAssessmentSchema,
  routeResultSchema,
} from "../../packages/contracts/src/index.js";
import { analysisSystemPrompt } from "../../packages/domain/src/reports.js";
import type { Point } from "../../packages/geo/src/index.js";
import type {
  AnalysisProvider,
  EvidenceProvider,
  RouteProvider,
} from "../core/ports.js";

// Default SDK credential chain only; Lambda receives its scoped IAM role.
export class S3Evidence implements EvidenceProvider {
  private readonly client: S3Client;
  constructor(
    private readonly bucket: string,
    region: string,
    profile?: "jalnet",
  ) {
    this.client = new S3Client({
      region,
      maxAttempts: 2,
      ...(profile ? { profile } : {}),
    });
  }
  async presign(key: string, size: number) {
    return {
      url: await getSignedUrl(
        this.client,
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: "image/jpeg",
          ContentLength: size,
        }),
        { expiresIn: 300 },
      ),
      expiresIn: 300,
    };
  }
  async read(key: string) {
    const signal = AbortSignal.timeout(10_000);
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { abortSignal: signal },
    );
    if (
      result.ContentType !== "image/jpeg" ||
      !result.ContentLength ||
      result.ContentLength > 4_000_000 ||
      !result.Body
    )
      throw new Error("Invalid S3 evidence object");
    const bytes = await result.Body.transformToByteArray();
    if (bytes.length !== result.ContentLength || bytes.length > 4_000_000)
      throw new Error("Invalid S3 evidence length");
    return bytes;
  }
}
export class NovaAnalysis implements AnalysisProvider {
  readonly provenance = "AWS_UNVERIFIED" as const;
  private readonly client: BedrockRuntimeClient;
  constructor(
    private readonly modelId: string,
    region: string,
    profile?: "jalnet",
  ) {
    this.client = new BedrockRuntimeClient({
      region,
      maxAttempts: 1,
      ...(profile ? { profile } : {}),
    });
  }
  async assess(image: Uint8Array) {
    if (!this.modelId)
      throw new Error(
        "BEDROCK_MODEL_ID is required; no model access is assumed",
      );
    if (image.length > 3_750_000)
      throw new Error("Image exceeds Bedrock image limit");
    const schema = JSON.stringify(z.toJSONSchema(mediaAssessmentSchema));
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await this.client.send(
          new ConverseCommand({
            modelId: this.modelId,
            system: [
              { text: `${analysisSystemPrompt}\nJSON schema: ${schema}` },
            ],
            messages: [
              {
                role: "user",
                content: [
                  { image: { format: "jpeg", source: { bytes: image } } },
                  {
                    text:
                      attempt === 0
                        ? "Describe visible water-related evidence. Return the JSON object only."
                        : "Previous output could not be validated. Return only one valid schema-conforming JSON object; use UNKNOWN/UNCERTAIN when evidence is insufficient.",
                  },
                ],
              },
            ],
            inferenceConfig: { maxTokens: 1200, temperature: 0 },
          }),
          { abortSignal: AbortSignal.timeout(20_000) },
        );
        const text =
          response.output?.message?.content
            ?.map((block) => block.text ?? "")
            .join("") ?? "";
        return mediaAssessmentSchema.parse(JSON.parse(text));
      } catch (error) {
        if (attempt === 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    throw new Error("Analysis did not return a validated assessment");
  }
}
export class AmazonRoutes implements RouteProvider {
  readonly provenance = "AWS_UNVERIFIED" as const;
  private readonly client: GeoRoutesClient;
  constructor(region: string, profile?: "jalnet") {
    this.client = new GeoRoutesClient({
      region,
      maxAttempts: 2,
      ...(profile ? { profile } : {}),
    });
  }
  async calculate(
    origin: Point,
    destination: Point,
    mode: "Car" | "Pedestrian" | "Scooter",
  ) {
    const response = await this.client.send(
      new CalculateRoutesCommand({
        Origin: [origin.lon, origin.lat],
        Destination: [destination.lon, destination.lat],
        TravelMode: mode,
        LegGeometryFormat: "Simple",
        LegAdditionalFeatures: ["Summary"],
        MaxAlternatives: 0,
      }),
      { abortSignal: AbortSignal.timeout(10_000) },
    );
    const route = response.Routes?.[0];
    return routeResultSchema.parse({
      geometry: route?.Legs?.flatMap((leg) => leg.Geometry?.LineString ?? []),
      distanceM: route?.Summary?.Distance,
      durationSec: route?.Summary?.Duration,
    });
  }
}
