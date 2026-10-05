// src/lib/redes-animadas.js
// Animaciones de la página de Redes Sociales: "Un mes de tu perfil" y "Formatos en acción".
// Móvil 3D con Three.js; la pantalla es un canvas 2D que dibuja una red social genérica con una marca de ejemplo.
// Se carga bajo demanda desde RedesAnimadas.astro (import dinámico), así Three.js solo baja en esta página.
import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { MES, ANTIGUAS, PRIMERO, DIAS } from './redes-datos.js'

const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches
const { clamp, lerp } = THREE.MathUtils
const tramo = (v, a, b) => clamp((v - a) / (b - a), 0, 1)
const suave = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const salida = (t) => 1 - Math.pow(1 - t, 4)
const rebote = (t) => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2)
const oscuroSistema = matchMedia('(prefers-color-scheme: dark)')
const esOscuro = () => { const v = document.documentElement.dataset.theme; return v ? v === 'dark' : oscuroSistema.matches }

// ════════ Marca de ejemplo: "Horno Almendro" (un obrador inventado) ════════
const C = { crema: '#f6efe4', trigo: '#e8c78f', tostado: '#b8763c', cacao: '#3f2a20', oliva: '#6f7c3c', teja: '#c65d3b', blanco: '#fffdf8' }
const SERIF = "'Fraunces Variable', Fraunces, Georgia, serif", SANS = "'Inter Variable', Inter, system-ui, -apple-system, sans-serif"
const HANDLE = 'hornoalmendro'

function texto(g, t, x, y, tam, peso, color, fuente = SANS, alinear = 'left', max) {
  g.font = `${peso} ${tam}px ${fuente}`
  if (max) { const w = g.measureText(t).width; if (w > max) g.font = `${peso} ${tam * max / w}px ${fuente}` }
  g.fillStyle = color; g.textAlign = alinear; g.textBaseline = 'middle'; g.fillText(t, x, y)
}
function lineas(g, ls, x, y, tam, alto, peso, color, fuente, alinear = 'left', max) { ls.forEach((l, i) => texto(g, l, x, y + i * alto, tam, peso, color, fuente, alinear, max)) }
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }

// ── Ilustraciones sencillas (vectoriales) ──
function hogaza(g, cx, cy, w, color = C.tostado) {
  const h = w * 0.58
  const gr = g.createLinearGradient(cx, cy - h / 2, cx, cy + h / 2); gr.addColorStop(0, C.trigo); gr.addColorStop(1, color)
  g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); g.fill()
  g.strokeStyle = 'rgba(255,245,225,.8)'; g.lineWidth = w * 0.035; g.lineCap = 'round'
  for (const k of [-0.28, 0, 0.28]) { g.beginPath(); g.moveTo(cx + (k - 0.12) * w, cy + h * 0.18); g.quadraticCurveTo(cx + k * w, cy - h * 0.05, cx + (k + 0.12) * w, cy - h * 0.22); g.stroke() }
  g.fillStyle = 'rgba(255,255,255,.55)'
  for (let i = 0; i < 14; i++) { const a = i * 2.4, r = (i % 5) / 5; g.beginPath(); g.arc(cx + Math.cos(a) * w * 0.35 * r, cy - h * 0.1 + Math.sin(a) * h * 0.25 * r, w * 0.008, 0, 7); g.fill() }
}
function espiga(g, cx, cy, alto, color) {
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = alto * 0.035; g.lineCap = 'round'
  g.beginPath(); g.moveTo(cx, cy + alto / 2); g.quadraticCurveTo(cx + alto * 0.04, cy, cx, cy - alto / 2); g.stroke()
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {
    const y = cy - alto * 0.38 + i * alto * 0.13
    g.beginPath(); g.ellipse(cx + s * alto * 0.07, y, alto * 0.05, alto * 0.1, s * 0.5, 0, Math.PI * 2); g.fill()
  }
}
function taza(g, cx, cy, w, color) {
  g.fillStyle = color; rr(g, cx - w / 2, cy - w * 0.25, w * 0.8, w * 0.6, w * 0.14); g.fill()
  g.strokeStyle = color; g.lineWidth = w * 0.08; g.beginPath(); g.arc(cx + w * 0.34, cy + w * 0.03, w * 0.14, -Math.PI / 2, Math.PI / 2); g.stroke()
  g.lineWidth = w * 0.045; g.lineCap = 'round'
  for (const k of [-0.2, 0, 0.2]) { g.beginPath(); g.moveTo(cx - w * 0.1 + k * w, cy - w * 0.35); g.bezierCurveTo(cx - w * 0.2 + k * w, cy - w * 0.5, cx + k * w, cy - w * 0.55, cx - w * 0.1 + k * w, cy - w * 0.72); g.stroke() }
}
function horno(g, cx, cy, w) {
  g.fillStyle = C.cacao; g.beginPath(); g.moveTo(cx - w / 2, cy + w * 0.35); g.lineTo(cx - w / 2, cy); g.arc(cx, cy, w / 2, Math.PI, 0); g.lineTo(cx + w / 2, cy + w * 0.35); g.closePath(); g.fill()
  g.fillStyle = '#1e140f'; g.beginPath(); g.moveTo(cx - w * 0.3, cy + w * 0.35); g.lineTo(cx - w * 0.3, cy + w * 0.08); g.arc(cx, cy + w * 0.08, w * 0.3, Math.PI, 0); g.lineTo(cx + w * 0.3, cy + w * 0.35); g.closePath(); g.fill()
  for (const [dx, h, c] of [[-0.12, 0.22, C.teja], [0.02, 0.3, '#f0a340'], [0.14, 0.2, C.teja]]) {
    g.fillStyle = c; g.beginPath(); g.moveTo(cx + (dx - 0.07) * w, cy + w * 0.33); g.quadraticCurveTo(cx + dx * w, cy + (0.33 - h * 2) * w, cx + (dx + 0.07) * w, cy + w * 0.33); g.fill()
  }
}
function cesta(g, cx, cy, w) {
  hogaza(g, cx - w * 0.16, cy - w * 0.1, w * 0.46); hogaza(g, cx + w * 0.18, cy - w * 0.14, w * 0.4, '#a5652f')
  g.fillStyle = '#8a5a33'; g.beginPath(); g.moveTo(cx - w / 2, cy - w * 0.04); g.lineTo(cx + w / 2, cy - w * 0.04); g.quadraticCurveTo(cx + w * 0.44, cy + w * 0.36, cx, cy + w * 0.36); g.quadraticCurveTo(cx - w * 0.44, cy + w * 0.36, cx - w / 2, cy - w * 0.04); g.fill()
  g.strokeStyle = 'rgba(255,230,190,.35)'; g.lineWidth = w * 0.02
  for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(cx - w * (0.5 - i * 0.03), cy - w * 0.04 + i * w * 0.09); g.lineTo(cx + w * (0.5 - i * 0.03), cy - w * 0.04 + i * w * 0.09); g.stroke() }
}
function bunuelos(g, cx, cy, w) {
  for (const [dx, dy, r] of [[-0.22, 0.05, 0.2], [0.18, 0.08, 0.22], [0, -0.16, 0.2], [0.02, 0.25, 0.17]]) {
    const x = cx + dx * w, y = cy + dy * w, gr = g.createRadialGradient(x - r * w * 0.3, y - r * w * 0.3, 0, x, y, r * w)
    gr.addColorStop(0, '#f3c77d'); gr.addColorStop(1, '#b8722f'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * w, 0, 7); g.fill()
    g.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.9) * r * w * 0.55, y + Math.sin(k * 2.3) * r * w * 0.5, w * 0.009, 0, 7); g.fill() }
  }
}
function cuenco(g, cx, cy, w) {
  g.fillStyle = C.teja; g.beginPath(); g.ellipse(cx, cy, w / 2, w * 0.12, 0, 0, Math.PI * 2); g.fill()
  g.fillStyle = '#d9a35e'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(cx + Math.cos(i * 2.7) * w * 0.4 * ((i % 7) / 7), cy - w * 0.04 + Math.sin(i * 1.3) * w * 0.07, w * 0.03, 0, 7); g.fill() }
  g.fillStyle = C.teja; g.beginPath(); g.moveTo(cx - w / 2, cy); g.quadraticCurveTo(cx, cy + w * 0.62, cx + w / 2, cy); g.fill()
}

