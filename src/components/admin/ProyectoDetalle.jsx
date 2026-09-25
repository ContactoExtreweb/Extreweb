// src/components/admin/ProyectoDetalle.jsx
// Ficha de un proyecto, en pestañas: Presupuesto · Web · Horas · Archivos · Notas y reuniones
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro, fechaCorta, rangoReunion, paraInputDatetime, plazo, diasHasta } from './helpers.js'
import Imprimible from './Imprimible.jsx'
import PresupuestoPDF, { totalesPresupuesto } from './PresupuestoPDF.jsx'
import FichaWeb from './FichaWeb.jsx'
import Horas from './Horas.jsx'
import Archivos, { borrarArchivosProyecto } from './Archivos.jsx'

const ESTADOS = ['activo', 'pausado', 'terminado']
const ESTADOS_PRES = {
  borrador: 'Borrador',
  enviado: 'Enviado',
  aceptado: 'Aceptado',
  rechazado: 'Rechazado',
}
const PESTANAS = [
  { key: 'presupuesto', label: 'Presupuesto' },
  { key: 'web', label: 'Web' },
  { key: 'horas', label: 'Horas' },
  { key: 'archivos', label: 'Archivos' },
  { key: 'notas', label: 'Notas y reuniones' },
]

const pestanaValida = (p) => (PESTANAS.some((x) => x.key === p) ? p : 'presupuesto')

