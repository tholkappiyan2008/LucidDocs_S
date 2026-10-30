import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { registerLenis, prefersReducedMotion } from '../lib/scroll';

/**
 * Wraps the app in Lenis smooth scrolling.
 * Skipped entirely when the visitor prefers reduced motion.
 */
export const SmoothScroll: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const instance = new Lenis({
      lerp: 0.095,
      wheelMultiplier: 1,
      smoothWheel: true,
    });
    registerLenis(instance);

    let frame = requestAnimationFrame(function raf(time) {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    });

    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      registerLenis(null);
    };
  }, []);

  return <>{children}</>;
};

export default SmoothScroll;
