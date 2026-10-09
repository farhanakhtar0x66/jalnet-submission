import * as cedar from "@cedar-policy/cedar-wasm/nodejs";
import { describe, expect, it } from "vitest";
import {
  type ReportAuthorizationRequest,
  reportActions,
} from "../services/core/ports.js";
import { CedarReportAuthorizer } from "../services/providers/cedar-authorization.js";
import {
  forbid,
  overflowPolicy,
  ownerPolicy,
  schema,
} from "./cedar-fixtures.js";

const request: ReportAuthorizationRequest = {
  principalId: "local-alice",
  action: "ReadReport",
  reportId: "51d42f5a-2460-4126-8cb4-0329a1c9d9d8",
  ownerId: "local-alice",
};

describe("real Cedar 4.13.0 private-report authorization", () => {
  it("loads the pinned engine and strictly validates the actual schema/policy", () => {
    expect(cedar.getCedarSDKVersion()).toBe("4.13.0");
    expect(
      cedar.validate({
        schema,
        policies: { staticPolicies: { owner: ownerPolicy } },
        validationSettings: { mode: "strict" },
      }),
    ).toEqual({
      type: "success",
      validationErrors: [],
      validationWarnings: [],
      otherWarnings: [],
    });
  });
  it.each(reportActions)("allows an owner for %s", async (action) => {
    const authorizer = await CedarReportAuthorizer.create();
    await expect(authorizer.authorize({ ...request, action })).resolves.toBe(
      "ALLOW",
    );
  });
  it.each(reportActions)(
    "denies a foreign principal for %s",
    async (action) => {
      const authorizer = await CedarReportAuthorizer.create();
      await expect(
        authorizer.authorize({ ...request, action, principalId: "local-bob" }),
      ).resolves.toBe("DENY");
    },
  );
  it("lets a real explicit forbid override the otherwise permitted owner", async () => {
    const authorizer = await CedarReportAuthorizer.create({
      policies: { owner: ownerPolicy, "deny-owner": forbid("ReadReport") },
    });
    await expect(authorizer.authorize(request)).resolves.toBe("DENY");
  });
  it("defaults to deny when no permit exists", async () => {
    const authorizer = await CedarReportAuthorizer.create({ policies: {} });
    await expect(authorizer.authorize(request)).resolves.toBe("DENY");
  });
  it.each([
    { schema: "private-invalid-schema" },
    { policies: { invalid: "private-invalid-policy" } },
    {
      policies: {
        invalid:
          'permit(principal, action == JalNet::Action::"UnknownAction", resource);',
      },
    },
  ])(
    "fails initialization closed and discards parser/validation data %#",
    async (sources) => {
      await expect(CedarReportAuthorizer.create(sources)).rejects.toThrow(
        /^Report authorization unavailable$/,
      );
    },
  );
  it.each([
    { action: "UnknownAction" },
    { principalId: "" },
    { ownerId: "" },
    { ownerId: null },
    { reportId: "not-a-report-id" },
    { principalId: "local-alice", trusted: true },
  ])("fails invalid input closed without leaking it %#", async (invalid) => {
    const authorizer = await CedarReportAuthorizer.create();
    await expect(
      authorizer.authorize({
        ...request,
        ...invalid,
      } as ReportAuthorizationRequest),
    ).rejects.toThrow(/^Report authorization unavailable$/);
  });
  it("rejects real nonempty diagnostics even when Cedar itself returns allow", async () => {
    const policies = { owner: ownerPolicy, "private-overflow": overflowPolicy };
    const raw = cedar.isAuthorized({
      principal: { type: "JalNet::User", id: request.principalId },
      action: { type: "JalNet::Action", id: request.action },
      resource: { type: "JalNet::Report", id: request.reportId },
      context: {},
      schema,
      validateRequest: true,
      policies: { staticPolicies: policies },
      entities: [
        {
          uid: { type: "JalNet::User", id: request.principalId },
          attrs: {},
          parents: [],
        },
        {
          uid: { type: "JalNet::Report", id: request.reportId },
          attrs: {
            owner: { __entity: { type: "JalNet::User", id: request.ownerId } },
          },
          parents: [],
        },
      ],
    });
    expect(raw.type).toBe("success");
    if (raw.type !== "success")
      throw new Error("Expected real engine decision");
    expect(raw.response.decision).toBe("allow");
    expect(raw.response.diagnostics.errors).toHaveLength(1);
    const authorizer = await CedarReportAuthorizer.create({ policies });
    await expect(authorizer.authorize(request)).rejects.toThrow(
      /^Report authorization unavailable$/,
    );
  });
  it("fails a real engine request-parsing failure closed", async () => {
    // Valid schema/policy, but the engine requires an attribute the request lacks.
    const authorizer = await CedarReportAuthorizer.create({
      schema: schema.replace(
        "owner: User",
        "owner: User, classification: String",
      ),
    });
    await expect(authorizer.authorize(request)).rejects.toThrow(
      /^Report authorization unavailable$/,
    );
  });
});