export default function ProyectoDetalle({ proyectoId, clienteId, go, pestana: pestanaUrl, onPestana }) {
  const [proyecto, setProyecto] = useState(null)
  const [presupuestos, setPresupuestos] = useState([])
  const [notas, setNotas] = useState([])
  const [reuniones, setReuniones] = useState([])
  const [loading, setLoading] = useState(true)
  const [pestana, setPestanaLocal] = useState(() => pestanaValida(pestanaUrl))
  // La pestaña se apunta también en la URL (sobrevive al refresco)
  const setPestana = (p) => {
    setPestanaLocal(p)
    onPestana?.(p === 'presupuesto' ? undefined : p)
  }

  // "Cargando…" solo al abrir otro proyecto; al recargar tras un cambio no parpadea
  useEffect(() => {
    setLoading(true)
    setPestanaLocal(pestanaValida(pestanaUrl))
    cargar()
  }, [proyectoId])

  async function cargar() {
    const [{ data: pr }, { data: pres }, { data: no }, { data: re }] = await Promise.all([
      supabase.from('proyectos').select('*, cliente:clientes(nombre, empresa, email, telefono)').eq('id', proyectoId).single(),
      supabase.from('presupuestos').select('*').eq('proyecto_id', proyectoId).order('created_at'),
      supabase.from('notas').select('id, contenido, created_at').eq('proyecto_id', proyectoId).order('created_at', { ascending: false }),
      supabase.from('reuniones').select('id, titulo, descripcion, fecha, fecha_fin').eq('proyecto_id', proyectoId).order('fecha', { ascending: true }),
    ])

    let presFull = pres || []
    if (presFull.length) {
      const ids = presFull.map((p) => p.id)
      const { data: parts } = await supabase
        .from('partidas')
        .select('*')
        .in('presupuesto_id', ids)
        .order('created_at')
      presFull = presFull.map((p) => ({ ...p, partidas: (parts || []).filter((x) => x.presupuesto_id === p.id) }))
    }

    setProyecto(pr)
    setPresupuestos(presFull)
    setNotas(no || [])
    setReuniones(re || [])
    setLoading(false)
  }

  const idCliente = clienteId ?? proyecto?.cliente_id

  async function cambiarEstado(estado) {
    await supabase.from('proyectos').update({ estado }).eq('id', proyectoId)
    setProyecto((p) => ({ ...p, estado }))
  }

  async function borrarProyecto() {
    if (!confirm('¿Eliminar este proyecto con su presupuesto, notas, reuniones, horas y archivos?')) return
    await borrarArchivosProyecto(proyectoId).catch(() => {})
    const { error } = await supabase.from('proyectos').delete().eq('id', proyectoId)
    if (!error) go('cliente', { clienteId: idCliente })
  }

  const totales = presupuestos.reduce(
    (acc, p) => {
      ;(p.partidas || []).forEach((x) => {
        const imp = Number(x.importe || 0)
        acc.total += imp
        if (x.pagado) acc.cobrado += imp
      })
      return acc
    },
    { total: 0, cobrado: 0 }
  )
  totales.pendiente = totales.total - totales.cobrado
  const progreso = totales.total > 0 ? Math.round((totales.cobrado / totales.total) * 100) : 0
  // Para la pestaña Horas: lo presupuestado sin IVA (sin contar los rechazados)
  const totalBase = presupuestos
    .filter((p) => p.estado !== 'rechazado')
    .reduce((s, p) => s + totalesPresupuesto(p).base, 0)

  if (loading) return <p className="a-muted">Cargando…</p>
  if (!proyecto) return <p className="a-muted">Proyecto no encontrado.</p>

  return (
    <div>
      <button className="a-back" onClick={() => go('cliente', { clienteId: idCliente })}>
        ‹ {proyecto.cliente?.nombre || 'Volver al cliente'}
      </button>

      <div className="a-topbar">
        <div>
          <h1 className="a-h1">{proyecto.titulo}</h1>
          {proyecto.descripcion && <p className="a-muted">{proyecto.descripcion}</p>}
          {proyecto.web_url && (
            <a className="a-link a-small" href={proyecto.web_url} target="_blank" rel="noopener noreferrer">
              {proyecto.web_url.replace(/^https?:\/\//, '')} ↗
            </a>
          )}
        </div>
        <div className="a-topbar-actions">
          <select className="a-select" value={proyecto.estado} onChange={(e) => cambiarEstado(e.target.value)} aria-label="Estado del proyecto">
            {ESTADOS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="a-btn a-btn-danger" onClick={borrarProyecto}>Eliminar</button>
        </div>
      </div>

      <div className="a-tabs" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.key}
            role="tab"
            aria-selected={pestana === p.key}
            className={`a-tab ${pestana === p.key ? 'is-on' : ''}`}
            onClick={() => setPestana(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {pestana === 'presupuesto' && (
        <>
          {/* RESUMEN ECONÓMICO con barra de progreso */}
          <div className="a-money-card">
            <div className="a-money-row">
              <div className="a-money-box"><span className="a-stat-label">Total</span><strong>{euro(totales.total)}</strong></div>
              <div className="a-money-box"><span className="a-stat-label">Cobrado</span><strong className="a-ok">{euro(totales.cobrado)}</strong></div>
              <div className="a-money-box"><span className="a-stat-label">Pendiente</span><strong className="a-warn">{euro(totales.pendiente)}</strong></div>
            </div>
            <div className="a-progress">
              <div className="a-progress-bar" style={{ width: `${progreso}%` }} />
            </div>
            <span className="a-progress-label">{progreso}% cobrado</span>
          </div>

          <Presupuestos presupuestos={presupuestos} proyecto={proyecto} recargar={cargar} />
        </>
      )}
      {pestana === 'web' && (
        <FichaWeb proyecto={proyecto} onGuardado={(cambios) => setProyecto((p) => ({ ...p, ...cambios }))} />
      )}
      {pestana === 'horas' && <Horas proyectoId={proyectoId} totalBase={totalBase} />}
      {pestana === 'archivos' && <Archivos proyectoId={proyectoId} />}
      {pestana === 'notas' && (
        <>
          <Notas notas={notas} proyectoId={proyectoId} recargar={cargar} />
          <Reuniones reuniones={reuniones} proyectoId={proyectoId} recargar={cargar} />
        </>
      )}
    </div>
  )
}

/* ---------- PRESUPUESTOS + PARTIDAS ---------- */
function Presupuestos({ presupuestos, proyecto, recargar }) {
  async function crearPresupuesto() {
    await supabase.from('presupuestos').insert({ proyecto_id: proyecto.id, titulo: 'Presupuesto' })
    recargar()
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Presupuesto</h2>
        {presupuestos.length === 0 && (
          <button className="a-btn a-btn-accent" onClick={crearPresupuesto}>+ Crear presupuesto</button>
        )}
        {presupuestos.length > 0 && (
          <button className="a-btn a-btn-ghost" onClick={crearPresupuesto}>+ Otro presupuesto</button>
        )}
      </div>

      {presupuestos.length === 0 ? (
        <p className="a-empty">Sin presupuesto todavía. Crea uno para empezar a añadir partidas.</p>
      ) : (
        presupuestos.map((p) => <PresupuestoCard key={p.id} pres={p} proyecto={proyecto} recargar={recargar} />)
      )}
    </div>
  )
}

function PresupuestoCard({ pres, proyecto, recargar }) {
  const [concepto, setConcepto] = useState('')
  const [importe, setImporte] = useState('')
  const [vence, setVence] = useState('')
  const [editId, setEditId] = useState(null)
  const [editVals, setEditVals] = useState({ concepto: '', importe: '', vence: '' })
  const [ivaTxt, setIvaTxt] = useState(String(pres.iva ?? 21))
  const [pdf, setPdf] = useState(false)
  const [error, setError] = useState('')

  const total = (pres.partidas || []).reduce((s, x) => s + Number(x.importe || 0), 0)
  const cobrado = (pres.partidas || []).filter((x) => x.pagado).reduce((s, x) => s + Number(x.importe || 0), 0)
  const pendiente = total - cobrado
  const conIva = totalesPresupuesto(pres)
  const estado = pres.estado || 'borrador'

  async function actualizar(cambios) {
    const { error } = await supabase.from('presupuestos').update(cambios).eq('id', pres.id)
    if (error) return setError('No se ha podido guardar. ¿Está ejecutado supabase/panel-ampliacion.sql?')
    setError('')
    recargar()
  }

  function cambiarEstado(nuevo) {
    // Al enviarlo se apunta la fecha: si en 7 días no hay respuesta, sale en Pendientes
    const enviado_at =
      nuevo === 'enviado' ? pres.enviado_at || new Date().toISOString() : nuevo === 'borrador' ? null : pres.enviado_at ?? null
    actualizar({ estado: nuevo, enviado_at })
  }

  function guardarIva() {
    const n = Math.min(100, Math.max(0, Number(ivaTxt.replace(',', '.')) || 0))
    setIvaTxt(String(n))
    if (n !== Number(pres.iva ?? 21)) actualizar({ iva: n })
  }

  async function addPartida(e) {
    e.preventDefault()
    if (!concepto.trim()) return
    const fila = {
      presupuesto_id: pres.id,
      concepto: concepto.trim(),
      importe: Number(importe) || 0,
    }
    if (vence) fila.vence = vence
    const { error } = await supabase.from('partidas').insert(fila)
    if (error) return setError('No se ha podido añadir la partida.')
    setConcepto('')
    setImporte('')
    setVence('')
    recargar()
  }

  async function togglePagado(part) {
    await supabase
      .from('partidas')
      .update({
        pagado: !part.pagado,
        fecha_pago: !part.pagado ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq('id', part.id)
    recargar()
  }

  async function borrarPartida(id) {
    await supabase.from('partidas').delete().eq('id', id)
    recargar()
  }

  function empezarEdicion(part) {
    setEditId(part.id)
    setEditVals({ concepto: part.concepto, importe: String(part.importe), vence: part.vence || '' })
  }

  async function guardarEdicion(id) {
    const cambios = { concepto: editVals.concepto.trim(), importe: Number(editVals.importe) || 0 }
    // Solo se manda `vence` si hay algo que guardar (así funciona también sin la migración)
    if (editVals.vence || pres.partidas.find((p) => p.id === id)?.vence) cambios.vence = editVals.vence || null
    const { error } = await supabase.from('partidas').update(cambios).eq('id', id)
    if (error) return setError('No se ha podido guardar la partida.')
    setEditId(null)
    recargar()
  }

  async function borrarPresupuesto() {
    if (!confirm('¿Eliminar este presupuesto y todas sus partidas?')) return
    await supabase.from('presupuestos').delete().eq('id', pres.id)
    recargar()
  }

  return (
    <div className="a-pres">
      <div className="a-pres-head">
        <span className="a-pres-title">{pres.titulo}</span>
        <div className="a-pres-acciones">
          <select
            className={`a-select a-select-sm a-pres-estado is-${estado}`}
            value={estado}
            onChange={(e) => cambiarEstado(e.target.value)}
            aria-label="Estado del presupuesto"
          >
            {Object.entries(ESTADOS_PRES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setPdf(true)} disabled={!(pres.partidas || []).length}>
            PDF
          </button>
          <button className="a-icon-btn" onClick={borrarPresupuesto} title="Eliminar presupuesto" aria-label="Eliminar presupuesto">🗑</button>
        </div>
      </div>
      {estado === 'enviado' && pres.enviado_at && (
        <p className="a-small a-muted a-pres-enviado">Enviado el {fechaCorta(pres.enviado_at)}.</p>
      )}

      {error && <p className="a-error">{error}</p>}

      {(pres.partidas || []).length === 0 ? (
        <p className="a-empty a-empty-sm">Sin partidas. Añade la primera abajo.</p>
      ) : (
        <div className="a-partidas">
          {pres.partidas.map((part) => {
            const d = !part.pagado && part.vence ? diasHasta(part.vence) : null
            return (
              <div key={part.id} className={`a-partida2 ${part.pagado ? 'is-paid' : ''}`}>
                {editId === part.id ? (
                  <form className="a-partida2-edit" onSubmit={(e) => { e.preventDefault(); guardarEdicion(part.id) }}>
                    <input className="a-input a-input-sm" value={editVals.concepto} onChange={(e) => setEditVals({ ...editVals, concepto: e.target.value })} placeholder="Concepto" autoFocus />
                    <div className="a-partida2-editrow">
                      <input className="a-input a-input-sm a-input-num" type="number" step="0.01" value={editVals.importe} onChange={(e) => setEditVals({ ...editVals, importe: e.target.value })} placeholder="0.00" />
                      <input className="a-input a-input-sm" type="date" value={editVals.vence} onChange={(e) => setEditVals({ ...editVals, vence: e.target.value })} aria-label="Fecha de cobro" title="Fecha de cobro" />
                      <button type="submit" className="a-btn a-btn-accent a-btn-sm">Guardar</button>
                      <button type="button" className="a-btn a-btn-ghost a-btn-sm" onClick={() => setEditId(null)}>Cancelar</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <button
                      className={`a-check ${part.pagado ? 'is-on' : ''}`}
                      onClick={() => togglePagado(part)}
                      title={part.pagado ? 'Marcar como pendiente' : 'Marcar como pagado'}
                    >
                      {part.pagado ? '✓' : ''}
                    </button>
                    <div className="a-partida2-info">
                      <strong>{part.concepto}</strong>
                      <span className={`a-partida2-estado ${part.pagado ? 'a-ok' : 'a-warn'}`}>
                        {part.pagado
                          ? part.fecha_pago ? `Pagado · ${fechaCorta(part.fecha_pago)}` : 'Pagado'
                          : part.vence ? `Pendiente · cobrar ${plazo(part.vence)}` : 'Pendiente'}
                      </span>
                      {d !== null && d < 0 && <span className="a-badge a-badge-mal a-partida-vencido">Vencido</span>}
                    </div>
                    <span className="a-partida2-imp">{euro(part.importe)}</span>
                    <div className="a-partida2-actions">
                      <button className="a-icon-btn" onClick={() => empezarEdicion(part)} title="Editar">✎</button>
                      <button className="a-icon-btn" onClick={() => borrarPartida(part.id)} title="Eliminar">×</button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <form className="a-partida2-add" onSubmit={addPartida}>
        <input className="a-input a-input-sm" value={concepto} onChange={(e) => setConcepto(e.target.value)} placeholder="Concepto nuevo (ej. SEO local)" />
        <div className="a-partida2-addrow">
          <input className="a-input a-input-sm a-input-num" type="number" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} placeholder="0.00 €" />
          <input className="a-input a-input-sm" type="date" value={vence} onChange={(e) => setVence(e.target.value)} aria-label="Cuándo se cobra (opcional)" title="Cuándo se cobra (opcional)" />
          <button type="submit" className="a-btn a-btn-accent a-btn-sm">+ Añadir partida</button>
        </div>
      </form>

      {/* IVA: cómo se han escrito los importes y qué tipo lleva */}
      <div className="a-pres-iva">
        <div className="a-cal-switch" role="group" aria-label="Los importes de las partidas">
          <button className={`a-switch-btn ${!pres.con_iva ? 'is-on' : ''}`} onClick={() => pres.con_iva && actualizar({ con_iva: false })} aria-pressed={!pres.con_iva}>
            Importes sin IVA
          </button>
          <button className={`a-switch-btn ${pres.con_iva ? 'is-on' : ''}`} onClick={() => !pres.con_iva && actualizar({ con_iva: true })} aria-pressed={!!pres.con_iva}>
            Ya llevan IVA
          </button>
        </div>
        <label className="a-calc-pct">
          IVA
          <input
            className="a-input a-input-num a-input-sm"
            inputMode="decimal"
            value={ivaTxt}
            onChange={(e) => setIvaTxt(e.target.value)}
            onBlur={guardarIva}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            aria-label="Tipo de IVA"
          />
          %
        </label>
      </div>

      <div className="a-pres-totales">
        <span>Total <strong>{euro(total)}</strong></span>
        <span>Cobrado <strong className="a-ok">{euro(cobrado)}</strong></span>
        <span>Pendiente <strong className="a-warn">{euro(pendiente)}</strong></span>
      </div>
      <p className="a-small a-muted a-pres-coniva">
        Base {euro(conIva.base)} · IVA ({conIva.iva} %) {euro(conIva.cuota)} · <strong>Total con IVA {euro(conIva.total)}</strong>
      </p>

      {pdf && (
        <Imprimible titulo={`Presupuesto ${proyecto.titulo}`} onClose={() => setPdf(false)}>
          <PresupuestoPDF pres={pres} proyecto={proyecto} cliente={proyecto.cliente} />
        </Imprimible>
      )}
    </div>
  )
}

/* ---------- NOTAS ---------- */
function Notas({ notas, proyectoId, recargar }) {
  const [texto, setTexto] = useState('')

  async function add(e) {
    e.preventDefault()
    if (!texto.trim()) return
    await supabase.from('notas').insert({ proyecto_id: proyectoId, contenido: texto.trim() })
    setTexto('')
    recargar()
  }

  async function borrar(id) {
    await supabase.from('notas').delete().eq('id', id)
    recargar()
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Notas del cliente</h2>
      </div>

      <form className="a-note-add" onSubmit={add}>
        <textarea className="a-input" rows="2" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Apunta lo que quiere el cliente, detalles, ideas…" />
        <button type="submit" className="a-btn a-btn-accent">Añadir nota</button>
      </form>

      {notas.length === 0 ? (
        <p className="a-empty">Sin notas todavía.</p>
      ) : (
        <ul className="a-notes">
          {notas.map((n) => (
            <li key={n.id} className="a-note">
              <p>{n.contenido}</p>
              <div className="a-note-foot">
                <span className="a-muted a-small">{fechaCorta(n.created_at)}</span>
                <button className="a-icon-btn" onClick={() => borrar(n.id)} title="Eliminar">×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ---------- REUNIONES (con inicio + fin y EDITAR) ---------- */
function Reuniones({ reuniones, proyectoId, recargar }) {
  const [show, setShow] = useState(false)
  const [editId, setEditId] = useState(null)
  const nueva = () => ({ titulo: '', descripcion: '', ini: paraInputDatetime(), fin: '' })
  const [form, setForm] = useState(nueva())

  function abrirNueva() {
    setEditId(null)
    setForm(nueva())
    setShow(true)
  }

  function abrirEdicion(r) {
    setEditId(r.id)
    setForm({
      titulo: r.titulo,
      descripcion: r.descripcion || '',
      ini: paraInputDatetime(r.fecha),
      fin: r.fecha_fin ? paraInputDatetime(r.fecha_fin) : '',
    })
    setShow(true)
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titulo.trim() || !form.ini) return
    const payload = {
      titulo: form.titulo.trim(),
      descripcion: form.descripcion.trim() || null,
      fecha: new Date(form.ini).toISOString(),
      fecha_fin: form.fin ? new Date(form.fin).toISOString() : null,
    }
    if (editId) {
      await supabase.from('reuniones').update(payload).eq('id', editId)
    } else {
      await supabase.from('reuniones').insert({ ...payload, proyecto_id: proyectoId })
    }
    setShow(false)
    setEditId(null)
    recargar()
  }

  async function borrar(id) {
    if (!confirm('¿Eliminar esta reunión?')) return
    await supabase.from('reuniones').delete().eq('id', id)
    recargar()
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Reuniones de este proyecto</h2>
        <button className="a-btn a-btn-accent" onClick={abrirNueva}>+ Añadir</button>
      </div>

      {show && (
        <form className="a-subform" onSubmit={guardar}>
          <div className="a-field">
            <label className="a-label">Título *</label>
            <input className="a-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Revisión del diseño" required />
          </div>
          <div className="a-grid2">
            <div className="a-field">
              <label className="a-label">Inicio *</label>
              <input className="a-input" type="datetime-local" value={form.ini} onChange={(e) => setForm({ ...form, ini: e.target.value })} required />
            </div>
            <div className="a-field">
              <label className="a-label">Fin</label>
              <input className="a-input" type="datetime-local" value={form.fin} onChange={(e) => setForm({ ...form, fin: e.target.value })} />
            </div>
          </div>
          <div className="a-field">
            <label className="a-label">Descripción</label>
            <input className="a-input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
          </div>
          <div className="a-form-actions a-form-actions-2">
            <button type="button" className="a-btn a-btn-ghost" onClick={() => { setShow(false); setEditId(null) }}>Cancelar</button>
            <button type="submit" className="a-btn a-btn-accent">{editId ? 'Guardar cambios' : 'Guardar reunión'}</button>
          </div>
        </form>
      )}

      {reuniones.length === 0 ? (
        <p className="a-empty">Sin reuniones para este proyecto.</p>
      ) : (
        <ul className="a-list">
          {reuniones.map((r) => (
            <li key={r.id} className="a-row">
              <div>
                <strong>{r.titulo}</strong>
                <span className="a-muted a-small">
                  {rangoReunion(r.fecha, r.fecha_fin)}{r.descripcion ? ` · ${r.descripcion}` : ''}
                </span>
              </div>
              <div className="a-row-right">
                <button className="a-icon-btn" onClick={() => abrirEdicion(r)} title="Editar">✎</button>
                <button className="a-icon-btn" onClick={() => borrar(r.id)} title="Eliminar">×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
