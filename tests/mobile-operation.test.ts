import { describe, expect, it, vi } from "vitest";
import { operationGate } from "../apps/mobile/src/operation.js";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

describe("mobile action boundary", () => {
  it("blocks a queued duplicate mutation immediately and releases after success", async () => {
    const gate = operationGate();
    const response = deferred<string>();
    const mutation = vi.fn(() => response.promise);
    const first = gate.run(mutation);
    expect(gate.busy).toBe(true);
    expect(await gate.run(mutation)).toBeUndefined();
    expect(mutation).toHaveBeenCalledOnce();
    expect(gate.busy).toBe(true);
    response.resolve("saved");
    expect(await first).toBe("saved");
    expect(gate.busy).toBe(false);
    expect(await gate.run(mutation)).toBe("saved");
    expect(mutation).toHaveBeenCalledTimes(2);
  });

  it("blocks concurrent side effects during failure and allows an explicit retry", async () => {
    const gate = operationGate();
    const response = deferred<void>();
    const duplicate = vi.fn(async () => {});
    const first = gate.run(() => response.promise);
    const failure = expect(first).rejects.toThrow("network unavailable");
    expect(await gate.run(duplicate)).toBeUndefined();
    expect(duplicate).not.toHaveBeenCalled();
    response.reject(new Error("network unavailable"));
    await failure;
    expect(gate.busy).toBe(false);
    await gate.run(duplicate);
    expect(duplicate).toHaveBeenCalledOnce();
    expect(gate.busy).toBe(false);
  });

  it("also releases when an operation throws before returning a promise", async () => {
    const gate = operationGate();
    await expect(
      gate.run(() => {
        throw new Error("failed before request");
      }),
    ).rejects.toThrow("failed before request");
    expect(gate.busy).toBe(false);
    expect(await gate.run(async () => "retry")).toBe("retry");
  });
});
