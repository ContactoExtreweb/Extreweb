// src/components/admin/Inicio.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro, cuandoReunion, hace } from './helpers.js'
import NotasRapidas from './NotasRapidas.jsx'

const Icon = ({ d, s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

const ICO = {
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  plus: 'M12 5v14M5 12h14',
  cal: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  calc: 'M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h4M16 19h.01',
}

// "2 mensajes sin leer, 3 proyectos activos y 1.200 € por cobrar."
function resumen({ sinLeer, proyectos, pendiente }) {
  const partes = []
  if (sinLeer > 0) partes.push(`${sinLeer} mensaje${sinLeer === 1 ? '' : 's'} sin leer`)
  partes.push(`${proyectos} proyecto${proyectos === 1 ? '' : 's'} activo${proyectos === 1 ? '' : 's'}`)
  partes.push(`${euro(pendiente)} por cobrar`)
  const ultima = partes.pop()
  return `Tienes ${partes.join(', ')} y ${ultima}.`
}

export default function Inicio({ go, email }) {
  const [stats, setStats] = useState({ clientes: 0, proyectos: 0, pendiente: 0, cobrado: 0, sinLeer: 0 })
  const [reuniones, setReuniones] = useState([])
  const [deudores, setDeudores] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const [cli, pro, reu, proyectosData, msgs, noLeidos] = await Promise.all([
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
      supabase
        .from('mensajes')
        .select('id, nombre, mensaje, leido, created_at')
        .order('created_at', { ascending: false })
        .limit(3),
      supabase.from('mensajes').select('id', { count: 'exact', head: true }).eq('leido', false),
    ])

    if (cli.error || proyectosData.error) {
      setError('No se han podido cargar los datos. Si dura, mira si el proyecto de Supabase está pausado.')
    }

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

    setStats({ clientes: cli.count || 0, proyectos: pro.count || 0, pendiente, cobrado, sinLeer: noLeidos.count || 0 })
    setReuniones(reu.data || [])
    setDeudores(deuda.slice(0, 5))
    setMensajes(msgs.data || [])
    setLoading(false)
  }

  // Saludo según la hora
  const hora = new Date().getHours()
  const saludo = hora < 6 ? 'Buenas noches' : hora < 14 ? 'Buenos días' : hora < 21 ? 'Buenas tardes' : 'Buenas noches'
  const nombre = email ? email.split('@')[0] : 'equipo'
  const fechaHoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const fechaCap = fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1)

  return (
    <div>
      {/* ---------- HERO DE BIENVENIDA ---------- */}
      <header className="a-hero">
        <div className="a-hero-bg" aria-hidden="true" />
        <div className="a-hero-inner">
          <span className="a-hero-date">{fechaCap}</span>
          <h1 className="a-hero-title">{saludo}, <span className="a-hero-name">{nombre}</span> 👋</h1>
          <p className="a-hero-sub">{loading ? 'Preparando el resumen…' : resumen(stats)}</p>

          <div className="a-hero-actions">
            {stats.sinLeer > 0 && (
              <button className="a-hero-btn a-hero-btn-primary" onClick={() => go('mensajes')}>
                <Icon d={ICO.mail} s={18} /> Ver mensajes ({stats.sinLeer})
              </button>
            )}
            <button className={`a-hero-btn ${stats.sinLeer > 0 ? '' : 'a-hero-btn-primary'}`} onClick={() => go('clientes', { nuevo: true })}>
              <Icon d={ICO.plus} s={18} /> Nuevo cliente
            </button>
            <button className="a-hero-btn" onClick={() => go('calendario', { nueva: true })}>
              <Icon d={ICO.cal} s={18} /> Nueva reunión
            </button>
            <button className="a-hero-btn" onClick={() => go('calculadora')}>
              <Icon d={ICO.calc} s={18} /> Calculadora IVA
            </button>
          </div>
        </div>
      </header>

      {error && <p className="a-error">{error}</p>}

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
            {/* ÚLTIMOS MENSAJES */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-h2">
                  Mensajes
                  {stats.sinLeer > 0 && <span className="a-nav-count">{stats.sinLeer}</span>}
                </h2>
                <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => go('mensajes')}>Ver todos</button>
              </div>
              {mensajes.length === 0 ? (
                <p className="a-empty">Aún no ha llegado ningún mensaje de la web.</p>
              ) : (
                <ul className="a-list">
                  {mensajes.map((m) => (
                    <li key={m.id}>
                      <button className="a-home-msg" onClick={() => go('mensajes', { mensajeId: m.id })}>
                        <span className={`a-msg-dot ${m.leido ? '' : 'is-on'}`} aria-hidden="true" />
                        <span className="a-home-msg-main">
                          <span className="a-home-msg-top">
                            <strong className={m.leido ? '' : 'a-strong'}>{m.nombre}</strong>
                            <span className="a-muted a-small-inline">{hace(m.created_at)}</span>
                          </span>
                          <span className="a-msg-excerpt">{m.mensaje}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* PRÓXIMAS REUNIONES */}
            <div className="a-card">
              <div className="a-card-head">
                <h2 className="a-h2">Próximas reuniones</h2>
                <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => go('calendario')}>Calendario</button>
              </div>
              {reuniones.length === 0 ? (
                <p className="a-empty">No hay reuniones programadas.</p>
              ) : (
                <ul className="a-list">
                  {reuniones.map((r) => {
                    const cuando = cuandoReunion(r.fecha, r.fecha_fin)
                    const pronto = cuando.startsWith('Hoy') || cuando.startsWith('Mañana')
                    return (
                      <li key={r.id} className="a-row a-row-click a-reu-row" onClick={() => go('calendario')}>
                        <div className="a-reu-item">
                          <span className="a-reu-dot" aria-hidden="true" />
                          <div>
                            <strong>{r.titulo}</strong>
                            <span className="a-muted a-small">{r.cliente?.nombre || r.proyecto?.titulo || 'General'}</span>
                          </div>
                        </div>
                        <span className={`a-badge ${pronto ? 'a-badge-warn' : 'a-badge-date'}`}>{cuando}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>

            {/* NOTAS RÁPIDAS */}
            <NotasRapidas />

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
          </div>
        </>
      )}
    </div>
  )
}
