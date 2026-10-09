// A synchronous boundary for taps queued before React updates disabled controls.
export function operationGate() {
  let busy = false;
  return {
    get busy() {
      return busy;
    },
    async run<T>(operation: () => Promise<T>): Promise<T | undefined> {
      if (busy) return;
      busy = true;
      try {
        return await operation();
      } finally {
        busy = false;
      }
    },
  };
}
