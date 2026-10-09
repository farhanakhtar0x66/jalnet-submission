import { makeHandler } from "./runtime.js";
export const handler = makeHandler(["/v1/reports", "/v1/uploads/presign"]);
