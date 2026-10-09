import { reportLocationSchema } from "@jalnet/contracts";
import { openDatabaseAsync } from "expo-sqlite";
import { z } from "zod";
import { storageScope } from "./api";

const draftSchema = z.object({
  accountScope: z.string().min(1),
  uri: z.string(),
  capturedAt: z.iso.datetime(),
  reportId: z.uuid().optional(),
  location: reportLocationSchema.optional(),
});
export type LocalDraft = z.infer<typeof draftSchema>;
const dbPromise = openDatabaseAsync("jalnet-drafts.db").then(async (db) => {
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS scoped_draft (scope TEXT PRIMARY KEY, data TEXT NOT NULL)",
  );
  return db;
});
export async function saveDraft(draft: LocalDraft) {
  const scope = await storageScope();
  if (draft.accountScope !== scope)
    throw new Error(
      "Account changed; private draft remains with its original account",
    );
  await (await dbPromise).runAsync(
    "INSERT OR REPLACE INTO scoped_draft (scope,data) VALUES (?,?)",
    scope,
    JSON.stringify(draft),
  );
}
export async function readDraft() {
  const scope = await storageScope();
  const row = await (await dbPromise).getFirstAsync<{ data: string }>(
    "SELECT data FROM scoped_draft WHERE scope=?",
    scope,
  );
  const draft = row ? draftSchema.parse(JSON.parse(row.data)) : null;
  if (draft && draft.accountScope !== scope)
    throw new Error("Private draft account mismatch");
  return draft;
}
export async function clearDraft(expectedScope: string) {
  if (expectedScope !== (await storageScope()))
    throw new Error("Account changed; original private draft was kept");
  await (await dbPromise).runAsync(
    "DELETE FROM scoped_draft WHERE scope=?",
    expectedScope,
  );
}
