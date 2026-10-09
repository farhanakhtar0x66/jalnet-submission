import { randomUUID } from "node:crypto";
import { expect, it } from "vitest";
import { reversalEntry } from "../packages/domain/src/rewards.js";
import { LocalRepository } from "../services/providers/local-repository.js";

it("reverses by one immutable audit entry and refuses double reversal", async () => {
  const original = {
    id: randomUUID(),
    userId: "alice",
    eventId: randomUUID(),
    amount: 8,
    reason: "FIRST_VALID_REPORT" as const,
    createdAt: "2026-10-08T08:00:00.000Z",
    idempotencyKey: "first:test",
  };
  const repo = new LocalRepository();
  await repo.commit({ ledger: [original], guards: [] });
  const reversal = reversalEntry(
    original,
    randomUUID(),
    "2026-10-08T09:00:00.000Z",
    "PENALTY_FALSE_REPORT",
  );
  expect(await repo.commit({ ledger: [reversal], guards: [] })).toBe(true);
  expect(
    await repo.commit({
      ledger: [{ ...reversal, id: randomUUID() }],
      guards: [],
    }),
  ).toBe(false);
  const ledger = await repo.ledger("alice");
  expect(ledger).toHaveLength(2);
  expect(ledger.reduce((n, e) => n + e.amount, 0)).toBe(0);
  expect(original.amount).toBe(8);
  expect(() =>
    reversalEntry(
      reversal,
      randomUUID(),
      original.createdAt,
      "PENALTY_DUPLICATE",
    ),
  ).toThrow();
});
