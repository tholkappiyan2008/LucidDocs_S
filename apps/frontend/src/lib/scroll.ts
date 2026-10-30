import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function registerLenis(instance: Lenis | null): void {
  lenis = instance;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Smoothly scroll to an in-page anchor (or element id), accounting for the
 * sticky navigation. Falls back to native scrolling when Lenis is inactive
 * (reduced-motion users, or before the app has mounted).
 */
export function scrollToTarget(target: string, offset = -84): void {
  if (typeof document === 'undefined') return;
  const el = document.querySelector<HTMLElement>(target);
  if (!el) return;

  const reduce = prefersReducedMotion();

  if (lenis) {
    lenis.scrollTo(el, { offset, duration: reduce ? 0 : 1.1 });
    return;
  }

  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
}

/** Instantly return to the top of the document on route change. */
export function scrollToTop(): void {
  if (lenis) {
    lenis.scrollTo(0, { immediate: true });
    return;
  }
  window.scrollTo(0, 0);
}
