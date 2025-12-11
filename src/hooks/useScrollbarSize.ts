import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';

// React 19.2 stable hook for stable callbacks

/**
 * Measure native scrollbar width and expose it as CSS variable --scrollbar-size.
 * - Uses a synchronous layout effect on mount to avoid visual jumps.
 * - Debounces frequent resize events with requestAnimationFrame.
 * - Detects devicePixelRatio changes (handles zoom) via interval.
 * - Safe for SSR (no window/document access).
 */
export default function useScrollbarSize() {
  // Keep last known DPR and scheduled rAF id in refs to avoid re-creation.
  const lastDPRRef = useRef<number>(typeof window !== 'undefined' ? window.devicePixelRatio : 1);
  const scheduledRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Measure scrollbar width and set CSS variable only if changed.
  const measureAndSet = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

    // Create offscreen scrollable element to measure native scrollbar.
    const div = document.createElement('div');
    div.style.width = '100px';
    div.style.height = '100px';
    div.style.overflow = 'scroll';
    div.style.position = 'absolute';
    div.style.top = '-9999px';
    document.body.appendChild(div);

    const scrollbarWidth = div.offsetWidth - div.clientWidth;

    document.body.removeChild(div);

    // Only update style if value changed to reduce layout writes.
    const current = getComputedStyle(document.documentElement)
      .getPropertyValue('--scrollbar-size')
      .trim();
    const newVal = `${scrollbarWidth}px`;
    if (current !== newVal) {
      document.documentElement.style.setProperty('--scrollbar-size', newVal);
    }

    return scrollbarWidth;
  };

  // Stable scheduled measure using rAF to coalesce rapid events.
  const scheduleMeasure = useCallback(() => {
    if (scheduledRef.current != null) return;
    scheduledRef.current = window.requestAnimationFrame(() => {
      scheduledRef.current = null;
      measureAndSet();
    });
  }, []);

  // Use layout effect so the CSS var is set before paint on mount.
  useLayoutEffect(() => {
    // Initial synchronous measurement to avoid UI jumps.
    measureAndSet();
  }, []); // run once on mount

  // Attach listeners and DPR polling in effect; clean up on unmount.
  useEffect(() => {
    const onResize = scheduleMeasure;

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize, {
        passive: true,
      });
    }

    // Poll for devicePixelRatio changes (zoom changes). Polling interval is modest.
    intervalRef.current = window.setInterval(() => {
      const currentDPR = window.devicePixelRatio;
      if (currentDPR !== lastDPRRef.current) {
        lastDPRRef.current = currentDPR;
        measureAndSet();
      }
    }, 300);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onResize);
      }
      if (scheduledRef.current != null) {
        window.cancelAnimationFrame(scheduledRef.current);
        scheduledRef.current = null;
      }
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // scheduleMeasure is stable via useEffectEvent; no deps needed otherwise.
  }, [scheduleMeasure]);
}
