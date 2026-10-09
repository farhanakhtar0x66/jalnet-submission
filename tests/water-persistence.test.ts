import { describe, expect, it, vi } from "vitest";
import {
  featureStore,
  type FeatureStorage,
} from "../apps/mobile/src/features/persistence.js";
import { tankStateSchema } from "../packages/contracts/src/water.js";
import {
  simulateTankDay,
  tankDemoFixture,
} from "../packages/domain/src/water.js";

function fixture() {
  let scope = "alice";
  const rows = new Map<string, string>();
  const storage: FeatureStorage = {
    scope: async () => scope,
    read: async (owner, key) => rows.get(`${owner}:${key}`) ?? null,
    write: vi.fn(async (owner, key, data) => {
      rows.set(`${owner}:${key}`, data);
    }),
  };
  const open = () =>
    featureStore("tank-v1", tankStateSchema, tankDemoFixture, storage);
  return {
    rows,
    storage,
    open,
    setScope: (next: string) => {
      scope = next;
    },
  };
}
describe("validated account-scoped local water persistence (storage port simulated)", () => {
  it("loads an absent fixture without fabricating a saved record", async () => {
    const { open, rows } = fixture();
    expect(await open().load()).toEqual({
      value: tankDemoFixture(),
      persisted: false,
      scope: "alice",
    });
    expect(rows.size).toBe(0);
  });
  it("persists actual simulated values and restores them in a new store", async () => {
    const { open } = fixture();
    const value = simulateTankDay(tankDemoFixture());
    await open().save(value, "alice");
    expect((await open().load()).value).toEqual(value);
  });
  it("keeps accounts and unrelated private drafts isolated", async () => {
    const { open, rows, setScope } = fixture();
    rows.set("alice:private-draft", "keep this image");
    await open().save(simulateTankDay(tankDemoFixture()), "alice");
    setScope("bob");
    expect((await open().load()).persisted).toBe(false);
    await open().reset();
    expect(rows.get("alice:private-draft")).toBe("keep this image");
    expect(JSON.parse(rows.get("alice:tank-v1") ?? "null").levelPct).toBe(40);
  });
  it("rejects cross-account saves instead of transferring private state", async () => {
    const { open, rows, setScope } = fixture();
    setScope("bob");
    await expect(open().save(tankDemoFixture(), "alice")).rejects.toThrow(
      "Account changed",
    );
    expect(rows.size).toBe(0);
  });
  it("rejects an account change during hydration", async () => {
    const { open, storage, setScope } = fixture();
    storage.read = async () => {
      setScope("bob");
      return null;
    };
    await expect(open().load()).rejects.toThrow("Account changed");
  });
  it.each([
    "not json",
    JSON.stringify({ ...tankDemoFixture(), version: 2 }),
    JSON.stringify({ ...tankDemoFixture(), levelPct: -1 }),
  ])("does not overwrite corrupt/incompatible storage %j", async (raw) => {
    const { open, rows } = fixture();
    rows.set("alice:tank-v1", raw);
    await expect(open().load()).rejects.toThrow("Saved water data is invalid");
    expect(rows.get("alice:tank-v1")).toBe(raw);
    await open().reset();
    expect((await open().load()).value).toEqual(tankDemoFixture());
  });
  it("orders rapid writes and hydration behind pending saves", async () => {
    const { open, storage } = fixture();
    const original = storage.write;
    let release: (() => void) | undefined;
    storage.write = vi.fn(async (scope, key, data) => {
      if (JSON.parse(data).simulatedDays === 1)
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      await original(scope, key, data);
    });
    const store = open();
    const first = store.save(simulateTankDay(tankDemoFixture()), "alice");
    const second = store.save(
      simulateTankDay(simulateTankDay(tankDemoFixture())),
      "alice",
    );
    const read = store.load();
    await vi.waitFor(() => expect(release).toBeDefined());
    release?.();
    await Promise.all([first, second]);
    expect((await read).value.simulatedDays).toBe(2);
  });
  it("retries after a failed write without claiming success or stalling", async () => {
    const { open, storage } = fixture();
    const original = storage.write;
    storage.write = vi
      .fn()
      .mockRejectedValueOnce(new Error("disk full"))
      .mockImplementation(original);
    const store = open();
    await expect(store.save(tankDemoFixture(), "alice")).rejects.toThrow(
      "disk full",
    );
    expect((await store.load()).persisted).toBe(false);
    await store.save(simulateTankDay(tankDemoFixture()), "alice");
    expect((await store.load()).value.levelPct).toBe(40);
  });
  it("validates saved input before the storage boundary", async () => {
    const { open, storage } = fixture();
    await expect(
      open().save({ ...tankDemoFixture(), levelPct: 101 }, "alice"),
    ).rejects.toThrow();
    expect(storage.write).not.toHaveBeenCalled();
  });
});
