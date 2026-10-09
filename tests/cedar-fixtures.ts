import { readFileSync } from "node:fs";
import type { ReportAction } from "../services/core/ports.js";

export const schema = readFileSync(
  new URL("../policies/jalnet.cedarschema", import.meta.url),
  "utf8",
);
export const ownerPolicy = readFileSync(
  new URL("../policies/private-reports.cedar", import.meta.url),
  "utf8",
);
export const overflowPolicy = `permit (
  principal is JalNet::User,
  action in [JalNet::Action::"ReadReport", JalNet::Action::"PresignReport",
    JalNet::Action::"CompleteUpload", JalNet::Action::"ConfirmReport"],
  resource is JalNet::Report
) when { 9223372036854775807 + 1 > 0 };`;
export const forbid = (action: ReportAction) => `forbid (
  principal is JalNet::User,
  action == JalNet::Action::"${action}",
  resource is JalNet::Report
);`;
