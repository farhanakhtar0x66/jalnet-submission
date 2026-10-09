import { describe, expect, it, vi } from "vitest";
import {
  type AppearancePreference,
  appearanceKey,
  appearanceStore,
  isAppearance,
  resolveTheme,
  systemChromeStyles,
} from "../apps/mobile/src/theme/preference.js";
import { palettes } from "../apps/mobile/src/theme/tokens.js";

function fixture() {
  const rows = new Map<string, string>();
  const storage = {
    getItemAsync: vi.fn(async (key: string) => rows.get(key) ?? null),
    setItemAsync: vi.fn(async (key: string, value: string) => {
      rows.set(key, value);
    }),
  };
  return { rows, storage, open: () => appearanceStore(storage) };
}

describe("appearance resolution and device-wide preference storage port", () => {
  it("accepts exactly system/light/dark", () => {
    for (const value of ["system", "light", "dark"])
      expect(isAppearance(value)).toBe(true);
    for (const value of [null, undefined, 0, "auto", "DARK", {}, ""])
      expect(isAppearance(value)).toBe(false);
  });
  it("follows changing device appearances only in System", () => {
    expect(resolveTheme("system", "light")).toBe("light");
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
  });
  it("uses a deterministic light fallback for unavailable system preferences", () => {
    expect(resolveTheme("system", null)).toBe("light");
    expect(resolveTheme("system", undefined)).toBe("light");
    expect(resolveTheme("system", "unspecified")).toBe("light");
  });
  it("uses readable status and navigation content in each mode", () => {
    expect(systemChromeStyles("light")).toEqual({
      statusBar: "dark-content",
      navigationBar: "dark",
    });
    expect(systemChromeStyles("dark")).toEqual({
      statusBar: "light-content",
      navigationBar: "light",
    });
  });
  it("hydrates a missing preference as System without writing any data", async () => {
    const { open, storage, rows } = fixture();
    expect(await open().load()).toEqual({ appearance: "system", error: null });
    expect(storage.setItemAsync).not.toHaveBeenCalled();
    expect(rows.size).toBe(0);
  });
  it.each(["system", "light", "dark"] as const)(
    "restores an explicitly saved %s preference through a fresh store",
    async (value) => {
      const { open } = fixture();
      await open().save(value);
      expect(await open().load()).toEqual({ appearance: value, error: null });
    },
  );
  it("preserves malformed preference data and unrelated private data during recovery", async () => {
    const { open, rows, storage } = fixture();
    rows.set(appearanceKey, "{private malformed payload}");
    rows.set("private-draft", "retain photo");
    const result = await open().load();
    expect(result.appearance).toBe("system");
    expect(result.error).toContain("Choose an option");
    expect(result.error).not.toContain("private malformed");
    expect(storage.setItemAsync).not.toHaveBeenCalled();
    expect(rows.get(appearanceKey)).toBe("{private malformed payload}");
    expect(rows.get("private-draft")).toBe("retain photo");
  });
  it("redacts a read dependency failure and permits a deliberate recovery write", async () => {
    const { open, storage } = fixture();
    storage.getItemAsync.mockRejectedValueOnce(
      new Error("sqlite private-path credential"),
    );
    const store = open();
    const result = await store.load();
    expect(result.appearance).toBe("system");
    expect(result.error).not.toMatch(/sqlite|private-path|credential/);
    await store.save("dark");
    expect((await store.load()).appearance).toBe("dark");
  });
  it("writes only the appearance key without altering drafts or feature data", async () => {
    const { open, rows, storage } = fixture();
    rows.set("private-draft", "keep");
    rows.set("alice:tank-v1", "600 L simulated");
    await open().save("light");
    expect(storage.setItemAsync).toHaveBeenCalledExactlyOnceWith(
      appearanceKey,
      "light",
    );
    expect(rows.get("private-draft")).toBe("keep");
    expect(rows.get("alice:tank-v1")).toBe("600 L simulated");
  });
  it("rejects invalid writes before storage is touched", async () => {
    const { open, storage } = fixture();
    await expect(open().save("AUTO" as AppearancePreference)).rejects.toThrow(
      "could not be saved",
    );
    expect(storage.setItemAsync).not.toHaveBeenCalled();
  });
  it("serializes rapid choices so the last choice is persisted and hydration waits", async () => {
    const { open, storage } = fixture();
    const original = storage.setItemAsync;
    let release: (() => void) | undefined;
    storage.setItemAsync = vi.fn(async (key, value) => {
      if (value === "dark")
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      await original(key, value);
    });
    const store = open();
    const dark = store.save("dark");
    const light = store.save("light");
    const system = store.save("system");
    const load = store.load();
    await vi.waitFor(() => expect(release).toBeDefined());
    expect(storage.setItemAsync).toHaveBeenCalledTimes(1);
    release?.();
    await Promise.all([dark, light, system]);
    expect(await load).toEqual({ appearance: "system", error: null });
    expect(storage.setItemAsync.mock.calls.map((call) => call[1])).toEqual([
      "dark",
      "light",
      "system",
    ]);
  });
  it("redacts write failures and allows the next choice to save", async () => {
    const { open, storage } = fixture();
    const original = storage.setItemAsync;
    storage.setItemAsync = vi
      .fn()
      .mockRejectedValueOnce(new Error("secret path token"))
      .mockImplementation(original);
    const store = open();
    const first = store.save("dark");
    const next = store.save("light");
    await expect(first).rejects.toThrow("could not be saved");
    await next;
    expect(await store.load()).toEqual({ appearance: "light", error: null });
  });
});

function luminance(hex: string) {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return (
    (linear[0] ?? 0) * 0.2126 +
    (linear[1] ?? 0) * 0.7152 +
    (linear[2] ?? 0) * 0.0722
  );
}
function contrast(a: string, b: string) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((values[0] ?? 0) + 0.05) / ((values[1] ?? 0) + 0.05);
}

describe("semantic palette contrast", () => {
  it.each(["light", "dark"] as const)(
    "keeps normal semantic text at WCAG AA contrast in %s",
    (mode) => {
      const colors = palettes[mode];
      for (const background of [
        colors.background,
        colors.surface,
        colors.surfaceAlt,
      ]) {
        for (const foreground of [
          colors.text,
          colors.muted,
          colors.primary,
          colors.warning,
          colors.danger,
          colors.success,
        ]) {
          expect(
            contrast(foreground, background),
            `${foreground} on ${background}`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
      for (const [foreground, background] of [
        [colors.onPrimary, colors.primary],
        [colors.primary, colors.primarySoft],
        [colors.warning, colors.warningSoft],
        [colors.danger, colors.dangerSoft],
        [colors.success, colors.successSoft],
      ]) {
        expect(
          contrast(foreground ?? "", background ?? ""),
        ).toBeGreaterThanOrEqual(4.5);
      }
    },
  );
});
