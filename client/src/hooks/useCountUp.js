import { useEffect, useRef, useState } from "react";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Counts from 0 up to `target` once the element is scrolled into view.
 *
 * Returns a ref to attach to the container and the current value. Respects
 * prefers-reduced-motion by jumping straight to the final number, and does
 * nothing until the target is actually known (it arrives from the API).
 */
export default function useCountUp(target, { duration = 1500, delay = 0 } = {}) {
  const ref = useRef(null);

  const [value, setValue] = useState(0);

  const [visible, setVisible] = useState(false);

  // Start only when the band is on screen, so the animation is not missed.
  useEffect(() => {
    const node = ref.current;

    if (!node || visible) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);

          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || typeof target !== "number") return undefined;

    const reduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced || target === 0) {
      setValue(target);

      return undefined;
    }

    let frame;

    let startedAt = null;

    const tick = (now) => {
      if (startedAt === null) startedAt = now;

      const elapsed = now - startedAt - delay;

      if (elapsed < 0) {
        frame = requestAnimationFrame(tick);

        return;
      }

      const progress = Math.min(elapsed / duration, 1);

      setValue(Math.round(easeOutCubic(progress) * target));

      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [visible, target, duration, delay]);

  return { ref, value };
}
