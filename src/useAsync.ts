import { useCallback, useEffect, useState } from "react";

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(fn, deps);
  const reload = useCallback(() => {
    load().then(setData).catch((e: Error) => setError(e.message));
  }, [load]);

  useEffect(reload, [reload]);
  return { data, error, reload };
}
