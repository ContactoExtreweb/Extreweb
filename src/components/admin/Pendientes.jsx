// src/components/admin/Pendientes.jsx — "lo que se nos puede pasar", arriba del Inicio
// Junta en una lista lo que pide atención: mensajes olvidados, presupuestos sin
// respuesta, cobros vencidos, renovaciones y dominios que caducan, notas del día
// y reseñas de Google por pedir o recordar.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro, diaISO, plazo, diasHasta, hace } from './helpers.js'
import { estadoResena, tieneWebPublicada } from './Resenas.jsx'

const DIA = 864e5
const haceDias = (n) => new Date(Date.now() - n * DIA).toISOString()

export default function Pendientes({ go }) {
  const [items, setItems] = useState(null)
  const [aviso, setAviso] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const hoy = diaISO()
    const en30 = diaISO(new Date(Date.now() + 30 * DIA))

    const [sinLeer, sinResponder, presupuestos, cobros, renovaciones, dominios, notas, resenas] = await Promise.all([
      // Sin leer desde hace más de un día
      supabase.from('mensajes').select('id, nombre, created_at').eq('leido', false).lt('created_at', haceDias(1)).order('created_at'),
      // Leídos y sin responder (de los últimos 30 días, con más de 3 días)
      supabase
        .from('mensajes')
        .select('id, nombre, created_at')
        .eq('leido', true)
        .is('respondido_at', null)
        .gte('created_at', haceDias(30))
        .lt('created_at', haceDias(3))
        .order('created_at'),
      // Presupuestos enviados hace más de una semana sin respuesta
      supabase
        .from('presupuestos')
        .select('id, titulo, enviado_at, proyecto:proyectos(id, titulo, cliente_id)')
        .eq('estado', 'enviado')
        .lt('enviado_at', haceDias(7)),
      // Cobros con la fecha pasada
      supabase
        .from('partidas')
        .select('id, concepto, importe, vence, presupuesto:presupuestos(proyecto:proyectos(id, titulo, cliente_id))')
        .eq('pagado', false)
        .lt('vence', hoy)
        .order('vence'),
      // Renovaciones en los próximos 30 días (o ya pasadas)
      supabase
        .from('renovaciones')
        .select('id, concepto, importe, proxima, cliente_id, cliente:clientes(nombre)')
        .eq('activa', true)
        .lte('proxima', en30)
        .order('proxima'),
      // Dominios que caducan en 30 días
      supabase
        .from('proyectos')
        .select('id, titulo, dominio, dominio_caduca, cliente_id')
        .not('dominio_caduca', 'is', null)
        .lte('dominio_caduca', en30)
        .order('dominio_caduca'),
      // Notas rápidas con fecha de hoy o atrasadas
      supabase.from('notas_rapidas').select('id, texto, fecha').eq('hecha', false).not('fecha', 'is', null).lte('fecha', hoy).order('fecha'),
      // Reseñas: clientes con la web publicada a los que falta pedírsela o recordársela
      supabase
        .from('clientes')
        .select('id, nombre, empresa, resena_pedida_at, resena_recordada_at, resena_recibida_at, proyectos(estado, web_url)')
        .is('resena_recibida_at', null),
    ])

    const fallos = [sinLeer, sinResponder, presupuestos, cobros, renovaciones, dominios, notas, resenas].filter((r) => r.error)
    if (fallos.length)
      setAviso('Para ver todos los pendientes falta ejecutar algún SQL de la carpeta supabase/ en Supabase (el último: resenas.sql).')

    const lista = []
    const irProyecto = (p) => () => p && go('proyecto', { proyectoId: p.id, clienteId: p.cliente_id })

    for (const c of cobros.data || []) {
      const p = c.presupuesto?.proyecto
      lista.push({
        id: `cobro-${c.id}`,
        tono: 'mal',
        tipo: 'Cobro vencido',
        texto: `${c.concepto}${p ? ` · ${p.titulo}` : ''}`,
        badge: `${euro(c.importe)} · ${plazo(c.vence)}`,
        ir: irProyecto(p),
      })
    }
    for (const r of renovaciones.data || []) {
      const n = diasHasta(r.proxima)
      lista.push({
        id: `renov-${r.id}`,
        tono: n < 0 ? 'mal' : n <= 7 ? 'warn' : 'info',
        tipo: n < 0 ? 'Renovación atrasada' : 'Renovación',
        texto: `${r.concepto}${r.cliente?.nombre ? ` · ${r.cliente.nombre}` : ''}`,
        badge: `${euro(r.importe)} · ${plazo(r.proxima)}`,
        ir: () => go('cliente', { clienteId: r.cliente_id }),
      })
    }
    for (const d of dominios.data || []) {
      const n = diasHasta(d.dominio_caduca)
      lista.push({
        id: `dom-${d.id}`,
        tono: n < 0 ? 'mal' : n <= 7 ? 'warn' : 'info',
        tipo: n < 0 ? 'Dominio caducado' : 'Dominio caduca',
        texto: d.dominio || d.titulo,
        badge: plazo(d.dominio_caduca),
        ir: irProyecto(d),
      })
    }
    for (const m of sinLeer.data || []) {
      lista.push({
        id: `sinleer-${m.id}`,
        tono: 'warn',
        tipo: 'Mensaje sin leer',
        texto: m.nombre,
        badge: hace(m.created_at),
        ir: () => go('mensajes', { mensajeId: m.id }),
      })
    }
    for (const m of sinResponder.data || []) {
      lista.push({
        id: `sinresp-${m.id}`,
        tono: 'info',
        tipo: 'Sin responder',
        texto: m.nombre,
        badge: hace(m.created_at),
        ir: () => go('mensajes', { mensajeId: m.id }),
      })
    }
    for (const p of presupuestos.data || []) {
      lista.push({
        id: `pres-${p.id}`,
        tono: 'info',
        tipo: 'Presupuesto sin respuesta',
        texto: `${p.titulo}${p.proyecto ? ` · ${p.proyecto.titulo}` : ''}`,
        badge: `enviado ${plazo(p.enviado_at)}`,
        ir: irProyecto(p.proyecto),
      })
    }
    for (const c of resenas.data || []) {
      const e = estadoResena(c)
      const quien = c.empresa || c.nombre
      if (e.clave === 'sin' && tieneWebPublicada(c)) {
        lista.push({
          id: `resena-${c.id}`,
          tono: 'info',
          tipo: 'Pedir reseña',
          texto: quien,
          badge: 'web publicada',
          ir: () => go('cliente', { clienteId: c.id }),
        })
      } else if (e.clave === 'pedida' && e.toca) {
        lista.push({
          id: `resena-${c.id}`,
          tono: 'info',
          tipo: 'Recordar reseña',
          texto: quien,
          badge: `pedida ${plazo(c.resena_pedida_at)}`,
          ir: () => go('cliente', { clienteId: c.id }),
        })
      }
    }
    for (const n of notas.data || []) {
      lista.push({
        id: `nota-${n.id}`,
        tono: diasHasta(n.fecha) < 0 ? 'warn' : 'info',
        tipo: 'Nota',
        texto: n.texto,
        badge: plazo(n.fecha),
        ir: null, // las notas se gestionan en su tarjeta, aquí abajo
      })
    }

    // Lo más urgente arriba
    const peso = { mal: 0, warn: 1, info: 2 }
    lista.sort((a, b) => peso[a.tono] - peso[b.tono])
    setItems(lista)
  }

  if (items === null) return null

  return (
    <div className="a-card a-pend">
      <div className="a-card-head">
        <h2 className="a-h2">
          Pendientes
          {items.length > 0 && <span className="a-nav-count">{items.length}</span>}
        </h2>
      </div>
      {aviso && <p className="a-error">{aviso}</p>}
      {items.length === 0 ? (
        <p className="a-empty">Nada pendiente: ni cobros vencidos, ni renovaciones cerca, ni mensajes olvidados. 🎉</p>
      ) : (
        <ul className="a-list">
          {items.map((it) => {
            const Tag = it.ir ? 'button' : 'div'
            return (
              <li key={it.id}>
                <Tag className={`a-pend-item ${it.ir ? 'is-click' : ''}`} onClick={it.ir || undefined}>
                  <span className={`a-pend-dot a-pend-${it.tono}`} aria-hidden="true" />
                  <span className="a-pend-main">
                    <span className="a-pend-tipo">{it.tipo}</span>
                    <strong className="a-pend-texto">{it.texto}</strong>
                  </span>
                  <span className={`a-badge ${it.tono === 'mal' ? 'a-badge-mal' : it.tono === 'warn' ? 'a-badge-warn' : 'a-badge-date'}`}>
                    {it.badge}
                  </span>
                </Tag>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
