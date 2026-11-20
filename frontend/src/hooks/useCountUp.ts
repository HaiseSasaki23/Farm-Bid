import { useEffect, useRef, useState } from 'react';

/** Counts a number up to `target`. Skips the animation for people who prefer reduced motion. */
export function useCountUp(target: number, ms = 900) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [value, setValue] = useState(reduced ? target : 0);
  const from = useRef(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setValue(target);
      from.current = target;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(a + (target - a) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, reduced]);

  return value;
}