import { tankStateSchema } from "@jalnet/contracts/water";
import { tankDemoFixture } from "../../../../packages/domain/src/water";
import { storageScope } from "../api";
import { dbPromise } from "../cache";
import { featureStore } from "./persistence";

let featureDb: typeof dbPromise | undefined;
function database() {
  // Initialize only behind an awaited feature operation, so initialization
  // errors reach the screen's recovery state rather than an eager rejection.
  featureDb ??= dbPromise
    .then(async (db) => {
      await db.execAsync(
        "CREATE TABLE IF NOT EXISTS local_feature_state (scope TEXT NOT NULL, feature TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(scope,feature))",
      );
      return db;
    })
    .catch((error: unknown) => {
      featureDb = undefined;
      throw error;
    });
  return featureDb;
}

export const tankStore = featureStore(
  "tank-v1",
  tankStateSchema,
  tankDemoFixture,
  {
    scope: storageScope,
    async read(scope, feature) {
      const row = await (await database()).getFirstAsync<{ data: string }>(
        "SELECT data FROM local_feature_state WHERE scope=? AND feature=?",
        scope,
        feature,
      );
      return row?.data ?? null;
    },
    async write(scope, feature, data) {
      await (await database()).runAsync(
        "INSERT OR REPLACE INTO local_feature_state(scope,feature,data) VALUES(?,?,?)",
        scope,
        feature,
        data,
      );
    },
  },
);