// ── Diseños de las publicaciones (cuadradas) ──
const DISENOS = {
  masaMadre(g, x, y, l) { g.fillStyle = C.cacao; g.fillRect(x, y, l, l); hogaza(g, x + l * 0.5, y + l * 0.62, l * 0.62); lineas(g, ['48 horas', 'de paciencia.'], x + l * 0.08, y + l * 0.14, l * 0.1, l * 0.11, 800, C.crema, SERIF); texto(g, 'MASA MADRE', x + l * 0.08, y + l * 0.9, l * 0.042, 700, C.trigo) },
  horario(g, x, y, l) { g.fillStyle = C.crema; g.fillRect(x, y, l, l); texto(g, 'Abrimos antes', x + l / 2, y + l * 0.22, l * 0.07, 700, C.tostado, SANS, 'center'); texto(g, '7:00', x + l / 2, y + l * 0.52, l * 0.3, 800, C.cacao, SERIF, 'center'); texto(g, 'de lunes a sábado', x + l / 2, y + l * 0.8, l * 0.055, 500, C.cacao, SANS, 'center') },
  receta(g, x, y, l) { g.fillStyle = C.trigo; g.fillRect(x, y, l, l); cuenco(g, x + l * 0.5, y + l * 0.62, l * 0.56); lineas(g, ['Migas', 'extremeñas'], x + l / 2, y + l * 0.16, l * 0.1, l * 0.11, 800, C.cacao, SERIF, 'center'); texto(g, 'RECETA DEL DOMINGO', x + l / 2, y + l * 0.9, l * 0.042, 700, C.cacao, SANS, 'center') },
  obrador(g, x, y, l) { g.fillStyle = '#2a1c15'; g.fillRect(x, y, l, l); horno(g, x + l / 2, y + l * 0.52, l * 0.52); texto(g, 'Así empieza el día', x + l / 2, y + l * 0.14, l * 0.075, 700, C.crema, SERIF, 'center'); texto(g, '4:30 · DETRÁS DEL OBRADOR', x + l / 2, y + l * 0.9, l * 0.042, 700, C.trigo, SANS, 'center') },
  oferta(g, x, y, l) { g.fillStyle = C.oliva; g.fillRect(x, y, l, l); hogaza(g, x + l * 0.3, y + l * 0.46, l * 0.36); taza(g, x + l * 0.7, y + l * 0.5, l * 0.24, C.crema); texto(g, '+', x + l / 2, y + l * 0.47, l * 0.1, 700, C.crema, SANS, 'center'); texto(g, 'Barra + café', x + l / 2, y + l * 0.16, l * 0.085, 700, C.crema, SERIF, 'center'); texto(g, '2,50 €', x + l / 2, y + l * 0.8, l * 0.14, 800, C.crema, SERIF, 'center') },
  sorteo(g, x, y, l) { g.fillStyle = C.teja; g.fillRect(x, y, l, l); cesta(g, x + l / 2, y + l * 0.56, l * 0.56); texto(g, 'SORTEO', x + l / 2, y + l * 0.14, l * 0.06, 800, C.crema, SANS, 'center'); texto(g, 'Una cesta de otoño', x + l / 2, y + l * 0.23, l * 0.075, 700, C.blanco, SERIF, 'center'); texto(g, 'Comenta a quién se la regalarías', x + l / 2, y + l * 0.9, l * 0.042, 600, C.crema, SANS, 'center') },
  encuesta(g, x, y, l) { g.fillStyle = C.cacao; g.fillRect(x, y, l / 2, l); g.fillStyle = C.crema; g.fillRect(x + l / 2, y, l / 2, l); hogaza(g, x + l * 0.25, y + l * 0.5, l * 0.34); hogaza(g, x + l * 0.75, y + l * 0.5, l * 0.34, '#9a5a28'); texto(g, 'Masa madre', x + l * 0.25, y + l * 0.78, l * 0.055, 700, C.crema, SANS, 'center'); texto(g, 'De pueblo', x + l * 0.75, y + l * 0.78, l * 0.055, 700, C.cacao, SANS, 'center'); texto(g, '¿Cuál te llevas?', x + l / 2, y + l * 0.15, l * 0.075, 800, C.teja, SERIF, 'center') },
  bunuelos(g, x, y, l) { g.fillStyle = '#f2e3cc'; g.fillRect(x, y, l, l); bunuelos(g, x + l / 2, y + l * 0.56, l * 0.5); lineas(g, ['Buñuelos y', 'huesos de santo'], x + l / 2, y + l * 0.14, l * 0.075, l * 0.085, 800, C.cacao, SERIF, 'center'); texto(g, 'YA A LA VENTA · ENCARGOS', x + l / 2, y + l * 0.9, l * 0.042, 700, C.tostado, SANS, 'center') },
  // Publicaciones antiguas (septiembre)
  viejo1(g, x, y, l) { g.fillStyle = '#e9dcc6'; g.fillRect(x, y, l, l); espiga(g, x + l / 2, y + l * 0.5, l * 0.6, C.tostado) },
  viejo2(g, x, y, l) { g.fillStyle = C.tostado; g.fillRect(x, y, l, l); texto(g, 'Vuelta al cole', x + l / 2, y + l * 0.45, l * 0.09, 800, C.crema, SERIF, 'center'); texto(g, 'bocadillos desde 1,80 €', x + l / 2, y + l * 0.6, l * 0.05, 600, C.crema, SANS, 'center') },
  viejo3(g, x, y, l) { g.fillStyle = C.crema; g.fillRect(x, y, l, l); hogaza(g, x + l / 2, y + l / 2, l * 0.6, '#9a5a28') },
}
const pintar = (nombre, g, x, y, l) => { g.save(); g.beginPath(); g.rect(x, y, l, l); g.clip(); DISENOS[nombre](g, x, y, l); g.restore() }


