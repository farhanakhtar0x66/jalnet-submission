import { SQLiteStorage } from "expo-sqlite/kv-store";
import { appearanceStore } from "./preference";

// The existing app database is retained. This store touches only one device-wide
// appearance key; it never clears private drafts, account caches or tank data.
export const deviceAppearance = appearanceStore(
  new SQLiteStorage("jalnet-cache.db"),
);
