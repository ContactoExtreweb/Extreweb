// src/components/admin/Calendario.jsx
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { soloHora, rangoReunion, paraInputDatetime } from './helpers.js'
import CalendarioSync from './CalendarioSync.jsx'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const mismoDia = (a, b) => ymd(a) === ymd(b)

export default function Calendario({ go, nueva = false }) {
  const [reuniones, setReuniones] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(() => new Date()) // mes visible
  const [vista, setVista] = useState('mes') // 'mes' | 'lista'
  const [modal, setModal] = useState(null) // null | {form}
  const [diaSel, setDiaSel] = useState(null) // día seleccionado (para panel de detalle)
  const [sync, setSync] = useState(false) // ventana "Ver en el iPhone"

  // En móvil arrancamos en lista
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 720) setVista('lista')
  }, [])

  useEffect(() => {
    cargar()
    if (nueva) nuevaEnDia(null) // viene del botón "Nueva reunión" del Inicio
  }, [])

  async function cargar() {
    setLoading(true)
    const [{ data: re }, { data: cli }] = await Promise.all([
      supabase
        .from('reuniones')
        .select('id, titulo, descripcion, fecha, fecha_fin, cliente_id, proyecto_id, cliente:clientes(nombre), proyecto:proyectos(titulo)')
        .order('fecha', { ascending: true }),
      supabase.from('clientes').select('id, nombre').order('nombre'),
    ])
    setReuniones(re || [])
    setClientes(cli || [])
    setLoading(false)
  }

  // --- Construcción de la rejilla del mes (empezando en lunes) ---
  const celdas = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const primero = new Date(year, month, 1)
    let offset = primero.getDay() - 1 // getDay: 0=Dom
    if (offset < 0) offset = 6
    const inicio = new Date(year, month, 1 - offset)
    const arr = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(inicio)
      d.setDate(inicio.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [cursor])

  const eventosDe = (dia) =>
    reuniones
      .filter((r) => mismoDia(new Date(r.fecha), dia))
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))

  const hoy = new Date()

  function nuevaEnDia(dia) {
    const base = dia ? new Date(dia) : new Date()
    if (dia) base.setHours(new Date().getHours() + 1, 0, 0, 0)
    setModal({
      id: null,
      titulo: '',
      descripcion: '',
      ini: paraInputDatetime(base),
      fin: '',
      cliente_id: '',
    })
  }

  function editar(r) {
    setModal({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion || '',
      ini: paraInputDatetime(r.fecha),
      fin: r.fecha_fin ? paraInputDatetime(r.fecha_fin) : '',
      cliente_id: r.cliente_id || '',
    })
  }

  async function guardar(e) {
    e.preventDefault()
    if (!modal.titulo.trim() || !modal.ini) return
    const payload = {
      titulo: modal.titulo.trim(),
      descripcion: modal.descripcion.trim() || null,
      fecha: new Date(modal.ini).toISOString(),
      fecha_fin: modal.fin ? new Date(modal.fin).toISOString() : null,
      cliente_id: modal.cliente_id || null,
    }
    if (modal.id) await supabase.from('reuniones').update(payload).eq('id', modal.id)
    else await supabase.from('reuniones').insert(payload)
    setModal(null)
    await cargar()
  }

  async function borrar(id) {
    if (!confirm('¿Eliminar esta reunión?')) return
    await supabase.from('reuniones').delete().eq('id', id)
    setModal(null)
    await cargar()
  }

  const ahora = new Date().toISOString()
  const proximas = reuniones.filter((r) => (r.fecha_fin || r.fecha) >= ahora)
  const pasadas = reuniones.filter((r) => (r.fecha_fin || r.fecha) < ahora).reverse()
  const eventosDiaSel = diaSel ? eventosDe(diaSel) : []

  return (
    <div>
      <div className="a-topbar">
        <div>
          <h1 className="a-h1">Calendario</h1>
          <p className="a-muted">Reuniones y citas del equipo.</p>
        </div>
        <div className="a-topbar-actions">
          <button className="a-btn" onClick={() => setSync(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
            iPhone
          </button>
          <button className="a-btn a-btn-accent" onClick={() => nuevaEnDia(null)}>+ Nueva reunión</button>
        </div>
      </div>

      {/* Barra de control: mes + navegación + cambio de vista */}
      <div className="a-cal-bar">
        <div className="a-cal-nav">
          <button className="a-icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} aria-label="Mes anterior">‹</button>
          <span className="a-cal-month">{MESES[cursor.getMonth()]} {cursor.getFullYear()}</span>
          <button className="a-icon-btn" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} aria-label="Mes siguiente">›</button>
          <button className="a-btn a-btn-ghost a-btn-sm a-cal-today" onClick={() => setCursor(new Date())}>Hoy</button>
        </div>
        <div className="a-cal-switch">
          <button className={`a-switch-btn ${vista === 'mes' ? 'is-on' : ''}`} onClick={() => setVista('mes')}>Mes</button>
          <button className={`a-switch-btn ${vista === 'lista' ? 'is-on' : ''}`} onClick={() => setVista('lista')}>Lista</button>
        </div>
      </div>

      {loading ? (
        <p className="a-muted">Cargando…</p>
      ) : vista === 'mes' ? (
        <>
          <div className="a-cal">
            <div className="a-cal-head">
              {DIAS.map((d) => <span key={d} className="a-cal-dow">{d}</span>)}
            </div>
            <div className="a-cal-grid">
              {celdas.map((dia, i) => {
                const evs = eventosDe(dia)
                const fuera = dia.getMonth() !== cursor.getMonth()
                const esHoy = mismoDia(dia, hoy)
                return (
                  <button
                    key={i}
                    className={`a-cal-cell ${fuera ? 'is-out' : ''} ${esHoy ? 'is-today' : ''}`}
                    onClick={() => setDiaSel(dia)}
                  >
                    <span className="a-cal-daynum">{dia.getDate()}</span>
                    <span className="a-cal-events">
                      {evs.slice(0, 3).map((e) => (
                        <span key={e.id} className="a-cal-ev" title={e.titulo}>
                          <span className="a-cal-ev-time">{soloHora(e.fecha)}</span> {e.titulo}
                        </span>
                      ))}
                      {evs.length > 3 && <span className="a-cal-more">+{evs.length - 3} más</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Panel del día seleccionado */}
          {diaSel && (
            <div className="a-card a-daypanel">
              <div className="a-card-head">
                <h2 className="a-h2">{diaSel.getDate()} de {MESES[diaSel.getMonth()].toLowerCase()}</h2>
                <button className="a-btn a-btn-accent a-btn-sm" onClick={() => nuevaEnDia(diaSel)}>+ Añadir</button>
              </div>
              {eventosDiaSel.length === 0 ? (
                <p className="a-empty">Sin reuniones este día.</p>
              ) : (
                <ul className="a-list">
                  {eventosDiaSel.map((r) => (
                    <li key={r.id} className="a-row a-row-click" onClick={() => editar(r)}>
                      <div>
                        <strong>{r.titulo}</strong>
                        <span className="a-muted a-small">{r.cliente?.nombre || r.proyecto?.titulo || 'General'}</span>
                      </div>
                      <span className="a-badge a-badge-date">{rangoReunion(r.fecha, r.fecha_fin).split('·')[1]?.trim()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        /* ---------- VISTA LISTA ---------- */
        <>
          <div className="a-card">
            <div className="a-card-head"><h2 className="a-h2">Próximas</h2></div>
            {proximas.length === 0 ? (
              <p className="a-empty">No hay reuniones próximas.</p>
            ) : (
              <ul className="a-list">
                {proximas.map((r) => (
                  <li key={r.id} className="a-row a-row-click a-reu-row" onClick={() => editar(r)}>
                    <div className="a-reu-item">
                      <span className="a-reu-dot" aria-hidden="true" />
                      <div>
                        <strong>{r.titulo}</strong>
                        <span className="a-muted a-small">
                          {r.cliente?.nombre || r.proyecto?.titulo || 'General'}{r.descripcion ? ` · ${r.descripcion}` : ''}
                        </span>
                      </div>
                    </div>
                    <span className="a-badge a-badge-date">{rangoReunion(r.fecha, r.fecha_fin)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {pasadas.length > 0 && (
            <div className="a-card">
              <div className="a-card-head"><h2 className="a-h2">Pasadas</h2></div>
              <ul className="a-list a-list-muted">
                {pasadas.map((r) => (
                  <li key={r.id} className="a-row a-row-click a-reu-row" onClick={() => editar(r)}>
                    <div>
                      <strong>{r.titulo}</strong>
                      <span className="a-muted a-small">{r.cliente?.nombre || r.proyecto?.titulo || 'General'}</span>
                    </div>
                    <span className="a-badge a-badge-date">{rangoReunion(r.fecha, r.fecha_fin)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {sync && <CalendarioSync onClose={() => setSync(false)} />}

      {/* ---------- MODAL CREAR/EDITAR ---------- */}
      {modal && (
        <div className="a-modal-back" onClick={() => setModal(null)}>
          <div className="a-modal" onClick={(e) => e.stopPropagation()}>
            <div className="a-modal-head">
              <h2 className="a-h2">{modal.id ? 'Editar reunión' : 'Nueva reunión'}</h2>
              <button className="a-icon-btn" onClick={() => setModal(null)} aria-label="Cerrar">✕</button>
            </div>
            <form className="a-form" onSubmit={guardar}>
              <div className="a-field">
                <label className="a-label">Título *</label>
                <input className="a-input" value={modal.titulo} onChange={(e) => setModal({ ...modal, titulo: e.target.value })} placeholder="Ej. Llamada con cliente" required autoFocus />
              </div>
              <div className="a-grid2">
                <div className="a-field">
                  <label className="a-label">Inicio *</label>
                  <input className="a-input" type="datetime-local" value={modal.ini} onChange={(e) => setModal({ ...modal, ini: e.target.value })} required />
                </div>
                <div className="a-field">
                  <label className="a-label">Fin</label>
                  <input className="a-input" type="datetime-local" value={modal.fin} onChange={(e) => setModal({ ...modal, fin: e.target.value })} />
                </div>
              </div>
              <div className="a-field">
                <label className="a-label">Cliente (opcional)</label>
                <select className="a-select" value={modal.cliente_id} onChange={(e) => setModal({ ...modal, cliente_id: e.target.value })}>
                  <option value="">— Sin cliente —</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div className="a-field">
                <label className="a-label">Descripción</label>
                <input className="a-input" value={modal.descripcion} onChange={(e) => setModal({ ...modal, descripcion: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="a-modal-actions">
                {modal.id ? (
                  <button type="button" className="a-btn a-btn-danger" onClick={() => borrar(modal.id)}>Eliminar</button>
                ) : <span />}
                <div className="a-modal-actions-right">
                  <button type="button" className="a-btn a-btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
                  <button type="submit" className="a-btn a-btn-accent">{modal.id ? 'Guardar' : 'Crear'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