// ── Interfaz de la red social (genérica) dibujada a 390 × 844 puntos ──
const PW = 390, PH = 844
const tinta = (o) => o ? { fondo: '#000000', texto: '#f5f5f7', suave: '#a1a1a6', linea: '#262628', boton: '#262628' } : { fondo: '#ffffff', texto: '#111111', suave: '#737373', linea: '#e6e6e6', boton: '#efefef' }
function estado(g, t) {
  texto(g, '9:41', 44, 24, 16, 600, t.texto)
  g.fillStyle = t.texto
  for (let i = 0; i < 4; i++) { const h = 4 + i * 2.5; rr(g, 302 + i * 5, 29 - h, 3.4, h, 1); g.fill() }
  g.strokeStyle = t.texto; g.lineWidth = 2; g.lineCap = 'round'
  for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(333, 29, 3 + i * 3.4, Math.PI * 1.25, Math.PI * 1.75); g.stroke() }
  g.lineWidth = 1.2; g.globalAlpha = 0.45; rr(g, 346, 18, 23, 11.5, 3.5); g.stroke(); g.globalAlpha = 1
  rr(g, 348, 20, 16, 7.5, 2); g.fill()
}
// Iconos de línea
const IC = {
  corazon(g, x, y, s, lleno, c) { g.beginPath(); g.moveTo(x, y + s * 0.35); g.bezierCurveTo(x - s * 0.55, y - s * 0.05, x - s * 0.35, y - s * 0.55, x, y - s * 0.22); g.bezierCurveTo(x + s * 0.35, y - s * 0.55, x + s * 0.55, y - s * 0.05, x, y + s * 0.35); g.closePath(); if (lleno) { g.fillStyle = c; g.fill() } else { g.strokeStyle = c; g.lineWidth = 1.9; g.stroke() } },
  comentario(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 1.9; g.beginPath(); g.arc(x, y, s * 0.42, Math.PI * 0.62, Math.PI * 2.38); g.lineTo(x - s * 0.44, y + s * 0.44); g.closePath(); g.stroke() },
  enviar(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 1.9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - s * 0.45, y - s * 0.38); g.lineTo(x + s * 0.45, y - s * 0.38); g.lineTo(x - s * 0.05, y + s * 0.45); g.lineTo(x - s * 0.12, y - s * 0.05); g.closePath(); g.moveTo(x - s * 0.12, y - s * 0.05); g.lineTo(x + s * 0.45, y - s * 0.38); g.stroke() },
  guardar(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 1.9; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - s * 0.32, y + s * 0.45); g.lineTo(x - s * 0.32, y - s * 0.45); g.lineTo(x + s * 0.32, y - s * 0.45); g.lineTo(x + s * 0.32, y + s * 0.45); g.lineTo(x, y + s * 0.2); g.closePath(); g.stroke() },
  casa(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 2; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x - s * 0.42, y - s * 0.05); g.lineTo(x, y - s * 0.45); g.lineTo(x + s * 0.42, y - s * 0.05); g.lineTo(x + s * 0.42, y + s * 0.45); g.lineTo(x - s * 0.42, y + s * 0.45); g.closePath(); g.stroke() },
  lupa(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 2; g.beginPath(); g.arc(x - s * 0.08, y - s * 0.08, s * 0.32, 0, 7); g.moveTo(x + s * 0.16, y + s * 0.16); g.lineTo(x + s * 0.42, y + s * 0.42); g.stroke() },
  mas(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 2; rr(g, x - s * 0.42, y - s * 0.42, s * 0.84, s * 0.84, s * 0.22); g.moveTo(x, y - s * 0.2); g.lineTo(x, y + s * 0.2); g.moveTo(x - s * 0.2, y); g.lineTo(x + s * 0.2, y); g.stroke() },
  video(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 2; rr(g, x - s * 0.42, y - s * 0.42, s * 0.84, s * 0.84, s * 0.22); g.stroke(); g.fillStyle = c; g.beginPath(); g.moveTo(x - s * 0.1, y - s * 0.16); g.lineTo(x + s * 0.18, y); g.lineTo(x - s * 0.1, y + s * 0.16); g.fill() },
  rejilla(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 1.8; rr(g, x - s * 0.42, y - s * 0.42, s * 0.84, s * 0.84, s * 0.1); g.moveTo(x - s * 0.14, y - s * 0.42); g.lineTo(x - s * 0.14, y + s * 0.42); g.moveTo(x + s * 0.14, y - s * 0.42); g.lineTo(x + s * 0.14, y + s * 0.42); g.moveTo(x - s * 0.42, y - s * 0.14); g.lineTo(x + s * 0.42, y - s * 0.14); g.moveTo(x - s * 0.42, y + s * 0.14); g.lineTo(x + s * 0.42, y + s * 0.14); g.stroke() },
  atras(g, x, y, s, c) { g.strokeStyle = c; g.lineWidth = 2.2; g.lineCap = g.lineJoin = 'round'; g.beginPath(); g.moveTo(x + s * 0.2, y - s * 0.4); g.lineTo(x - s * 0.2, y); g.lineTo(x + s * 0.2, y + s * 0.4); g.stroke() },
  puntos(g, x, y, s, c) { g.fillStyle = c; for (const d of [-1, 0, 1]) { g.beginPath(); g.arc(x + d * s * 0.3, y, s * 0.08, 0, 7); g.fill() } },
  nota(g, x, y, s, c) { g.fillStyle = c; g.beginPath(); g.ellipse(x - s * 0.18, y + s * 0.28, s * 0.16, s * 0.12, -0.4, 0, 7); g.fill(); g.fillRect(x - s * 0.04, y - s * 0.4, s * 0.07, s * 0.7); g.fillRect(x - s * 0.04, y - s * 0.4, s * 0.34, s * 0.1) },
}
function avatar(g, x, y, r, anillo) {
  if (anillo) { const gr = g.createLinearGradient(x - r, y + r, x + r, y - r); gr.addColorStop(0, '#f0a340'); gr.addColorStop(1, C.teja); g.strokeStyle = gr; g.lineWidth = r * 0.12; g.beginPath(); g.arc(x, y, r * 1.12, 0, 7); g.stroke() }
  g.fillStyle = C.cacao; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill()
  espiga(g, x, y, r * 1.3, C.trigo)
}
function barraInferior(g, t) {
  g.fillStyle = t.fondo; g.fillRect(0, PH - 84, PW, 84)
  g.fillStyle = t.linea; g.fillRect(0, PH - 84, PW, 1)
  const ic = ['casa', 'lupa', 'mas', 'video']
  ic.forEach((n, i) => IC[n](g, 39 + i * 78, PH - 58, 24, t.texto))
  avatar(g, 351, PH - 58, 12, false)
  g.fillStyle = t.texto; rr(g, PW / 2 - 67, PH - 13, 134, 5, 3); g.fill()
}

// Perfil con la cuadrícula de publicaciones (las fichas se animan al entrar)
function perfil(g, t, fichas, numPub, resaltar) {
  g.fillStyle = t.fondo; g.fillRect(0, 0, PW, PH)
  estado(g, t)
  texto(g, HANDLE, 20, 72, 21, 700, t.texto)
  IC.mas(g, 318, 72, 22, t.texto); IC.puntos(g, 360, 72, 22, t.texto)
  avatar(g, 60, 142, 38, true)
  ;[[numPub, 'publicaciones'], ['1.204', 'seguidores'], ['186', 'seguidos']].forEach(([n, l], i) => {
    texto(g, String(n), 170 + i * 82, 132, 17, 700, t.texto, SANS, 'center')
    texto(g, l, 170 + i * 82, 152, 12.5, 400, t.texto, SANS, 'center')
  })
  texto(g, 'Horno Almendro', 20, 204, 14.5, 700, t.texto)
  texto(g, 'Panadería', 20, 223, 13.5, 400, t.suave)
  lineas(g, ['Pan de masa madre y dulces de siempre.', 'Encargos por mensaje · Perfil de ejemplo'], 20, 243, 13.5, 19, 400, t.texto)
  ;['Seguir', 'Mensaje'].forEach((l, i) => { g.fillStyle = i ? t.boton : '#0095f6'; rr(g, 20 + i * 178, 284, 170, 34, 9); g.fill(); texto(g, l, 105 + i * 178, 301, 14, 600, i ? t.texto : '#ffffff', SANS, 'center') })
  ;['Pan', 'Dulces', 'Encargos', 'Horario'].forEach((l, i) => {
    const x = 48 + i * 82
    g.strokeStyle = t.linea; g.lineWidth = 1.5; g.beginPath(); g.arc(x, 368, 30, 0, 7); g.stroke()
    g.save(); g.beginPath(); g.arc(x, 368, 27, 0, 7); g.clip(); pintar(['viejo3', 'bunuelos', 'sorteo', 'horario'][i], g, x - 27, 341, 54); g.restore()
    texto(g, l, x, 413, 12, 400, t.texto, SANS, 'center')
  })
  IC.rejilla(g, PW / 4, 452, 22, t.texto); IC.video(g, PW * 3 / 4, 452, 22, t.suave)
  g.fillStyle = t.texto; g.fillRect(0, 474, PW / 2, 1.5); g.fillStyle = t.linea; g.fillRect(PW / 2, 474, PW / 2, 1)
  const l = (PW - 2) / 3
  g.save(); g.beginPath(); g.rect(0, 476, PW, PH - 84 - 476); g.clip()
  for (const f of fichas) {
    const col = f.pos % 3, fila = Math.floor(f.pos / 3)
    const x = col * (l + 1), y = 476 + fila * (l + 1)
    f.x = f.x ?? x; f.y = f.y ?? y
    g.globalAlpha = f.alfa ?? 1
    const e = f.escala ?? 1
    g.save(); g.translate(f.x + l / 2, f.y + l / 2); g.scale(e, e); pintar(f.d, g, -l / 2, -l / 2, l); g.restore()
    if (resaltar === f.d) { g.strokeStyle = '#0095f6'; g.lineWidth = 3; g.strokeRect(f.x + 1.5, f.y + 1.5, l - 3, l - 3) }
    g.globalAlpha = 1
  }
  g.restore()
  barraInferior(g, t)
}

