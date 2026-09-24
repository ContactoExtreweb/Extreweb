// netlify/functions/visita.mjs
//
// Analítica propia, sin cookies ni terceros. La llama el trozo de script de
// BaseLayout con navigator.sendBeacon en cada página vista (solo en el dominio
// de producción) y guarda una fila en la tabla `visitas` de Supabase.
//
// Privacidad (esto es lo que la hace legal sin banner de cookies):
//   · No se guarda la IP. Se usa solo para calcular una huella `visitante`
//     = SHA-256(sal del día + IP + navegador). Al cambiar la sal cada día, la
//     misma persona es otra huella mañana: no se puede seguir a nadie.
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

const HOST = 'extreweb.es'
const BOTS = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch|facebookexternalhit|whatsapp|telegram/i

const recorta = (v, max) => String(v ?? '').trim().slice(0, max)

// Solo el dominio, y nunca el nuestro (eso es navegación interna, no una visita nueva)
function dominio(ref) {
  try {
    const h = new URL(ref).hostname.replace(/^www\./, '')
    return h === HOST || h === 'localhost' ? null : recorta(h, 120)
  } catch (e) {
    return null
  }
}

export default async (req, context) => {
  // Responde siempre 204: al navegador le da igual y no damos pistas de nada
  const ok = () => new Response(null, { status: 204 })

  if (req.method !== 'POST') return ok()

  const ua = req.headers.get('user-agent') || ''
  if (!ua || BOTS.test(ua)) return ok()

  // Solo desde nuestra web (el beacon manda siempre Origin)
  const origen = req.headers.get('origin') || ''
  if (origen && !origen.endsWith(HOST)) return ok()

  const url = process.env.PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('[visitas] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY')
    return ok()
  }

  let datos
  try {
    datos = await req.json()
  } catch (e) {
    return ok()
  }

  const ruta = recorta(datos?.ruta, 300)
  if (!ruta.startsWith('/') || ruta.startsWith('/admin')) return ok()

  // Huella anónima del día: misma persona = misma huella solo durante hoy
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || ''
  const sal = process.env.ANALITICA_SAL || key
  const dia = new Date().toISOString().slice(0, 10)
  const visitante = createHash('sha256').update(`${dia}|${sal}|${ip}|${ua}`).digest('hex').slice(0, 32)

  const geo = context?.geo || {}
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { error } = await supabase.from('visitas').insert({
    ruta,
    referente: dominio(datos?.ref),
    pais: recorta(geo.country?.code, 4) || null,
    ciudad: recorta(geo.city, 80) || null,
    movil: Number(datos?.ancho) > 0 ? Number(datos.ancho) < 768 : /Mobi|Android/i.test(ua),
    visitante,
  })

  if (error) console.error('[visitas] Error guardando en Supabase:', error.message)
  return ok()
}
