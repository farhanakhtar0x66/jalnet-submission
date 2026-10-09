import type { ThemeMode } from "./tokens";

export const appearanceKey = "jalnet.appearance.v1";
export const appearanceOptions = ["system", "light", "dark"] as const;
export type AppearancePreference = (typeof appearanceOptions)[number];

export function isAppearance(value: unknown): value is AppearancePreference {
  return value === "system" || value === "light" || value === "dark";
}

export function resolveTheme(
  appearance: AppearancePreference,
  systemMode: ThemeMode | "unspecified" | null | undefined,
): ThemeMode {
  return appearance === "system"
    ? systemMode === "dark"
      ? "dark"
      : "light"
    : appearance;
}

export function systemChromeStyles(mode: ThemeMode) {
  return {
    statusBar:
      mode === "dark" ? ("light-content" as const) : ("dark-content" as const),
    // Expo's Android implementation interprets this value as content color:
    // "light" = light buttons on a dark root, "dark" = dark buttons on light.
    navigationBar: mode === "dark" ? ("light" as const) : ("dark" as const),
  };
}

export interface AppearanceStorage {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
}

const readFailure =
  "Appearance could not be restored. Choose an option to save it again.";
const writeFailure =
  "Appearance changed for this session, but could not be saved. Try again.";

export function appearanceStore(storage: AppearanceStorage) {
  let pending: Promise<void> = Promise.resolve();
  return {
    async load(): Promise<{
      appearance: AppearancePreference;
      error: string | null;
    }> {
      await pending.catch(() => undefined);
      try {
        const value = await storage.getItemAsync(appearanceKey);
        if (value === null) return { appearance: "system", error: null };
        if (!isAppearance(value)) {
          return { appearance: "system", error: readFailure };
        }
        return { appearance: value, error: null };
      } catch {
        return { appearance: "system", error: readFailure };
      }
    },
    save(value: AppearancePreference): Promise<void> {
      if (!isAppearance(value)) {
        return Promise.reject(new Error(writeFailure));
      }
      const write = pending
        .catch(() => undefined)
        .then(() => storage.setItemAsync(appearanceKey, value))
        .catch(() => {
          throw new Error(writeFailure);
        });
      pending = write;
      return write;
    },
  };
}