// Publicación en el feed (también sirve para el carrusel)
function publicacion(g, t, { dibujo, pie, gustas, meGusta = 0, corazon = 0, diapo = null, atras = false }) {
  g.fillStyle = t.fondo; g.fillRect(0, 0, PW, PH)
  estado(g, t)
  if (atras) { IC.atras(g, 24, 72, 22, t.texto); texto(g, 'Publicaciones', PW / 2, 72, 16, 700, t.texto, SANS, 'center') }
  else texto(g, 'Inicio', 20, 72, 22, 800, t.texto)
  avatar(g, 36, 124, 16, true)
  texto(g, HANDLE, 62, 118, 13.5, 600, t.texto); texto(g, 'Horno Almendro · Ejemplo', 62, 135, 11.5, 400, t.suave)
  IC.puntos(g, 362, 124, 20, t.texto)
  const y0 = 150
  dibujo(g, 0, y0, PW)
  if (corazon > 0) { // corazón grande al dar "me gusta"
    const e = rebote(tramo(corazon, 0, 0.35)) * (1 - tramo(corazon, 0.75, 1))
    if (e > 0) { g.save(); g.globalAlpha = Math.min(1, e * 1.4); g.translate(PW / 2, y0 + PW / 2); g.scale(e, e); IC.corazon(g, 0, 0, 110, true, '#ffffff'); g.restore() }
  }
  if (diapo) { // carrusel: contador y puntos
    g.fillStyle = 'rgba(0,0,0,.55)'; rr(g, PW - 58, y0 + 12, 44, 24, 12); g.fill(); texto(g, `${diapo.i + 1}/${diapo.n}`, PW - 36, y0 + 24, 12, 600, '#fff', SANS, 'center')
    for (let k = 0; k < diapo.n; k++) { g.fillStyle = k === diapo.i ? '#0095f6' : t.linea; g.beginPath(); g.arc(PW / 2 + (k - (diapo.n - 1) / 2) * 11, y0 + PW + 22, 3.2, 0, 7); g.fill() }
  }
  const ya = y0 + PW + 22
  IC.corazon(g, 26, ya, 26, meGusta > 0, meGusta > 0 ? '#ff3040' : t.texto)
  IC.comentario(g, 70, ya, 26, t.texto); IC.enviar(g, 112, ya, 24, t.texto); IC.guardar(g, 364, ya, 24, t.texto)
  texto(g, `${(gustas + (meGusta > 0 ? 1 : 0)).toLocaleString('es-ES')} Me gusta`, 16, ya + 32, 13.5, 700, t.texto)
  // pie de foto en dos líneas
  g.font = `400 13.5px ${SANS}`
  const palabras = pie.split(' '), filas = ['']
  for (const p of palabras) { const prueba = (filas.at(-1) ? filas.at(-1) + ' ' : '') + p; if (g.measureText((filas.length === 1 ? HANDLE + ' ' : '') + prueba).width > PW - 32 && filas.length < 3) filas.push(p); else filas[filas.length - 1] = prueba }
  texto(g, HANDLE, 16, ya + 56, 13.5, 700, t.texto)
  g.font = `700 13.5px ${SANS}`; const wH = g.measureText(HANDLE + ' ').width
  filas.forEach((f, i) => texto(g, f, i ? 16 : 16 + wH, ya + 56 + i * 19, 13.5, 400, t.texto))
  texto(g, 'Ver los 12 comentarios', 16, ya + 60 + filas.length * 19, 13.5, 400, t.suave)
  barraInferior(g, t)
}

// Reel: animación vertical a pantalla completa (6 s en bucle)
function reel(g, t, tt, pausa) {
  const ciclo = 6, k = (tt % ciclo) / ciclo
  const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, '#2a1a12'); gr.addColorStop(1, '#6b3a1c'); g.fillStyle = gr; g.fillRect(0, 0, PW, PH)
  // la masa sube en el horno
  const sube = suave(tramo(k, 0.05, 0.55))
  g.save(); g.translate(PW / 2, 470); g.scale(1, 0.7 + sube * 0.3)
  hogaza(g, 0, 0, 250 * (0.8 + sube * 0.2), sube > 0.6 ? '#9a5a28' : C.tostado)
  g.restore()
  g.fillStyle = `rgba(255,170,70,${0.18 + 0.1 * Math.sin(tt * 6)})`; g.beginPath(); g.ellipse(PW / 2, 600, 220, 40, 0, 0, 7); g.fill()
  const frases = [['48 horas', 0.02, 0.3], ['de masa madre', 0.3, 0.6], ['recién horneada', 0.6, 0.98]]
  frases.forEach(([f, a, b]) => {
    const e = tramo(k, a, a + 0.08) * (1 - tramo(k, b - 0.06, b))
    if (e > 0) { g.globalAlpha = e; texto(g, f, PW / 2, 220 + (1 - e) * 18, 44, 800, C.crema, SERIF, 'center', PW - 60); g.globalAlpha = 1 }
  })
  estado(g, { texto: '#ffffff' })
  texto(g, 'Reels', 20, 72, 22, 800, '#ffffff')
  ;[['corazon', '1.024'], ['comentario', '38'], ['enviar', '96']].forEach(([n, c], i) => {
    const y = 520 + i * 70
    if (n === 'corazon') IC.corazon(g, 356, y, 30, false, '#fff'); else IC[n](g, 356, y, 28, '#fff')
    texto(g, c, 356, y + 28, 12, 600, '#fff', SANS, 'center')
  })
  avatar(g, 34, 690, 15, false); texto(g, HANDLE, 58, 690, 13.5, 700, '#fff')
  g.strokeStyle = '#fff'; g.lineWidth = 1; rr(g, 172, 679, 60, 22, 7); g.stroke(); texto(g, 'Seguir', 202, 690, 12, 600, '#fff', SANS, 'center')
  texto(g, 'Así sale del horno nuestra hogaza de cada mañana.', 20, 722, 13, 400, '#fff', SANS, 'left', PW - 90)
  IC.nota(g, 26, 750, 16, '#fff')
  g.save(); g.beginPath(); g.rect(40, 740, 200, 20); g.clip(); texto(g, 'Sonido original · Horno Almendro  ·  Sonido original', 40 - (tt * 30) % 180, 750, 12, 500, '#fff'); g.restore()
  g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, PH - 88, PW, 2.5); g.fillStyle = '#fff'; g.fillRect(0, PH - 88, PW * k, 2.5)
  if (pausa) { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.arc(PW / 2, 420, 38, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(PW / 2 - 12, 400); g.lineTo(PW / 2 + 18, 420); g.lineTo(PW / 2 - 12, 440); g.fill() }
  barraInferior(g, { fondo: '#000', texto: '#fff', linea: '#222' })
}

