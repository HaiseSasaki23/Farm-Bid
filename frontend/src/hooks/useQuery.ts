import { useCallback, useEffect, useRef, useState } from 'react';
import { subscribe } from '../api';

/**
 * Loads data and quietly refreshes it whenever anything in the app (or another tab) writes.
 */
export function useQuery<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const ticket = useRef(0);

  const run = useCallback(async (silent: boolean) => {
    const mine = ++ticket.current;
    if (!silent) setLoading(true);
    try {
      const result = await fnRef.current();
      if (mine !== ticket.current) return;
      setData(result);
      setError(null);
    } catch (e) {
      if (mine !== ticket.current) return;
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      if (mine === ticket.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => subscribe(() => void run(true)), [run]);

  return { data, error, loading, reload: () => run(true) };
}
