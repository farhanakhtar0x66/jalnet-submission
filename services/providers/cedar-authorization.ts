import { readFile } from "node:fs/promises";
import type * as Cedar from "@cedar-policy/cedar-wasm/nodejs";
import { z } from "zod";
import {
  type ReportAuthorizationRequest,
  type ReportAuthorizer,
  reportActions,
} from "../core/ports.js";

const identity = z
  .string()
  .min(1)
  .max(256)
  .refine((value) => value.trim() === value);
const requestSchema = z.strictObject({
  principalId: identity,
  action: z.enum(reportActions),
  reportId: z.uuid(),
  ownerId: identity,
});
const unavailable = () => new Error("Report authorization unavailable");

export class CedarReportAuthorizer implements ReportAuthorizer {
  private constructor(
    private readonly cedar: typeof Cedar,
    private readonly schema: string,
    private readonly policies: Cedar.PolicySet,
  ) {}

  // Overrides are trusted startup configuration for tests; no HTTP/environment
  // switch can disable Cedar or inject a policy into the local server.
  static async create(
    sources: {
      schema?: string;
      policies?: Readonly<Record<string, string>>;
    } = {},
  ): Promise<CedarReportAuthorizer> {
    try {
      const cedar = await import("@cedar-policy/cedar-wasm/nodejs");
      const schema =
        sources.schema ??
        (await readFile(
          new URL("../../policies/jalnet.cedarschema", import.meta.url),
          "utf8",
        ));
      const policies: Cedar.PolicySet = {
        staticPolicies: Object.freeze({
          ...(sources.policies ?? {
            "private-report-owner": await readFile(
              new URL("../../policies/private-reports.cedar", import.meta.url),
              "utf8",
            ),
          }),
        }),
      };
      const validation = cedar.validate({
        schema,
        policies,
        validationSettings: { mode: "strict" },
      });
      if (
        validation.type !== "success" ||
        validation.validationErrors.length ||
        validation.validationWarnings.length ||
        validation.otherWarnings.length
      )
        throw unavailable();
      return new CedarReportAuthorizer(cedar, schema, policies);
    } catch {
      // Discard engine/parser/filesystem details, including policy contents.
      throw unavailable();
    }
  }

  async authorize(
    request: ReportAuthorizationRequest,
  ): Promise<"ALLOW" | "DENY"> {
    try {
      const parsed = requestSchema.safeParse(request);
      if (!parsed.success) throw unavailable();
      const { principalId, action, reportId, ownerId } = parsed.data;
      const principal = { type: "JalNet::User", id: principalId };
      const resource = { type: "JalNet::Report", id: reportId };
      const answer = this.cedar.isAuthorized({
        principal,
        action: { type: "JalNet::Action", id: action },
        resource,
        context: {},
        schema: this.schema,
        validateRequest: true,
        policies: this.policies,
        entities: [
          { uid: principal, attrs: {}, parents: [] },
          {
            uid: resource,
            attrs: {
              owner: { __entity: { type: "JalNet::User", id: ownerId } },
            },
            parents: [],
          },
        ],
      });
      // Cedar skips erroneous policies; another permit may still say allow.
      if (
        answer.type !== "success" ||
        answer.warnings.length ||
        answer.response.diagnostics.errors.length
      )
        throw unavailable();
      if (answer.response.decision === "allow") return "ALLOW";
      if (answer.response.decision === "deny") return "DENY";
      throw unavailable();
    } catch {
      throw unavailable();
    }
  }
}