// Historia: 3 pantallas con barras de progreso y una encuesta que se puede votar
function historia(g, t, i, prog, voto, animVoto) {
  const fondos = [['#f3e2c7', '#e0b77e'], [C.cacao, '#5a3a2a'], [C.oliva, '#4f5a2a']][i]
  const gr = g.createLinearGradient(0, 0, 0, PH); gr.addColorStop(0, fondos[0]); gr.addColorStop(1, fondos[1]); g.fillStyle = gr; g.fillRect(0, 0, PW, PH)
  for (let k = 0; k < 3; k++) { g.fillStyle = 'rgba(255,255,255,.4)'; rr(g, 10 + k * 124, 52, 118, 3, 2); g.fill(); g.fillStyle = '#fff'; rr(g, 10 + k * 124, 52, 118 * (k < i ? 1 : k === i ? prog : 0), 3, 2); g.fill() }
  avatar(g, 30, 82, 15, false); texto(g, HANDLE, 54, 82, 13.5, 700, i === 0 ? C.cacao : '#fff'); texto(g, '2 h', 170, 82, 13, 400, i === 0 ? 'rgba(63,42,32,.6)' : 'rgba(255,255,255,.7)')
  estado(g, { texto: i === 0 ? C.cacao : '#fff' })
  if (i === 0) {
    taza(g, PW / 2 + 10, 380, 150, C.cacao)
    lineas(g, ['Buenos días,', 'Villanueva'], PW / 2, 560, 40, 46, 800, C.cacao, SERIF, 'center')
    texto(g, 'Ya tenemos pan caliente', PW / 2, 660, 16, 600, C.tostado, SANS, 'center')
  } else if (i === 1) {
    texto(g, '¿Cuál te llevas hoy?', PW / 2, 200, 30, 800, C.crema, SERIF, 'center')
    hogaza(g, PW / 2 - 80, 330, 130); hogaza(g, PW / 2 + 80, 330, 130, '#9a5a28')
    // pegatina de encuesta
    g.fillStyle = '#ffffff'; rr(g, 45, 430, 300, 170, 22); g.fill()
    const op = [['Masa madre', 64], ['De pueblo', 36]]
    op.forEach(([l, pct], k) => {
      const y = 462 + k * 64
      g.fillStyle = '#f1f1f1'; rr(g, 62, y, 266, 50, 14); g.fill()
      if (voto != null) {
        const w = 266 * pct / 100 * salida(animVoto)
        g.fillStyle = k === voto ? 'rgba(149,90,40,.35)' : 'rgba(0,0,0,.08)'; rr(g, 62, y, Math.max(w, 1), 50, 14); g.fill()
        texto(g, `${Math.round(pct * salida(animVoto))} %`, 312, y + 25, 15, 700, '#333', SANS, 'right')
      }
      texto(g, l, voto == null ? 195 : 80, y + 25, 16, 700, k === voto ? '#955a28' : '#222', SANS, voto == null ? 'center' : 'left')
    })
    texto(g, voto == null ? 'Toca una opción para votar' : 'Gracias por votar', PW / 2, 640, 14, 600, 'rgba(255,255,255,.8)', SANS, 'center')
  } else {
    cesta(g, PW / 2, 360, 200)
    lineas(g, ['Encarga tu', 'cesta de otoño'], PW / 2, 540, 36, 42, 800, C.crema, SERIF, 'center')
    g.fillStyle = '#ffffff'; rr(g, PW / 2 - 105, 620, 210, 44, 22); g.fill()
    texto(g, '🔗  Hacer encargo', PW / 2, 642, 15, 700, C.oliva, SANS, 'center')
  }
  g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.2; rr(g, 16, PH - 70, 300, 44, 22); g.stroke()
  texto(g, 'Enviar mensaje', 34, PH - 48, 14, 400, 'rgba(255,255,255,.85)')
  IC.corazon(g, 340, PH - 48, 26, false, '#fff'); IC.enviar(g, 372, PH - 48, 22, '#fff')
  g.fillStyle = '#fff'; rr(g, PW / 2 - 67, PH - 13, 134, 5, 3); g.fill()
}

