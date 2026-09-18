// netlify/functions/submission-created.mjs
//
// Netlify la ejecuta sola con cada envío VERIFICADO (ya filtrado de spam) de
// Netlify Forms. No se puede llamar desde fuera: Netlify firma cada evento y
// comprueba la firma antes de invocarla.
//
// Copia el mensaje a la tabla `mensajes` de Supabase para verlo en /admin.
// Si algo falla aquí, el mensaje sigue guardado en Netlify → Forms.
//
// Variables en Netlify (NO son PUBLIC_, nunca llegan al navegador):
//   PUBLIC_SUPABASE_URL   → ya existe
//   SUPABASE_SERVICE_KEY  → clave service_role / secret de Supabase (scope: Functions)
import { createClient } from '@supabase/supabase-js'

const recorta = (v, max) => String(v ?? '').trim().slice(0, max)

export default async (req) => {
  const { payload } = await req.json()

  if (payload?.form_name !== 'contacto') return new Response('ignorado')

  const url = process.env.PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    console.error('[mensajes] Faltan PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_KEY')
    return new Response('config', { status: 500 })
  }

  const d = payload.data || {}
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  // netlify_id es único: si Netlify reintenta el evento, no se duplica
  const { error } = await supabase.from('mensajes').upsert(
    {
      netlify_id: payload.id,
      nombre: recorta(d.name, 120) || 'Sin nombre',
      email: recorta(d.email, 160).toLowerCase(),
      servicio: recorta(d.service, 40) || null,
      mensaje: recorta(d.message, 5000),
    },
    { onConflict: 'netlify_id', ignoreDuplicates: true },
  )

  if (error) {
    console.error('[mensajes] Error guardando en Supabase:', error.message)
    return new Response('error', { status: 500 })
  }
  return new Response('ok')
}
