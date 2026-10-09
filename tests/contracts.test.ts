import { describe, expect, it } from "vitest";
import {
  createReportRequestSchema,
  mediaAssessmentSchema,
  presignRequestSchema,
} from "../packages/contracts/src/index.js";
import {
  canTransition,
  visualSeverity,
} from "../packages/domain/src/reports.js";

const assessment = {
  relevant: true,
  category: "WATERLOGGING",
  visualSeverity: "HIGH",
  evidence: ["Standing water visible on the roadway."],
  modelConfidence: 0.8,
  uncertaintyReasons: ["Exact depth cannot be measured from this image."],
  publicDraft: "Possible waterlogging reported.",
};
describe("strict media contract", () => {
  it("accepts bounded qualitative observations", () => {
    expect(visualSeverity(mediaAssessmentSchema.parse(assessment))).toBe(4);
  });
  it.each([
    { ...assessment, modelConfidence: 1.1 },
    { ...assessment, category: "CONTAMINATED" },
    { ...assessment, exactDepthCm: 42 },
    { ...assessment, relevant: undefined },
    {
      ...assessment,
      drain: {
        visible: true,
        obstruction: "SEVERE_VISUAL_OBSTRUCTION",
        overflow: "NONE",
      },
    },
  ])("rejects unsupported or malformed observations", (value) => {
    expect(mediaAssessmentSchema.safeParse(value).success).toBe(false);
  });
  it("preserves unknown severity instead of inventing a number", () => {
    expect(
      visualSeverity(
        mediaAssessmentSchema.parse({
          ...assessment,
          visualSeverity: "UNKNOWN",
        }),
      ),
    ).toBeNull();
  });
});
describe("report boundaries", () => {
  it("rejects unowned key injection into upload completion", () => {
    expect(
      createReportRequestSchema.safeParse({
        action: "UPLOAD_COMPLETE",
        reportId: "f2c85677-8f32-4232-8d78-031a177a5cb0",
        s3Key: "someone-else.jpg",
      }).success,
    ).toBe(false);
  });
  it("caps image size and rejects MIME changes", () => {
    const input = {
      reportId: "f2c85677-8f32-4232-8d78-031a177a5cb0",
      contentType: "image/jpeg",
      contentLength: 4_000_001,
    };
    expect(presignRequestSchema.safeParse(input).success).toBe(false);
    expect(
      presignRequestSchema.safeParse({
        ...input,
        contentType: "image/svg+xml",
        contentLength: 100,
      }).success,
    ).toBe(false);
  });
  it("permits failed analysis to reach manual confirmation without skipping human review", () => {
    expect(canTransition("ANALYZING", "NEEDS_CONFIRMATION")).toBe(true);
    expect(canTransition("ANALYZING", "ACCEPTED")).toBe(false);
    expect(canTransition("NEEDS_CONFIRMATION", "SUBMITTED")).toBe(true);
    expect(canTransition("ACCEPTED", "DRAFT")).toBe(false);
    expect(canTransition("UPLOADING", "UPLOADING")).toBe(true);
  });
});
