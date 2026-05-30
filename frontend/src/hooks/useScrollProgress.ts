import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Returns a MutableRefObject<number> whose `.current` is continuously
 * updated (0 → 1) based on the scroll progress of `containerRef`.
 *
 * Designed to be read inside R3F `useFrame` so the 3D scene can
 * respond to scroll without triggering React re-renders.
 */
export function useScrollProgress(containerRef: React.RefObject<HTMLDivElement | null>) {
  const progress = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        progress.current = self.progress;
      },
    });

    return () => {
      trigger.kill();
    };
  }, [containerRef]);

  return progress;
}
