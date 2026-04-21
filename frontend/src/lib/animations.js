import { useEffect, useRef, useState } from 'react';

/**
 * useScrollReveal : révèle un bloc quand il entre dans le viewport
 * via IntersectionObserver. Respecte prefers-reduced-motion.
 *
 * Usage :
 *   const ref = useScrollReveal();
 *   <section ref={ref} className="hc-reveal">...</section>
 *
 * La classe `.hc-reveal` (dans prototype.css) pose opacity:0 + translateY,
 * le hook ajoute `.hc-revealed` qui déclenche la transition CSS.
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    // Reduced motion : on révèle immédiatement
    const prefersReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
      el.classList.add('hc-revealed');
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('hc-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: options.threshold ?? 0.12,
        rootMargin: options.rootMargin ?? '0px 0px -40px 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin]);

  return ref;
}

/**
 * useCountUp : anime un nombre de 0 → valeur cible sur une durée donnée.
 * Utilisé sur les KPIs admin pour donner un effet "tableau de bord qui
 * s'éveille". Respecte prefers-reduced-motion (renvoie la valeur finale
 * directement).
 */
export function useCountUp(target, duration = 900, decimals = 0) {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const num = Number(target) || 0;

    const prefersReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduce) {
      setValue(num);
      prev.current = num;
      return undefined;
    }

    const start = prev.current;
    const delta = num - start;
    if (delta === 0) {
      setValue(num);
      return undefined;
    }

    const startTime = performance.now();
    let frame;
    const tick = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const current = start + delta * eased;
      setValue(Number(current.toFixed(decimals)));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setValue(num);
        prev.current = num;
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, decimals]);

  return value;
}
