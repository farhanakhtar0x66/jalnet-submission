import { useCallback, useEffect, useRef, useState } from "react";
import { FeatureStateError } from "./persistence";

interface Store<T> {
  load(): Promise<{ value: T; persisted: boolean; scope: string }>;
  save(value: T, expectedScope: string): Promise<void>;
  reset(): Promise<{ value: T; scope: string }>;
}
function message(error: unknown) {
  return error instanceof FeatureStateError
    ? error.message
    : "Local storage unavailable. Retry; your existing saved data was not reset.";
}

export function useLocalFeature<T>(store: Store<T>) {
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
    ++revision.current;
    setLoading(true);
    try {
      const saved = await store.reset();
      if (!mounted.current) return null;
      scope.current = saved.scope;
      setData(saved.value);
      setSaveStatus("saved");
      setSaveError("");
      setLoadError("");
      return saved.value;
    } catch (error) {
      if (mounted.current) setSaveError(message(error));
      return null;
    } finally {
      if (mounted.current) setLoading(false);
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
