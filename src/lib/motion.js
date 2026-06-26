// src/lib/motion.js
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer  = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
export { gsap, ScrollTrigger };

/* 1) Smooth scroll SOLO en escritorio con ratón (móvil usa el nativo) */
function initLenis() {
  if (reduceMotion || !finePointer) return;
  const lenis = new Lenis({ lerp: 0.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

/* 2) Reveal seguro: CSS off-main-thread + red de seguridad */
function initReveals() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      if (el.dataset.revealDelay) el.style.transitionDelay = el.dataset.revealDelay + 'ms';
      el.classList.add('is-in');
      io.unobserve(el);
    }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  els.forEach((el) => io.observe(el));
  // Si algo no llegara a revelarse (pestaña oculta, etc.), se muestra igualmente
  setTimeout(() => els.forEach((el) => el.classList.add('is-in')), 3000);
}

/* 3) Spring: persigue un objetivo con inercia (para seguir al puntero) */
export function spring(onUpdate, { stiffness = 0.08, damping = 0.75, precision = 0.001 } = {}) {
  let current = 0, target = 0, vel = 0, raf = null;
  function loop() {
    vel = (vel + (target - current) * stiffness) * damping;
    current += vel;
    onUpdate(current);
    if (Math.abs(vel) > precision || Math.abs(target - current) > precision) {
      raf = requestAnimationFrame(loop);
    } else { current = target; onUpdate(current); raf = null; }
  }
  return {
    set(v) { target = v; if (raf == null) raf = requestAnimationFrame(loop); },
    stop()  { if (raf != null) cancelAnimationFrame(raf); raf = null; },
  };
}

/* Arranque */
function boot() {
  document.documentElement.setAttribute('data-motion-ready', '');
  initLenis();
  initReveals();
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();