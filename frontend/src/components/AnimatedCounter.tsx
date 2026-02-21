import { useEffect, useRef, useState } from 'react';

interface AnimatedCounterProps {
  /** Use `value` or `end` — both are supported */
  value?: number;
  end?: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function AnimatedCounter({
  value: valueProp,
  end: endProp,
  duration = 2000,
  decimals,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const end = valueProp ?? endProp ?? 0;
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutCubic(progress);
            setCurrent(eased * end);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  const dp = decimals ?? (Number.isInteger(end) ? 0 : 1);
  const display = dp === 0 ? Math.round(current).toLocaleString() : current.toFixed(dp);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
