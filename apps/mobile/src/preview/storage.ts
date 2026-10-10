import { tankStateSchema } from "@jalnet/contracts/water";
import { SQLiteStorage } from "expo-sqlite/kv-store";
import { tankDemoFixture } from "../../../../packages/domain/src/water";
import { featureStore } from "../features/persistence";

interface DeviceStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

// This is a device-local storage namespace, never an authenticated identity.
const deviceScope = "standalone-device-v1";
const prefix = `${deviceScope}:`;

export function deviceTankStore(storage: DeviceStorage) {
  return featureStore("tank-v1", tankStateSchema, tankDemoFixture, {
    scope: async () => deviceScope,
    read: async (scope, key) => {
      if (scope !== deviceScope)
        throw new Error("Invalid device storage scope");
      return storage.getItemAsync(`${prefix}${key}`);
    },
    write: async (scope, key, value) => {
      if (scope !== deviceScope)
        throw new Error("Invalid device storage scope");
      await storage.setItemAsync(`${prefix}${key}`, value);
    },
  });
}

// Separate database from authenticated caches/drafts. SQLite opens lazily when
// the first My Water operation is awaited, so storage failures stay recoverable.
export const previewTankStore = deviceTankStore(
  new SQLiteStorage("jalnet-preview-water.db"),
);
