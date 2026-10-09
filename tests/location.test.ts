import { afterEach, describe, expect, it, vi } from "vitest";
import { foregroundFix } from "../apps/mobile/src/location.js";

const native = vi.hoisted(() => ({ watch: vi.fn(), remove: vi.fn() }));
vi.mock("../apps/mobile/node_modules/expo-location", () => ({
  Accuracy: { High: 4 },
  watchPositionAsync: native.watch,
}));
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});
describe("bounded foreground location (native provider mocked)", () => {
  it("removes the watch after a fix, including callback-before-subscription resolution", async () => {
    const fix = {
      coords: { latitude: 28.6139, longitude: 77.209, accuracy: 5 },
      timestamp: Date.now(),
    };
    native.watch.mockImplementation((_options, callback) => {
      callback(fix);
      return Promise.resolve({ remove: native.remove });
    });
    expect(await foregroundFix()).toEqual(fix);
    await Promise.resolve();
    expect(native.remove).toHaveBeenCalledOnce();
  });
  it("times out and removes a late native subscription without continuing tracking", async () => {
    vi.useFakeTimers();
    let ready: ((value: { remove: () => void }) => void) | undefined;
    native.watch.mockReturnValue(
      new Promise((resolve) => {
        ready = resolve;
      }),
    );
    const promise = foregroundFix();
    const rejected = expect(promise).rejects.toThrow("Choose a pin");
    await vi.advanceTimersByTimeAsync(15_000);
    await rejected;
    ready?.({ remove: native.remove });
    await Promise.resolve();
    expect(native.remove).toHaveBeenCalledOnce();
  });
});
