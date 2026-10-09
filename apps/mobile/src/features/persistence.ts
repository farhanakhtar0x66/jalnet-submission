import type { z } from "zod";

export interface FeatureStorage {
  scope(): Promise<string>;
  read(scope: string, key: string): Promise<string | null>;
  write(scope: string, key: string, data: string): Promise<void>;
}

export class FeatureStateError extends Error {}

// One store per feature: reads wait for previous writes, including sheet reopen.
export function featureStore<T>(
  key: string,
  schema: z.ZodType<T>,
  fixture: () => T,
  storage: FeatureStorage,
) {
  let queue = Promise.resolve();
  return {
    async load() {
      await queue;
      const scope = await storage.scope();
      const raw = await storage.read(scope, key);
      if ((await storage.scope()) !== scope)
        throw new FeatureStateError("Account changed. Reopen this feature.");
      let value: unknown;
      try {
        value = raw === null ? fixture() : JSON.parse(raw);
      } catch {
        throw new FeatureStateError(
          "Saved water data is invalid. Reset this feature only to recover.",
        );
      }
      const result = schema.safeParse(value);
      if (!result.success)
        throw new FeatureStateError(
          "Saved water data is invalid. Reset this feature only to recover.",
        );
      return { value: result.data, persisted: raw !== null, scope };
    },
    async save(value: T, expectedScope: string) {
      const parsed = schema.parse(value);
      const pending = queue.then(async () => {
        if ((await storage.scope()) !== expectedScope)
          throw new FeatureStateError(
            "Account changed. Original water data was kept; reopen this feature.",
          );
        await storage.write(expectedScope, key, JSON.stringify(parsed));
      });
      // A failed write must not stall future explicit retries.
      queue = pending.then(
        () => undefined,
        () => undefined,
      );
      await pending;
    },
    async reset() {
      const scope = await storage.scope();
      const value = schema.parse(fixture());
      await this.save(value, scope);
      return { value, scope };
    },
  };
}
