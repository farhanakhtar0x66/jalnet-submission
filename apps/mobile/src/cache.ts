import * as Crypto from "expo-crypto";
import { openDatabaseAsync } from "expo-sqlite";
import type { z } from "zod";
import { api, NetworkError, storageScope } from "./api";

export const dbPromise = openDatabaseAsync("jalnet-cache.db").then(
  async (db) => {
    await db.execAsync(
      "CREATE TABLE IF NOT EXISTS cache (key TEXT PRIMARY KEY, body TEXT NOT NULL, savedAt INTEGER NOT NULL)",
    );
    return db;
  },
);
export async function cachedApi<T>(path: string, schema: z.ZodType<T>) {
  // Account scope comes from the authenticated API during PKCE sign-in, not a
  // decoded bearer payload. Reauthentication preserves that account's drafts.
  const accountScope = await storageScope();
  const scope = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    accountScope,
  );
  const key = `${scope}:${path}`;
  const db = await dbPromise;
  try {
    const value = await api(path, schema, undefined, "GET", accountScope);
    const cachedAt = Date.now();
    await db.runAsync(
      "INSERT OR REPLACE INTO cache(key,body,savedAt) VALUES(?,?,?)",
      key,
      JSON.stringify(value),
      cachedAt,
    );
    await db.runAsync(
      "DELETE FROM cache WHERE savedAt < ?",
      cachedAt - 86_400_000,
    );
    return { value, fromCache: false, cachedAt };
  } catch (error) {
    // Auth, contract and configuration failures must never become successful cache reads.
    if (!(error instanceof NetworkError)) throw error;
    const row = await db.getFirstAsync<{ body: string; savedAt: number }>(
      "SELECT body,savedAt FROM cache WHERE key=?",
      key,
    );
    if (!row || Date.now() - row.savedAt > 86_400_000) throw error;
    return {
      value: schema.parse(JSON.parse(row.body)),
      fromCache: true,
      cachedAt: row.savedAt,
    };
  }
}
