// src/components/admin/Inicio.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro, rangoReunion } from './helpers.js'

export default function Inicio({ go, email }) {
  const [stats, setStats] = useState({ clientes: 0, proyectos: 0, pendiente: 0, cobrado: 0 })
  const [reuniones, setReuniones] = useState([])
  const [deudores, setDeudores] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const [cli, pro, reu, proyectosData] = await Promise.all([
      supabase.from('clientes').select('id', { count: 'exact', head: true }),
      supabase.from('proyectos').select('id', { count: 'exact', head: true }).eq('estado', 'activo'),
      supabase
        .from('reuniones')
        .select('id, titulo, fecha, fecha_fin, cliente:clientes(nombre), proyecto:proyectos(titulo)')
        .gte('fecha', new Date().toISOString())
        .order('fecha', { ascending: true })
        .limit(4),
      supabase
        .from('proyectos')
        .select('id, titulo, cliente_id, cliente:clientes(nombre), presupuestos(partidas(importe, pagado))'),
    ])

    let pendiente = 0
    let cobrado = 0
    const deuda = []

    ;(proyectosData.data || []).forEach((pr) => {
      let pPend = 0
      ;(pr.presupuestos || []).forEach((ps) => {
        ;(ps.partidas || []).forEach((x) => {
          const imp = Number(x.importe || 0)
          if (x.pagado) cobrado += imp
          else {
            pendiente += imp
            pPend += imp
          }
        })
      })
      if (pPend > 0) deuda.push({ id: pr.id, titulo: pr.titulo, cliente_id: pr.cliente_id, cliente: pr.cliente?.nombre, pendiente: pPend })
    })

    deuda.sort((a, b) => b.pendiente - a.pendiente)

    setStats({ clientes: cli.count || 0, proyectos: pro.count || 0, pendiente, cobrado })
    setReuniones(reu.data || [])
    setDeudores(deuda.slice(0, 5))
    setLoading(false)
  }

  // Saludo según la hora
  const hora = new Date().getHours()
  const saludo = hora < 6 ? 'Buenas noches' : hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = email ? email.split('@')[0] : 'equipo'
  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fechaCap = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1)

  const Icon = ({ d, s = 20 }) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
  )

  return (
    <div>
      {/* ---------- HERO DE BIENVENIDA ---------- */}
      <header className="a-hero">
        <div className="a-hero-bg" aria-hidden="true" />
        <div className="a-hero-inner">
          <span className="a-hero-date">{fechaCap}</span>
          <h1 className="a-hero-title">{saludo}, <span className="a-hero-name">{nombre}</span> 👋</h1>
          <p className="a-hero-sub">Este es el resumen de la agencia. Tienes {stats.proyectos} proyecto{stats.proyectos === 1 ? '' : 's'} activo{stats.proyectos === 1 ? '' : 's'} y {euro(stats.pendiente)} por cobrar.</p>

          <div className="a-hero-actions">
            <button className="a-hero-btn a-hero-btn-primary" onClick={() => go('clientes')}>
              <Icon d="M12 5v14M5 12h14" s={18} /> Nuevo cliente
            </button>
            <button className="a-hero-btn" onClick={() => go('calendario')}>
              <Icon d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" s={18} /> Nueva reunión
            </button>
            <button className="a-hero-btn" onClick={() => go('clientes')}>
              <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0 .01" s={18} /> Ver clientes
            </button>
          </div>
        </div>
      </header>

      {loading ? (
        <p className="a-muted">Cargando…</p>
      ) : (
        <>
          {/* STATS EN LÍNEA */}
          <div className="a-stripe">
            <button className="a-stripe-item a-stripe-click" onClick={() => go('clientes')}>
              <span className="a-stripe-num">{stats.clientes}</span>
              <span className="a-stripe-label">Clientes</span>
            </button>
            <span className="a-stripe-div" />
            <button className="a-stripe-item a-stripe-click" onClick={() => go('clientes')}>
              <span className="a-stripe-num">{stats.proyectos}</span>
              <span className="a-stripe-label">Proyectos activos</span>
            </button>
            <span className="a-stripe-div" />
            <div className="a-stripe-item">
              <span className="a-stripe-num a-warn">{euro(stats.pendiente)}</span>
              <span className="a-stripe-label">Pendiente</span>
            </div>
            <span className="a-stripe-div" />
            <div className="a-stripe-item">
              <span className="a-stripe-num a-ok">{euro(stats.cobrado)}</span>
              <span className="a-stripe-label">Cobrado</span>
            </div>
          </div>

          <div className="a-home-grid">
            {/* COBROS PENDIENTES */}
            <div className="a-card">
              <div className="a-card-head"><h2 className="a-h2">Cobros pendientes</h2></div>
              {deudores.length === 0 ? (
                <p className="a-empty">Todo cobrado. 🎉</p>
              ) : (
                <ul className="a-list">
                  {deudores.map((d) => (
                    <li key={d.id} className="a-row a-row-click" onClick={() => go('proyecto', { proyectoId: d.id, clienteId: d.cliente_id })}>
                      <div>
                        <strong>{d.titulo}</strong>
                        <span className="a-muted a-small">{d.cliente || '—'}</span>
                      </div>
                      <span className="a-badge a-badge-warn">{euro(d.pendiente)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PRÓXIMAS REUNIONES */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-h2">Próximas reuniones</h2>
                <button className="a-btn a-btn-ghost" onClick={() => go('calendario')}>Ver todas</button>
              </div>
              {reuniones.length === 0 ? (
                <p className="a-empty">No hay reuniones programadas.</p>
              ) : (
                <ul className="a-list">
                  {reuniones.map((r) => (
                    <li key={r.id} className="a-row a-row-click" onClick={() => go('calendario')}>
                      <div className="a-reu-item">
                        <span className="a-reu-dot" aria-hidden="true" />
                        <div>
                          <strong>{r.titulo}</strong>
                          <span className="a-muted a-small">{r.cliente?.nombre || r.proyecto?.titulo || 'General'}</span>
                        </div>
                      </div>
                      <span className="a-badge a-badge-date">{rangoReunion(r.fecha, r.fecha_fin)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}