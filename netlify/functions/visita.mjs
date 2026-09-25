// netlify/functions/visita.mjs
//
// Analítica propia, sin cookies ni terceros. La llama public/v.js con
// navigator.sendBeacon desde extreweb.es y desde las webs de clientes que
// estén dadas de alta en la tabla `sitios` (panel → Ajustes → Webs medidas).
//
// Dos tipos de aviso:
//   t: 'v' → una página vista      → tabla `visitas`
//   t: 'r' → cuánto tardó en cargar → tabla `velocidad`
//
// Privacidad (esto es lo que la hace legal sin banner de cookies):
//   · No se guarda la IP. Se usa solo para calcular una huella `visitante`
//     = SHA-256(sal del día + web + IP + navegador). Al cambiar la sal cada día,
//     la misma persona es otra huella mañana: no se puede seguir a nadie.
//   · No se escribe nada en el dispositivo (ni cookies, ni localStorage).
//   · Del referente se guarda solo el dominio, nunca la URL entera.
//
// Variables en Netlify (NO son PUBLIC_, nunca llegan al navegador):
//   PUBLIC_SUPABASE_URL   → ya existe
//   SUPABASE_SERVICE_KEY  → clave service_role de Supabase (scope: Functions)
//   ANALITICA_SAL         → opcional; si no está, se deriva de la service key
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

export const config = { path: '/api/visita' }

const PROPIA = 'extreweb.es'
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch|facebookexternalhit|whatsapp|telegram/i

const recorta = (v, max) => String(v ?? '').trim().slice(0, max)
const sinWww = (h) => String(h || '').toLowerCase().replace(/^www\./, '')

function hostDe(url) {
  try {
    return sinWww(new URL(url).hostname)
  } catch (e) {
    return ''
  }
}

// Webs de clientes dadas de alta. Se guardan unos minutos en memoria para no
// consultar la base en cada visita (Netlify reutiliza la función mientras está "caliente")
let sitiosCache = { hasta: 0, lista: new Set() }
async function sitiosActivos(supabase) {
  if (Date.now() < sitiosCache.hasta) return sitiosCache.lista
  const { data, error } = await supabase.from('sitios').select('dominio').eq('activo', true)
  if (error) console.error('[visitas] No se pudieron leer los sitios:', error.message)
  sitiosCache = { hasta: Date.now() + 5 * 60 * 1000, lista: new Set((data || []).map((s) => sinWww(s.dominio))) }
  return sitiosCache.lista
}

const numero = (v, max) => {
  const n = Math.round(Number(v))
  return Number.isFinite(n) && n > 0 && n < max ? n : null
}

export default async (req, context) => {
  // Responde siempre 204: al navegador le da igual y no damos pistas de nada
  const ok = () => new Response(null, { status: 204 })

  if (req.method !== 'POST') return ok()

  const ua = req.headers.get('user-agent') || ''
  if (!ua || BOTS.test(ua)) return ok()

  // De qué web viene: por la cabecera Origin (o Referer si no la hay). Nunca del cuerpo
  const sitio = hostDe(req.headers.get('origin')) || hostDe(req.headers.get('referer'))
  if (!sitio) return ok()

  const url = process.env.PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('[visitas] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY')
    return ok()
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  if (sitio !== PROPIA && !(await sitiosActivos(supabase)).has(sitio)) return ok()

  // Llega como text/plain (ver v.js), así que se lee como texto
  let datos
  try {
    datos = JSON.parse(await req.text())
  } catch (e) {
    return ok()
  }

  const ruta = recorta(datos?.ruta, 300)
  if (!ruta.startsWith('/') || ruta.startsWith('/admin')) return ok()

  const ancho = Number(datos?.ancho)
  const movil = ancho > 0 ? ancho < 768 : /Mobi|Android/i.test(ua)

  // ---------- Velocidad ----------
  if (datos?.t === 'r') {
    const fila = {
      sitio,
      ruta,
      movil,
      lcp: numero(datos.lcp, 120000),
      carga: numero(datos.carga, 120000),
      ttfb: numero(datos.ttfb, 60000),
    }
    if (!fila.lcp && !fila.carga) return ok()
    const { error } = await supabase.from('velocidad').insert(fila)
    if (error) console.error('[visitas] Error guardando la velocidad:', error.message)
    return ok()
  }

  // ---------- Página vista ----------
  // Huella anónima del día: misma persona = misma huella solo durante hoy
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || ''
  const sal = process.env.ANALITICA_SAL || key
  const dia = new Date().toISOString().slice(0, 10)
  const visitante = createHash('sha256').update(`${dia}|${sal}|${sitio}|${ip}|${ua}`).digest('hex').slice(0, 32)

  // Referente: solo el dominio, y nunca la propia web (eso es navegación interna)
  const ref = hostDe(datos?.ref)
  const geo = context?.geo || {}

  const { error } = await supabase.from('visitas').insert({
    sitio,
    ruta,
    referente: ref && ref !== sitio && ref !== 'localhost' ? recorta(ref, 120) : null,
    pais: recorta(geo.country?.code, 4) || null,
    ciudad: recorta(geo.city, 80) || null,
    movil,
    visitante,
    campana: recorta(datos?.c, 80).toLowerCase() || null,
    fuente: recorta(datos?.f, 60).toLowerCase() || null,
    es_404: datos?.e404 === true,
  })

  if (error) console.error('[visitas] Error guardando en Supabase:', error.message)
  return ok()
}
