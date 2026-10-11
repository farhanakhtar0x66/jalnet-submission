import { useCallback, useEffect, useRef, useState } from "react";
import { FeatureStateError } from "./persistence";

export interface LocalFeatureStore<T> {
  load(): Promise<{ value: T; persisted: boolean; scope: string }>;
  save(value: T, expectedScope: string): Promise<void>;
  reset(): Promise<{ value: T; scope: string }>;
}
function message(error: unknown) {
  return error instanceof FeatureStateError
    ? error.message
    : "Local storage unavailable. Retry; your existing saved data was not reset.";
}

export function useLocalFeature<T>(store: LocalFeatureStore<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveStatus, setSaveStatus] = useState<
    "fixture" | "saving" | "saved" | "error"
  >("fixture");
  const scope = useRef("");
  const mounted = useRef(false);
  const revision = useRef(0);
  const resetInFlight = useRef(false);
  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const saved = await store.load();
      if (!mounted.current) return;
      scope.current = saved.scope;
      setData(saved.value);
      setSaveStatus(saved.persisted ? "saved" : "fixture");
      setSaveError("");
    } catch (error) {
      if (mounted.current) setLoadError(message(error));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [store]);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);
  const update = (value: T) => {
    // A native input callback can already be queued when the reset hides the
    // form. Keep that callback from superseding the confirmed reset.
    if (resetInFlight.current) return;
    const next = ++revision.current;
    setData(value);
    setSaveStatus("saving");
    setSaveError("");
    void store.save(value, scope.current).then(
      () => {
        if (mounted.current && next === revision.current)
          setSaveStatus("saved");
      },
      (error: unknown) => {
        if (mounted.current && next === revision.current) {
          setSaveError(message(error));
          setSaveStatus("error");
        }
      },
    );
  };
  const reset = async () => {
    const next = ++revision.current;
    resetInFlight.current = true;
    setLoading(true);
    setSaveStatus("saving");
    setSaveError("");
    try {
      const saved = await store.reset();
      if (!mounted.current || next !== revision.current) return null;
      scope.current = saved.scope;
      setData(saved.value);
      setSaveStatus("saved");
      setSaveError("");
      setLoadError("");
      return saved.value;
    } catch (error) {
      if (mounted.current && next === revision.current) {
        setSaveError(message(error));
        setSaveStatus("error");
      }
      return null;
    } finally {
      if (next === revision.current) {
        resetInFlight.current = false;
        if (mounted.current) setLoading(false);
      }
    }
  };
  return {
    data,
    loading,
    loadError,
    saveError,
    saveStatus,
    load,
    update,
    reset,
  };
}
