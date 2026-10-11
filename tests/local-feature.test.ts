import { afterEach, describe, expect, it, vi } from "vitest";
import { useLocalFeature } from "../apps/mobile/src/features/useLocalFeature.js";
import {
  simulateTankDay,
  tankDemoFixture,
} from "../packages/domain/src/water.js";

// Test the actual hook with a bounded state/ref/effect lifecycle. This is a
// simulated React lifecycle, not a native rendering or SQLite acceptance test.
const lifecycle = vi.hoisted(() => {
  type Cell = {
    value: unknown;
    deps: readonly unknown[] | undefined;
    cleanup: (() => void) | undefined;
  };
  const cells: Cell[] = [];
  let cursor = 0;
  const effects: (() => void)[] = [];
  const cell = (initial: unknown) => {
    const index = cursor++;
    let current = cells[index];
    if (!current) {
      current = { value: initial, deps: undefined, cleanup: undefined };
      cells[index] = current;
    }
    return current;
  };
  const changed = (
    before: readonly unknown[] | undefined,
    after: readonly unknown[],
  ) =>
    !before ||
    before.length !== after.length ||
    after.some((value, index) => !Object.is(value, before[index]));
  return {
    begin: () => {
      cursor = 0;
    },
    commit: () => {
      for (const effect of effects.splice(0)) effect();
    },
    unmount: () => {
      for (const current of cells) current.cleanup?.();
      cells.splice(0);
      effects.splice(0);
      cursor = 0;
    },
    useState(initial: unknown) {
      const current = cell(initial);
      return [
        current.value,
        (value: unknown) => {
          current.value =
            typeof value === "function" ? value(current.value) : value;
        },
      ];
    },
    useRef(initial: unknown) {
      return cell({ current: initial }).value;
    },
    useCallback(callback: unknown, deps: readonly unknown[]) {
      const current = cell(callback);
      if (changed(current.deps, deps)) {
        current.value = callback;
        current.deps = deps;
      }
      return current.value;
    },
    useEffect(
      effect: () => (() => void) | undefined,
      deps: readonly unknown[],
    ) {
      const current = cell(undefined);
      if (changed(current.deps, deps)) {
        current.deps = deps;
        effects.push(() => {
          current.cleanup?.();
          const cleanup = effect();
          current.cleanup = typeof cleanup === "function" ? cleanup : undefined;
        });
      }
    },
  };
});
vi.mock("../apps/mobile/node_modules/react", () => lifecycle);
afterEach(() => lifecycle.unmount());

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
async function fixture() {
  const initial = simulateTankDay(tankDemoFixture());
  const resetValue = tankDemoFixture();
  const store = {
    load: vi.fn(async () => ({
      value: initial,
      persisted: true,
      scope: "alice",
    })),
    save: vi.fn(async (_value: typeof initial, _scope: string) => {}),
    reset: vi.fn(async () => ({ value: resetValue, scope: "alice" })),
  };
  const render = () => {
    lifecycle.begin();
    const result = useLocalFeature(store);
    lifecycle.commit();
    return result;
  };
  render();
  await vi.waitFor(() => expect(render().loading).toBe(false));
  return { initial, resetValue, store, render };
}

