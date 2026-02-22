import { useEffect, useRef, useCallback } from 'react';
import anime from 'animejs';

/* ─── Generic ref-based anime.js hook ─── */
export function useAnimeRef<T extends HTMLElement = HTMLElement>(
  params: anime.AnimeParams,
  deps: unknown[] = [],
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const instance = anime({ ...params, targets: ref.current });
    return () => instance.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

/* ─── Staggered children entrance ─── */
export function useStaggerEntrance(
  containerSelector: string,
  childSelector: string,
  options: {
    delay?: number;
    stagger?: number;
    duration?: number;
    translateY?: number[];
    easing?: string;
  } = {},
) {
  useEffect(() => {
    const {
      delay = 100,
      stagger = 80,
      duration = 700,
      translateY = [30, 0],
      easing = 'easeOutExpo',
    } = options;

    const tl = anime.timeline({ easing });
    tl.add({
      targets: `${containerSelector} ${childSelector}`,
      opacity: [0, 1],
      translateY,
      duration,
      delay: anime.stagger(stagger, { start: delay }),
    });

    return () => tl.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/* ─── Fade-in-up for a single element (via ref) ─── */
export function useFadeInUp<T extends HTMLElement = HTMLElement>(
  delay = 0,
  duration = 800,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const a = anime({
      targets: ref.current,
      opacity: [0, 1],
      translateY: [40, 0],
      duration,
      delay,
      easing: 'easeOutExpo',
    });
    return () => a.pause();
  }, [delay, duration]);
  return ref;
}

/* ─── Scale-in pop effect ─── */
export function useScaleIn<T extends HTMLElement = HTMLElement>(
  delay = 0,
  duration = 600,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const a = anime({
      targets: ref.current,
      opacity: [0, 1],
      scale: [0.85, 1],
      duration,
      delay,
      easing: 'easeOutBack',
    });
    return () => a.pause();
  }, [delay, duration]);
  return ref;
}

/* ─── Stagger children inside a ref ─── */
export function useStaggerChildren(
  options: {
    delay?: number;
    stagger?: number;
    duration?: number;
    translateY?: number[];
    translateX?: number[];
    scale?: number[];
    easing?: string;
  } = {},
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const {
      delay = 0,
      stagger = 60,
      duration = 600,
      translateY = [24, 0],
      easing = 'easeOutExpo',
    } = options;

    const params: anime.AnimeParams = {
      targets: ref.current.children,
      opacity: [0, 1],
      translateY,
      duration,
      delay: anime.stagger(stagger, { start: delay }),
      easing,
    };

    if (options.translateX) params.translateX = options.translateX;
    if (options.scale) params.scale = options.scale;

    const a = anime(params);
    return () => a.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}

/* ─── Number counter animation ─── */
export function useCountUp(
  target: number,
  duration = 1200,
  delay = 0,
) {
  const ref = useRef<HTMLElement>(null);
  const valueRef = useRef({ val: 0 });

  useEffect(() => {
    if (!ref.current) return;
    valueRef.current.val = 0;

    const a = anime({
      targets: valueRef.current,
      val: target,
      round: 1,
      duration,
      delay,
      easing: 'easeOutExpo',
      update: () => {
        if (ref.current) {
          ref.current.textContent = String(valueRef.current.val);
        }
      },
    });
    return () => a.pause();
  }, [target, duration, delay]);

  return ref;
}

/* ─── Pulse / breathing glow ─── */
export function usePulse<T extends HTMLElement = HTMLElement>(
  prop: 'opacity' | 'scale' | 'boxShadow' = 'opacity',
  duration = 2000,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!ref.current) return;
    const params: anime.AnimeParams = {
      targets: ref.current,
      duration,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    };
    if (prop === 'opacity') params.opacity = [0.6, 1];
    else if (prop === 'scale') params.scale = [1, 1.05];

    const a = anime(params);
    return () => a.pause();
  }, [prop, duration]);
  return ref;
}

/* ─── Timeline helper (imperative) ─── */
export function useAnimeTimeline() {
  const tlRef = useRef<anime.AnimeTimelineInstance | null>(null);

  const create = useCallback((params?: anime.AnimeParams) => {
    tlRef.current = anime.timeline(params);
    return tlRef.current;
  }, []);

  useEffect(() => {
    return () => {
      tlRef.current?.pause();
    };
  }, []);

  return { create, timeline: tlRef };
}

export default anime;
