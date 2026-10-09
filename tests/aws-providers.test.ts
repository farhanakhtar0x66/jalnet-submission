import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { S3Client } from "@aws-sdk/client-s3";
import { GeoRoutesClient } from "@aws-sdk/client-geo-routes";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AmazonRoutes,
  NovaAnalysis,
  S3Evidence,
} from "../services/providers/aws.js";

const assessment = {
  relevant: true,
  category: "WATERLOGGING",
  visualSeverity: "LOW",
  evidence: ["Visible standing water"],
  modelConfidence: 0.5,
  uncertaintyReasons: ["Depth is unknown"],
  publicDraft: "Possible waterlogging reported; road conditions are uncertain.",
};
const response = (text: string) => ({
  $metadata: {},
  output: { message: { role: "assistant", content: [{ text }] } },
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe("AWS adapter unit tests (SDK mocked; NOT live AWS proof)", () => {
  it("requests Routes V2 simple geometry in longitude/latitude order and validates its result", async () => {
    const geometry = [
      [77.205, 28.6139],
      [77.215, 28.6139],
    ];
    const send = vi.spyOn(GeoRoutesClient.prototype, "send").mockResolvedValue({
      $metadata: {},
      Routes: [
        {
          Summary: { Distance: 1000, Duration: 120 },
          Legs: [{ Geometry: { LineString: geometry } }],
        },
      ],
    } as never);
    expect(
      await new AmazonRoutes("ap-south-1").calculate(
        { lat: 28.6139, lon: 77.205 },
        { lat: 28.6139, lon: 77.215 },
        "Car",
      ),
    ).toEqual({ geometry, distanceM: 1000, durationSec: 120 });
    expect(send.mock.calls[0]?.[0]).toMatchObject({
      input: {
        Origin: [77.205, 28.6139],
        Destination: [77.215, 28.6139],
        TravelMode: "Car",
        LegGeometryFormat: "Simple",
        MaxAlternatives: 0,
      },
    });
  });
  it("rejects malformed Routes V2 output rather than fabricating a road route", async () => {
    vi.spyOn(GeoRoutesClient.prototype, "send").mockResolvedValue({
      $metadata: {},
      Routes: [{ Summary: { Distance: 1000, Duration: 120 }, Legs: [] }],
    } as never);
    await expect(
      new AmazonRoutes("ap-south-1").calculate(
        { lat: 28.6139, lon: 77.205 },
        { lat: 28.6139, lon: 77.215 },
        "Car",
      ),
    ).rejects.toThrow();
  });
  it("aborts two timed-out requests with bounded backoff and no third invocation", async () => {
    vi.useFakeTimers();
    vi.spyOn(AbortSignal, "timeout").mockImplementation((ms) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), ms);
      return controller.signal;
    });
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockImplementation(
        ((_command: unknown, options: { abortSignal: AbortSignal }) =>
          new Promise((_finish, reject) =>
            options.abortSignal.addEventListener(
              "abort",
              () => reject(new Error("unit timeout")),
              { once: true },
            ),
          )) as never,
      );
    const result = new NovaAnalysis("unit-test-model-config", "ap-south-1")
      .assess(new Uint8Array([1]))
      .catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(40_250);
    expect(await result).toBeInstanceOf(Error);
    expect(send).toHaveBeenCalledTimes(2);
    expect(AbortSignal.timeout).toHaveBeenNthCalledWith(1, 20_000);
    expect(AbortSignal.timeout).toHaveBeenNthCalledWith(2, 20_000);
  });
  it("rejects a truncated S3 body even if the declared metadata looked valid", async () => {
    vi.spyOn(S3Client.prototype, "send").mockResolvedValue({
      $metadata: {},
      ContentType: "image/jpeg",
      ContentLength: 100,
      Body: { transformToByteArray: async () => new Uint8Array(10) },
    } as never);
    await expect(
      new S3Evidence("unit-test-private-bucket", "ap-south-1").read(
        "private/unit.jpg",
      ),
    ).rejects.toThrow("length");
  });
  it("retries malformed assessment once, then accepts only validated output", async () => {
    const send = vi.spyOn(BedrockRuntimeClient.prototype, "send");
    send
      .mockResolvedValueOnce(response('{"depthM":2}') as never)
      .mockResolvedValueOnce(response(JSON.stringify(assessment)) as never);
    expect(
      await new NovaAnalysis("unit-test-model-config", "ap-south-1").assess(
        new Uint8Array([1]),
      ),
    ).toEqual(assessment);
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("never exceeds two model attempts when schema validation fails", async () => {
    const send = vi
      .spyOn(BedrockRuntimeClient.prototype, "send")
      .mockResolvedValue(
        response(
          JSON.stringify({ ...assessment, modelConfidence: 3 }),
        ) as never,
      );
    await expect(
      new NovaAnalysis("unit-test-model-config", "ap-south-1").assess(
        new Uint8Array([1]),
      ),
    ).rejects.toThrow();
    expect(send).toHaveBeenCalledTimes(2);
  });
  it("does not invoke a missing configured model or an oversized image", async () => {
    const send = vi.spyOn(BedrockRuntimeClient.prototype, "send");
    await expect(
      new NovaAnalysis("", "ap-south-1").assess(new Uint8Array([1])),
    ).rejects.toThrow();
    await expect(
      new NovaAnalysis("unit-test-model-config", "ap-south-1").assess(
        new Uint8Array(3_750_001),
      ),
    ).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it("rejects an incorrectly typed S3 object before consuming its body", async () => {
    const body = { transformToByteArray: vi.fn() };
    vi.spyOn(S3Client.prototype, "send").mockResolvedValue({
      $metadata: {},
      ContentType: "text/plain",
      ContentLength: 100,
      Body: body,
    } as never);
    await expect(
      new S3Evidence("unit-test-private-bucket", "ap-south-1").read(
        "private/test.jpg",
      ),
    ).rejects.toThrow();
    expect(body.transformToByteArray).not.toHaveBeenCalled();
  });
});
