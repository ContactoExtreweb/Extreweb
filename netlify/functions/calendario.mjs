// netlify/functions/calendario.mjs
//
// Calendario suscrito para el iPhone (o cualquier app de calendario):
//   https://extreweb.es/calendario.ics?t=TOKEN
// Devuelve las reuniones del panel en formato iCalendar (.ics). El iPhone lo
// vuelve a descargar solo cada cierto tiempo, así que es de SOLO LECTURA:
// las citas se crean y editan en el panel.
//
// El TOKEN vive en la tabla `ajustes` (clave 'calendario_token') y se puede
// regenerar desde el panel. Sin token válido → 404.
import { createClient } from '@supabase/supabase-js'
import { timingSafeEqual } from 'node:crypto'

export const config = { path: '/calendario.ics' }

// Comparación en tiempo constante (no da pistas del token por lo que tarda)
const igual = (a, b) => {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && timingSafeEqual(x, y)
}

// Texto ICS: hay que escapar \ ; , y los saltos de línea
const esc = (s) =>
  String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')

// Fecha en UTC: 20260918T173000Z (así no hace falta definir zonas horarias)
const utc = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

// El estándar pide líneas de máx. 75 bytes; las que siguen empiezan por espacio
const enc = new TextEncoder()
function plegar(linea) {
  if (enc.encode(linea).length <= 75) return linea
  const trozos = []
  let actual = ''
  let bytes = 0
  for (const ch of linea) {
    const b = enc.encode(ch).length
    const max = trozos.length ? 74 : 75 // el espacio inicial también cuenta
    if (bytes + b > max) {
      trozos.push(actual)
      actual = ''
      bytes = 0
    }
    actual += ch
    bytes += b
  }
  trozos.push(actual)
  return trozos.join('\r\n ')
}

export default async (req) => {
  const token = new URL(req.url).searchParams.get('t') || ''

  const url = process.env.PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('[calendario] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY')
    return new Response('Error de configuración', { status: 500 })
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const { data: ajuste } = await supabase
    .from('ajustes')
    .select('valor')
    .eq('clave', 'calendario_token')
    .maybeSingle()
  if (!token || !ajuste?.valor || !igual(token, ajuste.valor)) {
    return new Response('No encontrado', { status: 404 })
  }

  // Últimos 6 meses + todo lo futuro
  const desde = new Date()
  desde.setMonth(desde.getMonth() - 6)
  const { data: reuniones, error } = await supabase
    .from('reuniones')
    .select('id, titulo, descripcion, fecha, fecha_fin, cliente:clientes(nombre), proyecto:proyectos(titulo)')
    .gte('fecha', desde.toISOString())
    .order('fecha', { ascending: true })
  if (error) {
    console.error('[calendario] Error leyendo reuniones:', error.message)
    return new Response('Error', { status: 500 })
  }

  const ahora = utc(new Date())
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//extreweb//Panel//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:extreweb',
    'X-WR-TIMEZONE:Europe/Madrid',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ]

  for (const r of reuniones || []) {
    const ini = new Date(r.fecha)
    // Sin hora de fin (o fin mal puesto) → 1 hora
    const fin = r.fecha_fin && new Date(r.fecha_fin) > ini ? new Date(r.fecha_fin) : new Date(ini.getTime() + 36e5)
    const detalle = [
      r.cliente?.nombre && `Cliente: ${r.cliente.nombre}`,
      r.proyecto?.titulo && `Proyecto: ${r.proyecto.titulo}`,
      r.descripcion,
    ]
      .filter(Boolean)
      .join('\n')

    lineas.push(
      'BEGIN:VEVENT',
      `UID:reunion-${r.id}@extreweb.es`,
      `DTSTAMP:${ahora}`,
      `DTSTART:${utc(ini)}`,
      `DTEND:${utc(fin)}`,
      `SUMMARY:${esc(r.titulo)}`,
    )
    if (detalle) lineas.push(`DESCRIPTION:${esc(detalle)}`)
    // Aviso 30 min antes
    lineas.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${esc(r.titulo)}`, 'TRIGGER:-PT30M', 'END:VALARM', 'END:VEVENT')
  }

  lineas.push('END:VCALENDAR')

  return new Response(lineas.map(plegar).join('\r\n') + '\r\n', {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="extreweb.ics"',
      'Cache-Control': 'no-store',
    },
  })
}
