import { describe, expect, it } from "vitest";
import { apiErrorSchema } from "../packages/contracts/src/index.js";
import { errorResponse, parseRequestBody } from "../services/core/http.js";

describe("canonical HTTP errors", () => {
  it("rejects malformed and excessive JSON with useful client errors", () => {
    for (const [input, status] of [
      ["{", 400],
      ["x".repeat(64_001), 413],
    ] as const) {
      try {
        parseRequestBody(input);
        throw new Error("Expected rejection");
      } catch (error) {
        const response = errorResponse(error, "test-request");
        expect(response.status).toBe(status);
        expect(apiErrorSchema.parse(response.body).error.code).toBe(
          "VALIDATION_FAILED",
        );
      }
    }
  });
  it("redacts internal provider details from dependency errors", () => {
    const response = errorResponse(
      new Error(
        "Private evidence path or provider diagnostic must stay private",
      ),
      "test-request",
    );
    expect(response.status).toBe(503);
    expect(apiErrorSchema.parse(response.body).error.code).toBe(
      "DEPENDENCY_UNAVAILABLE",
    );
    expect(JSON.stringify(response.body)).not.toContain("Private evidence");
  });
});
