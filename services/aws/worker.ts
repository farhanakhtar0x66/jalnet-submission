import type { SQSBatchResponse, SQSEvent } from "aws-lambda";
import { z } from "zod";
import { cloudApplication } from "./runtime.js";

const message = z.strictObject({ reportId: z.uuid() });
export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const app = cloudApplication();
  const batchItemFailures: { itemIdentifier: string }[] = [];
  for (const record of event.Records)
    try {
      await app.analyze(message.parse(JSON.parse(record.body)).reportId);
    } catch {
      batchItemFailures.push({ itemIdentifier: record.messageId });
    }
  return { batchItemFailures };
}
