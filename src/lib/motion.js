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

/* 2) Aparición al hacer scroll (.fx-up / .fx-row, ver global.css).
      Aquí solo se pone la clase .is-in; la animación es CSS */
function initReveals() {
  const els = document.querySelectorAll('.fx-up, .fx-row');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -10% 0px' });
  els.forEach((el) => io.observe(el));
  // Al imprimir no se hace scroll: que salga todo
  window.addEventListener('beforeprint', () => els.forEach((el) => el.classList.add('is-in')));
}

/* 3) Las animaciones infinitas se pausan mientras su bloque no se ve */
function initPausaFuera() {
  const els = document.querySelectorAll('[data-anim-pausa]');
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle('is-fuera', !e.isIntersecting);
  }, { rootMargin: '200px 0px' });
  els.forEach((el) => io.observe(el));
}

/* 4) Si cambia la altura de la página (se abre una FAQ, el configurador cambia
      de pestaña, termina de cargar una fuente…) ScrollTrigger vuelve a medir.
      Sin esto, las secciones fijadas (Proyectos) empezaban antes o después de tiempo */
function initAutoRefresh() {
  let alto = document.documentElement.scrollHeight;
  let t;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      const nuevo = document.documentElement.scrollHeight;
      if (Math.abs(nuevo - alto) < 2) return;
      alto = nuevo;
      ScrollTrigger.refresh();
    }, 200);
  }).observe(document.body);
}

/* 5) Spring: persigue un objetivo con inercia (para seguir al puntero) */
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
  initPausaFuera();
  initAutoRefresh();
}
document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', boot)
  : boot();