describe("local feature hook reset recovery (React lifecycle and storage port simulated)", () => {
  it.each(["resolve", "reject"] as const)(
    "a queued edit during reset cannot leave loading stuck after %s",
    async (outcome) => {
      const { initial, resetValue, store, render } = await fixture();
      const pending = deferred<{ value: typeof initial; scope: string }>();
      store.reset.mockReturnValueOnce(pending.promise);
      const reset = render().reset();
      render().update(simulateTankDay(initial));
      expect(render()).toMatchObject({
        loading: true,
        saveStatus: "saving",
        data: initial,
      });
      expect(store.save).not.toHaveBeenCalled();
      if (outcome === "resolve")
        pending.resolve({ value: resetValue, scope: "alice" });
      else pending.reject(new Error("private-reset-diagnostic"));
      expect(await reset).toEqual(outcome === "resolve" ? resetValue : null);
      const recovered = render();
      expect(recovered).toMatchObject({
        loading: false,
        saveStatus: outcome === "resolve" ? "saved" : "error",
        data: outcome === "resolve" ? resetValue : initial,
      });
      expect(recovered.saveError).not.toContain("private-reset-diagnostic");
      expect(store.save).not.toHaveBeenCalled();
      const next = simulateTankDay(recovered.data ?? initial);
      recovered.update(next);
      await vi.waitFor(() => expect(render().saveStatus).toBe("saved"));
      expect(render().data).toEqual(next);
      expect(store.save).toHaveBeenCalledExactlyOnceWith(next, "alice");
    },
  );

  it("shows pending then error on failed reset, retains tank data and redacts dependency details", async () => {
    const { initial, store, render } = await fixture();
    const pending = deferred<{ value: typeof initial; scope: string }>();
    store.reset.mockReturnValueOnce(pending.promise);
    const reset = render().reset();
    expect(render()).toMatchObject({
      loading: true,
      saveStatus: "saving",
      saveError: "",
      data: initial,
    });
    pending.reject(new Error("private-disk-diagnostic"));
    expect(await reset).toBeNull();
    expect(render()).toMatchObject({
      loading: false,
      saveStatus: "error",
      data: initial,
    });
    expect(render().saveError).toContain("Local storage unavailable");
    expect(render().saveError).not.toContain("private-disk-diagnostic");
    expect(store.save).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"] as const)(
    "an older pending save's %s cannot overwrite reset failure",
    async (outcome) => {
      const { initial, store, render } = await fixture();
      const older = deferred<void>();
      store.save.mockReturnValueOnce(older.promise);
      const edited = simulateTankDay(initial);
      render().update(edited);
      store.reset.mockRejectedValueOnce(new Error("reset failed"));
      expect(await render().reset()).toBeNull();
      const failed = render();
      expect(failed).toMatchObject({
        loading: false,
        saveStatus: "error",
        data: edited,
      });
      if (outcome === "resolve") older.resolve();
      else older.reject(new Error("older save failed"));
      await Promise.resolve();
      expect(render()).toMatchObject({
        loading: false,
        saveStatus: "error",
        saveError: failed.saveError,
        data: edited,
      });
      expect(store.save).toHaveBeenCalledExactlyOnceWith(edited, "alice");
    },
  );

  it("a deliberate successful reset retry clears the error and restores the fixture", async () => {
    const { initial, resetValue, store, render } = await fixture();
    store.reset.mockRejectedValueOnce(new Error("disk full"));
    expect(await render().reset()).toBeNull();
    expect(render()).toMatchObject({ saveStatus: "error", data: initial });
    expect(await render().reset()).toEqual(resetValue);
    expect(render()).toMatchObject({
      loading: false,
      saveStatus: "saved",
      saveError: "",
      loadError: "",
      data: resetValue,
    });
    expect(store.reset).toHaveBeenCalledTimes(2);
  });

  it("an older reset cannot clear a newer pending reset or replace its final result", async () => {
    const { initial, resetValue, store, render } = await fixture();
    const first = deferred<{ value: typeof initial; scope: string }>();
    const second = deferred<{ value: typeof initial; scope: string }>();
    store.reset
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const olderReset = render().reset();
    const newerReset = render().reset();
    first.resolve({ value: simulateTankDay(initial), scope: "alice" });
    expect(await olderReset).toBeNull();
    expect(render()).toMatchObject({
      loading: true,
      saveStatus: "saving",
      data: initial,
    });
    second.resolve({ value: resetValue, scope: "alice" });
    expect(await newerReset).toEqual(resetValue);
    expect(render()).toMatchObject({
      loading: false,
      saveStatus: "saved",
      data: resetValue,
    });
  });
});