// ════════ Móvil 3D (el mismo de Proyectos) con una pantalla dibujada en canvas ════════
function crearMovil(contenedor, { alPintar, alTocar, alArrastrar }) {
  const lienzo = contenedor.querySelector('canvas')
  let renderer = null
  try { renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true }) } catch {}
  const escala = innerWidth < 700 ? 1.5 : 2
  const pantalla2d = Object.assign(document.createElement('canvas'), { width: PW * escala, height: PH * escala })
  const g = pantalla2d.getContext('2d')
  g.setTransform(escala, 0, 0, escala, 0, 0)
  if (!renderer) { contenedor.classList.add('sin-3d'); contenedor.append(pantalla2d); pantalla2d.style.cssText = 'position:absolute;left:50%;top:50%;translate:-50% -50%;height:92%;border-radius:36px;box-shadow:0 20px 50px rgba(0,0,0,.2)'; return { g, pedir: () => alPintar(g, 0) } }
  renderer.setClearColor(0x000000, 0)
  renderer.toneMapping = THREE.NeutralToneMapping
  const escena = new THREE.Scene()
  escena.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture
  const luz = new THREE.DirectionalLight(0xffffff, 1.2); luz.position.set(3, 5, 4); escena.add(luz)
  const camara = new THREE.PerspectiveCamera(26, 1, 0.1, 50)
  const fis = (o) => new THREE.MeshPhysicalMaterial(o)
  const mMarco = fis({ metalness: 1, roughness: 0.26, anisotropy: 0.2 })
  const mCristal = fis({ color: 0x08080a, metalness: 0, roughness: 0.06, clearcoat: 1 })
  const mTrasera = fis({ metalness: 0, roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.35 })
  const mMeseta = fis({ metalness: 0, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 })
  const mLente = fis({ color: 0x07070a, metalness: 0.1, roughness: 0.04, clearcoat: 1, iridescence: 0.9, iridescenceIOR: 1.3 })
  const mReflejo = fis({ color: 0x000000, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.5, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false })
  function forma(w, h, r) {
    const x = -w / 2, y = -h / 2, s = new THREE.Shape()
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0)
    s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2)
    s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
    return s
  }
  function placa(w, h, r) {
    const geo = new THREE.ShapeGeometry(forma(w, h, r), 16), p = geo.attributes.position, uv = geo.attributes.uv
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, p.getY(i) / h + 0.5)
    return geo
  }
  function losa(w, h, d, r, bisel) {
    const geo = new THREE.ExtrudeGeometry(forma(w, h, r), { depth: d - 2 * bisel, bevelEnabled: true, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 5, curveSegments: 16 })
    geo.translate(0, 0, -(d - 2 * bisel) / 2)
    return geo
  }
  const MW = 0.8, MH = 1.7, MD = 0.085, MR = 0.125, BIS = 0.028
  const movil = new THREE.Group(), cuerpoG = new THREE.Group()
  movil.add(cuerpoG)
  const tex = new THREE.CanvasTexture(pantalla2d)
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
  const SW = MW - 0.05, SH = MH - 0.05
  const pantalla = new THREE.Mesh(placa(SW, SH, MR - 0.022), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }))
  pantalla.position.z = MD / 2 + 0.0012
  const isla = new THREE.Mesh(placa(0.2, 0.058, 0.029), new THREE.MeshBasicMaterial({ color: 0x000000 }))
  isla.position.set(0, SH / 2 - 0.042, MD / 2 + 0.0018)
  const reflejo = new THREE.Mesh(placa(MW - 0.004, MH - 0.004, MR), mReflejo)
  reflejo.position.z = MD / 2 + 0.0024; reflejo.raycast = () => {}
  const frente = new THREE.Mesh(placa(MW - 0.004, MH - 0.004, MR - 0.002), mCristal); frente.position.z = MD / 2 + 0.0006
  const trasera = new THREE.Mesh(placa(MW - 0.004, MH - 0.004, MR - 0.002), mTrasera); trasera.rotation.y = Math.PI; trasera.position.z = -MD / 2 - 0.0006
  const camaras = new THREE.Group(); camaras.position.set(0.19, 0.6, -MD / 2 - 0.0006)
  const meseta = new THREE.Mesh(losa(0.34, 0.36, 0.018, 0.085, 0.006), mMeseta); meseta.position.z = -0.009; camaras.add(meseta)
  for (const [x, y] of [[0.07, 0.085], [0.07, -0.085], [-0.075, 0]]) {
    const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.062, 0.024, 40), mMarco); aro.rotation.x = Math.PI / 2; aro.position.set(x, y, -0.03)
    const lente = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.026, 40), mLente); lente.rotation.x = Math.PI / 2; lente.position.set(x, y, -0.031)
    camaras.add(aro, lente)
  }
  const botones = [[1, 0.3, 0.2], [-1, 0.52, 0.07], [-1, 0.36, 0.12], [-1, 0.2, 0.12]].map(([lado, y, h]) => { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, h, 4, 12), mMarco); b.position.set(lado * (MW / 2 + BIS + 0.004), y, 0); return b })
  cuerpoG.add(new THREE.Mesh(losa(MW, MH, MD, MR, BIS), mMarco), frente, pantalla, isla, reflejo, trasera, camaras, ...botones)
  escena.add(movil)
  function tema() { const o = esOscuro(); mMarco.color.set(o ? '#3a3a3d' : '#c7c4bf'); mTrasera.color.set(o ? '#2a2a2d' : '#e4e2dd'); mMeseta.color.set(o ? '#2a2a2d' : '#e4e2dd'); sucio = true; pedir() }
  new MutationObserver(tema).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  oscuroSistema.addEventListener('change', tema)

  function redimensionar() {
    const w = lienzo.clientWidth, h = lienzo.clientHeight
    if (!w || !h) return
    renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.75 : 2))
    renderer.setSize(w, h, false)
    camara.aspect = w / h
    const tg = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2))
    const dist = Math.max((MH * 1.12) / 2 / tg, (MW * 1.9) / 2 / (tg * camara.aspect))
    camara.position.set(0, 0.02, dist); camara.lookAt(0, 0, 0); camara.updateProjectionMatrix()
    pedir()
  }
  new ResizeObserver(redimensionar).observe(lienzo)

  // Puntero: sobre la pantalla se usa la app (tocar / deslizar); fuera, gira el móvil
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
  function enPantalla(e) {
    const r = lienzo.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camara)
    const hit = ray.intersectObject(pantalla, false)[0]
    return hit ? { x: hit.uv.x * PW, y: (1 - hit.uv.y) * PH } : null
  }
  let arr = null, yaw = 0, meta = 0, pitch = 0, metaP = 0
  lienzo.addEventListener('pointerdown', (e) => { arr = { x0: e.clientX, x: e.clientX, t0: performance.now(), p: enPantalla(e), movido: false }; lienzo.setPointerCapture(e.pointerId); pedir() })
  lienzo.addEventListener('pointermove', (e) => {
    if (arr) {
      const dx = e.clientX - arr.x
      if (Math.abs(e.clientX - arr.x0) > 6) arr.movido = true
      if (arr.p && alArrastrar?.(e.clientX - arr.x0, false)) {} // la app se queda el gesto (carrusel)
      else meta = clamp(meta + dx * 0.006, -0.8, 0.8)
      arr.x = e.clientX
    } else if (e.pointerType === 'mouse') {
      const r = lienzo.getBoundingClientRect()
      meta = ((e.clientX - r.left) / r.width - 0.5) * 0.25; metaP = ((e.clientY - r.top) / r.height - 0.5) * 0.12
      lienzo.classList.toggle('sobre', !!enPantalla(e))
    }
    pedir()
  })
  const soltar = (e) => {
    if (!arr) return
    const a = arr; arr = null; meta = 0; metaP = 0
    if (e.type === 'pointerup') {
      if (a.p && a.movido) alArrastrar?.(e.clientX - a.x0, true)
      else if (!a.movido && performance.now() - a.t0 < 450 && a.p) alTocar?.(a.p.x, a.p.y)
    }
    pedir()
  }
  lienzo.addEventListener('pointerup', soltar); lienzo.addEventListener('pointercancel', soltar)
  lienzo.addEventListener('pointerleave', () => { if (!arr) { meta = metaP = 0; lienzo.classList.remove('sobre'); pedir() } })

  let visible = false, raf = 0, ultimo = 0, tiempo = 0, sucio = true, entrada = quieto ? 1 : 0, fotograma = 0, dtApp = 0
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) pedir() }, { threshold: 0 }).observe(lienzo)
  function pedir() { if (visible && !raf) raf = requestAnimationFrame(frame) }
  function frame(ahora) {
    raf = 0
    const dt = Math.min((ahora - (ultimo || ahora)) / 1000, 0.05); ultimo = ahora; tiempo += dt
    if (entrada < 1) entrada = Math.min(1, entrada + dt / 1.2)
    // La app dibuja a 30 fps como mucho (subir la textura cuesta) y solo si algo ha cambiado
    fotograma++; dtApp += dt
    if (fotograma % 2 === 0 || sucio) {
      if (alPintar(g, dtApp, sucio)) tex.needsUpdate = true
      dtApp = 0; sucio = false
    }
    yaw += (meta - yaw) * (1 - Math.exp(-dt * (arr ? 14 : 5))); pitch += (metaP - pitch) * (1 - Math.exp(-dt * 5))
    const e = salida(entrada)
    movil.position.y = (1 - e) * -1.2 + (quieto ? 0 : Math.sin(tiempo * 1.1) * 0.015)
    movil.rotation.set(-0.05 + pitch, -0.28 + yaw + (1 - e) * -1.4, 0.02, 'YXZ')
    renderer.render(escena, camara)
    if (visible) pedir()
    else ultimo = 0
  }
  tema()
  return { g, pedir }
}

