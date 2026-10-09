import type { LedgerEntry } from "../../contracts/src/events.js";

// Reviewer policy is an authorization concern outside this pure accounting rule.
// Never delete/rewrite an award to revoke it: append a uniquely guarded reversal.
export function reversalEntry(
  original: LedgerEntry,
  id: string,
  now: string,
  reason: "PENALTY_DUPLICATE" | "PENALTY_FALSE_REPORT",
): LedgerEntry {
  if (original.amount <= 0)
    throw new Error("Only a positive award can be reversed");
  return {
    ...original,
    id,
    amount: -original.amount,
    reason,
    createdAt: now,
    idempotencyKey: `reversal:${original.idempotencyKey}`,
  };
}
