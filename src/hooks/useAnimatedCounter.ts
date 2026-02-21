import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 → target with easeOutExpo curve.
 * Triggers when the element is in view (IntersectionObserver).
 */
export function useAnimatedCounter(
  target: number,
  duration = 2000,
  decimals = 1,
) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();

    function animate() {
      const start = performance.now();

      function tick(now: number) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = eased * target;
        setValue(Number(current.toFixed(decimals)));
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }
  }, [target, duration, decimals]);

  return { value, ref };
}