// Arranca las dos secciones (la llama RedesAnimadas.astro cuando se acercan a la pantalla)
export async function iniciarRedes() {
  await Promise.race([Promise.all(['500 16px "Inter Variable"', '700 16px "Inter Variable"', '800 16px "Inter Variable"', '700 16px "Fraunces Variable"', '800 16px "Fraunces Variable"'].map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2000))]).catch(() => {})
  // Cada bloque solo arranca si está en la página (la portada solo lleva "Formatos")
  // ════════ 1 · Un mes de tu perfil ════════
  if (document.getElementById('redes-mes')) {
    const seccion = document.getElementById('redes-mes')
    const diasEl = seccion.querySelector('[data-dias]'), cuenta = seccion.querySelector('[data-cuenta]'), informe = seccion.querySelector('[data-informe]')
    const celdas = []
    diasEl.replaceChildren() // el HTML trae el calendario sin JS; aquí se rehace con las miniaturas
    for (let k = 0; k < PRIMERO; k++) { const v = document.createElement('span'); v.className = 'dia vacio'; diasEl.append(v) }
    for (let d = 1; d <= DIAS; d++) {
      const pub = MES.find((p) => p.dia === d)
      const el = document.createElement(pub ? 'button' : 'span')
      el.className = 'dia'
      el.innerHTML = `<b>${d}</b>`
      if (pub) {
        el.type = 'button'
        el.setAttribute('aria-label', `${d} de octubre: ${pub.pie}`)
        const mini = Object.assign(document.createElement('canvas'), { width: 96, height: 96 })
        pintar(pub.d, mini.getContext('2d'), 0, 0, 96)
        el.prepend(mini)
        el.insertAdjacentHTML('beforeend', `<span class="redes">${pub.redes.map((r) => `<i class="${r}"></i>`).join('')}</span>`)
        el.addEventListener('click', () => abrir(pub))
      }
      diasEl.append(el); celdas[d] = el
    }

    // Estado: el cursor recorre el mes; cada publicación entra en la cuadrícula del perfil
    let fichas = ANTIGUAS.map((d, i) => ({ d, pos: i }))
    let cursor = 0, publicadas = 0, estadoMes = 'espera', detalle = null, tDetalle = 0, empezado = false, tMes = 0
    const DIA = 0.26 // segundos por día
    function publicar(p) {
      for (const f of fichas) f.pos++
      fichas.unshift({ d: p.d, pos: 0, escala: 0.4, alfa: 0, nueva: 0 })
      publicadas++
      cuenta.textContent = `${publicadas} de 8 publicaciones`
      celdas[p.dia].classList.add('publicado')
    }
    function reiniciar() {
      fichas = ANTIGUAS.map((d, i) => ({ d, pos: i })); cursor = 0; publicadas = 0; tMes = 0; detalle = null
      estadoMes = quieto ? 'libre' : 'mes'
      celdas.forEach((c) => c?.classList.remove('publicado', 'pasado', 'hoy', 'elegido'))
      informe.classList.remove('listo'); contar(false)
      cuenta.textContent = '0 de 8 publicaciones'
      if (quieto) { MES.forEach(publicar); fichas.forEach((f) => { f.escala = 1; f.alfa = 1 }); celdas.forEach((c) => c?.classList.add('pasado')); informe.classList.add('listo'); contar(true) }
    }
    function contar(si) {
      informe.querySelectorAll('[data-cifra]').forEach((b) => {
        const fin = Number(b.dataset.cifra), mil = b.hasAttribute('data-mil')
        const fmt = (v) => mil ? `${(v / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })} mil` : Math.round(v).toLocaleString('es-ES', { useGrouping: 'always' })
        if (!si) { b.textContent = '0'; return }
        if (quieto) { b.textContent = fmt(fin); return }
        const t0 = performance.now()
        const paso = () => { const k = salida(Math.min(1, (performance.now() - t0) / 1100)); b.textContent = fmt(fin * k); if (k < 1) requestAnimationFrame(paso) }
        paso()
      })
    }
    function abrir(p) {
      if (estadoMes === 'mes') { // si aún no ha llegado, adelanta el mes hasta ese día
        if (cursor < p.dia) celdas[cursor]?.classList.remove('hoy') // si no, el recuadro de "hoy" se quedaba en el día de antes
        while (cursor < p.dia) { cursor++; const pub = MES.find((m) => m.dia === cursor); if (pub) publicar(pub); celdas[cursor].classList.add('pasado') }
      }
      celdas.forEach((c) => c?.classList.remove('elegido'))
      celdas[p.dia].classList.add('elegido')
      detalle = p; tDetalle = 0; corazon = 0; cambio = true
      if (estadoMes === 'mes') tMes = Math.max(tMes, (p.dia - 1) * DIA)
      movil.pedir()
    }
    seccion.querySelector('[data-repetir]').addEventListener('click', () => { reiniciar(); cambio = true; movil.pedir() })

    let corazon = 0, cambio = true // cambio: algo que obliga a redibujar (abrir/cerrar, reiniciar)
    const t = () => tinta(esOscuro())
    const movil = crearMovil(seccion.querySelector('[data-movil]'), {
      alPintar(g, dt, forzar) {
        const tt = t()
        const antesMes = estadoMes === 'mes' && empezado
        if (estadoMes === 'mes' && empezado) {
          tMes += dt
          const nuevo = Math.min(31, Math.floor(tMes / DIA) + 1)
          while (cursor < nuevo) {
            if (cursor) celdas[cursor].classList.remove('hoy')
            cursor++
            celdas[cursor].classList.add('pasado', 'hoy')
            const pub = MES.find((m) => m.dia === cursor)
            if (pub) publicar(pub)
          }
          if (tMes > 31 * DIA + 0.6) { estadoMes = 'libre'; celdas[31].classList.remove('hoy'); informe.classList.add('listo'); contar(true) }
        }
        // animación de las fichas hacia su sitio
        const l = (PW - 2) / 3, k = 1 - Math.exp(-dt * 9)
        let mueve = false
        for (const f of fichas) {
          const x0 = (f.pos % 3) * (l + 1), y0 = 476 + Math.floor(f.pos / 3) * (l + 1)
          if (f.x == null || Math.abs(f.x - x0) + Math.abs(f.y - y0) > 0.3 || (f.escala != null && f.escala < 0.995)) mueve = true
          const x = (f.pos % 3) * (l + 1), y = 476 + Math.floor(f.pos / 3) * (l + 1)
          f.x = f.x == null ? x : f.x + (x - f.x) * k; f.y = f.y == null ? y : f.y + (y - f.y) * k
          if (f.escala != null) f.escala += (1 - f.escala) * k
          if (f.alfa != null) f.alfa += (1 - f.alfa) * k
        }
        if (!forzar && !antesMes && !mueve && !(detalle && (tDetalle < 0.4 || (corazon && corazon < 1.1))) && !cambio) return false
        cambio = false
        if (detalle) {
          tDetalle += dt; if (corazon) corazon += dt
          const entrada = salida(Math.min(1, tDetalle / 0.35))
          perfil(g, tt, fichas, ANTIGUAS.length + publicadas, detalle.d)
          g.save(); g.translate(PW * (1 - entrada), 0)
          publicacion(g, tt, { dibujo: (gg, x, y, lado) => pintar(detalle.d, gg, x, y, lado), pie: detalle.pie, gustas: detalle.gustas, meGusta: corazon, corazon, atras: true })
          g.restore()
        } else perfil(g, tt, fichas, ANTIGUAS.length + publicadas)
        return true
      },
      alTocar(x, y) {
        if (detalle) {
          if (y < 100 && x < 80) { detalle = null; cambio = true; celdas.forEach((c) => c?.classList.remove('elegido')); return } // volver al perfil
          if (y > 150 && y < 150 + PW) { corazon = corazon || 0.001 }
          return
        }
        // tocar una ficha de la cuadrícula abre esa publicación
        const l = (PW - 2) / 3
        if (y > 476 && y < PH - 84) {
          const pos = Math.floor((y - 476) / (l + 1)) * 3 + Math.floor(x / (l + 1)), f = fichas.find((q) => q.pos === pos)
          const p = f && MES.find((m) => m.d === f.d)
          if (p) abrir(p)
        }
      },
    })
    new IntersectionObserver(([e]) => { if (e.isIntersecting && !empezado) { empezado = true; movil.pedir() } }, { threshold: 0.45 }).observe(seccion.querySelector('[data-movil]'))
    reiniciar()
  }

  // ════════ 2 · Formatos en acción ════════
  if (document.getElementById('redes-formatos')) {
    const seccion = document.getElementById('redes-formatos')
    const botones = [...seccion.querySelectorAll('[data-f]')], caja = seccion.querySelector('[data-formatos]'), info = seccion.querySelector('[data-fmt-info]')
    const TEXTOS = {
      post: ['Publicación', 'Una imagen diseñada para tu marca y un texto que invita a hacer algo: pasarse por la tienda, comentar o encargar.', 'Toca la foto para darle me gusta'],
      carrusel: ['Carrusel', 'Varias diapositivas para contar más: tu catálogo, un paso a paso o antes y después. Es de lo que más se guarda y se comparte.', 'Desliza la foto con el dedo'],
      reel: ['Reel', 'Vídeo vertical corto, con ritmo y texto en pantalla, pensado para llegar a gente que aún no te sigue.', 'Toca para pausar'],
      historia: ['Historia', 'Contenido del día a día que dura 24 horas: novedades, encuestas y enlaces para que te pidan directamente.', 'Vota en la encuesta · toca los lados para avanzar'],
    }
    const DIAPOS = [
      { n: 'Hogaza', c: C.cacao, t: C.crema, pan: C.tostado },
      { n: 'Pan de pueblo', c: C.crema, t: C.cacao, pan: '#9a5a28' },
      { n: 'Chapata', c: C.oliva, t: C.crema, pan: C.trigo },
      { n: 'Integral', c: '#e9dcc6', t: C.cacao, pan: '#7a4a24' },
      { n: 'Brioche', c: C.teja, t: C.blanco, pan: '#e7a64e' },
    ]
    const diapo = (i) => (g, x, y, l) => {
      const d = DIAPOS[i]
      g.save(); g.beginPath(); g.rect(x, y, l, l); g.clip()
      g.fillStyle = d.c; g.fillRect(x, y, l, l)
      hogaza(g, x + l / 2, y + l * 0.55, l * 0.56, d.pan)
      texto(g, `${i + 1} de 5 · Panes de la casa`, x + l / 2, y + l * 0.14, l * 0.04, 700, d.t, SANS, 'center')
      texto(g, d.n, x + l / 2, y + l * 0.86, l * 0.1, 800, d.t, SERIF, 'center')
      g.restore()
    }

    let formato = 'post', tf = 0, corazon = 0, meGusta = 0
    let car = { i: 0, off: 0, arr: null, t: 0 }
    let reelT = 0, pausa = false
    let hist = { i: 0, t: 0, voto: null, animVoto: 0 }
    let auto = !quieto, relojAuto = 0, seVe = false
    function elegir(f, manual) {
      if (manual) pararAuto()
      formato = f; tf = 0; corazon = 0; meGusta = 0; car = { i: 0, off: 0, arr: null, t: 0 }; reelT = 0; pausa = false; hist = { i: 0, t: 0, voto: null, animVoto: 0 }
      botones.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.f === f)))
      info.classList.add('cambiando')
      setTimeout(() => {
        const [ti, tx, ge] = TEXTOS[f]
        info.querySelector('[data-fmt-titulo]').textContent = ti; info.querySelector('[data-fmt-texto]').textContent = tx; info.querySelector('[data-fmt-gesto]').textContent = ge
        info.classList.remove('cambiando')
      }, quieto ? 0 : 180)
      reiniciarAuto()
      movil.pedir()
    }
    botones.forEach((b) => b.addEventListener('click', () => elegir(b.dataset.f, true)))
    function reiniciarAuto() {
      clearTimeout(relojAuto); caja.classList.remove('auto'); void caja.offsetWidth
      if (!auto || !seVe) return
      caja.classList.add('auto')
      relojAuto = setTimeout(() => { const i = botones.findIndex((b) => b.dataset.f === formato); elegir(botones[(i + 1) % botones.length].dataset.f) }, 7000)
    }
    function pararAuto() { auto = false; clearTimeout(relojAuto); caja.classList.remove('auto') }
    new IntersectionObserver(([e]) => { seVe = e.intersectionRatio > 0.4; seVe ? reiniciarAuto() : (clearTimeout(relojAuto), caja.classList.remove('auto')) }, { threshold: [0, 0.4] }).observe(seccion)

    const t = () => tinta(esOscuro())
    const movil = crearMovil(seccion.querySelector('[data-movil]'), {
      alPintar(g, dt) {
        tf += dt
        const tt = t()
        if (formato === 'post') {
          if (!quieto && tf > 1.6 && !meGusta && auto) { meGusta = 1; corazon = 0.001 } // demostración: se da "me gusta" solo
          if (corazon) corazon += dt
          publicacion(g, tt, { dibujo: (gg, x, y, l) => pintar('oferta', gg, x, y, l), pie: MES[4].pie, gustas: MES[4].gustas, meGusta, corazon })
        } else if (formato === 'carrusel') {
          if (!car.arr && !quieto) { car.t += dt; if (car.t > 1.8) { car.t = 0; car.i = (car.i + 1) % 5; car.off = PW } }
          const objetivo = car.arr != null ? car.arr : 0
          car.off += (objetivo - car.off) * (1 - Math.exp(-dt * 14))
          const desliz = (car.off / PW)
          publicacion(g, tt, {
            dibujo: (gg, x, y, l) => {
              for (const k of [-1, 0, 1]) { const i = car.i + k; if (i < 0 || i > 4) continue; diapo(i)(gg, x + (k + desliz) * l, y, l) }
            }, pie: 'Cinco panes, cinco maneras de empezar el día. ¿Con cuál te quedas?', gustas: 287, diapo: { i: car.i, n: 5 },
          })
        } else if (formato === 'reel') {
          if (!pausa) reelT += dt
          reel(g, tt, reelT, pausa)
        } else {
          if (!quieto) hist.t += dt
          const dur = hist.i === 1 && hist.voto == null ? 7 : 4
          if (hist.t > dur) { hist.t = 0; hist.i = (hist.i + 1) % 3; if (hist.i === 0) { hist.voto = null; hist.animVoto = 0 } }
          if (hist.voto != null) hist.animVoto = Math.min(1, hist.animVoto + dt * 1.6)
          historia(g, tt, hist.i, quieto ? 1 : Math.min(1, hist.t / dur), hist.voto, hist.animVoto)
        }
        return true
      },
      alTocar(x, y) {
        pararAuto()
        if (formato === 'post' || formato === 'carrusel') { if (y > 150 && y < 150 + PW) { meGusta = 1; corazon = 0.001 } }
        else if (formato === 'reel') pausa = !pausa
        else {
          if (hist.i === 1 && y > 462 && y < 590 && x > 62 && x < 328) { if (hist.voto == null) { hist.voto = y < 526 ? 0 : 1; hist.t = 0 } return }
          if (x < PW / 3) { hist.i = Math.max(0, hist.i - 1); hist.t = 0 } else { hist.i = (hist.i + 1) % 3; hist.t = 0 }
        }
      },
      alArrastrar(dx, fin) {
        if (formato !== 'carrusel') return false
        pararAuto()
        if (!fin) { car.arr = clamp(dx * 1.4, -PW, PW); if ((car.i === 0 && dx > 0) || (car.i === 4 && dx < 0)) car.arr *= 0.3; return true }
        if (dx < -50 && car.i < 4) { car.i++; car.off += PW } else if (dx > 50 && car.i > 0) { car.i--; car.off -= PW }
        car.arr = null; car.t = 0
        return true
      },
    })
    elegir('post')
  }

}
