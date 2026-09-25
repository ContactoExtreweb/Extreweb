// src/components/admin/ClienteDetalle.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import Renovaciones from './Renovaciones.jsx'
import { ResenaCliente } from './Resenas.jsx'

export default function ClienteDetalle({ clienteId, go }) {
  const [cliente, setCliente] = useState(null)
  const [proyectos, setProyectos] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showProj, setShowProj] = useState(false)
  const [proj, setProj] = useState({ titulo: '', descripcion: '' })

  useEffect(() => {
    cargar()
  }, [clienteId])

  async function cargar() {
    setLoading(true)
    const [{ data: c }, { data: p }] = await Promise.all([
      supabase.from('clientes').select('*').eq('id', clienteId).single(),
      supabase.from('proyectos').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false }),
    ])
    setCliente(c)
    setForm(c || {})
    setProyectos(p || [])
    setLoading(false)
  }

  async function guardar(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('clientes')
      .update({
        nombre: form.nombre,
        empresa: form.empresa || null,
        email: form.email || null,
        telefono: form.telefono || null,
        notas: form.notas || null,
      })
      .eq('id', clienteId)
    if (!error) {
      setEditing(false)
      cargar()
    }
  }

  async function borrar() {
    if (!confirm('¿Eliminar este cliente y TODOS sus proyectos, presupuestos y notas? No se puede deshacer.')) return
    const { error } = await supabase.from('clientes').delete().eq('id', clienteId)
    if (!error) go('clientes')
  }

  async function crearProyecto(e) {
    e.preventDefault()
    if (!proj.titulo.trim()) return
    const { error } = await supabase.from('proyectos').insert({
      cliente_id: clienteId,
      titulo: proj.titulo.trim(),
      descripcion: proj.descripcion.trim() || null,
    })
    if (!error) {
      setProj({ titulo: '', descripcion: '' })
      setShowProj(false)
      cargar()
    }
  }

  if (loading) return <p className="a-muted">Cargando…</p>
  if (!cliente) return <p className="a-muted">Cliente no encontrado.</p>

  return (
    <div>
      <button className="a-back" onClick={() => go('clientes')}>‹ Clientes</button>

      <div className="a-topbar">
        <div>
          <h1 className="a-h1">{cliente.nombre}</h1>
          <p className="a-muted">{cliente.empresa || 'Sin empresa'}</p>
        </div>
        <div className="a-topbar-actions">
          <button className="a-btn a-btn-ghost" onClick={() => setEditing((s) => !s)}>{editing ? 'Cancelar' : 'Editar'}</button>
          <button className="a-btn a-btn-danger" onClick={borrar}>Eliminar</button>
        </div>
      </div>

      {editing ? (
        <form className="a-card a-form" onSubmit={guardar}>
          <div className="a-grid2">
            <div className="a-field">
              <label className="a-label">Nombre</label>
              <input className="a-input" value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="a-field">
              <label className="a-label">Empresa</label>
              <input className="a-input" value={form.empresa || ''} onChange={(e) => setForm({ ...form, empresa: e.target.value })} />
            </div>
            <div className="a-field">
              <label className="a-label">Email</label>
              <input className="a-input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="a-field">
              <label className="a-label">Teléfono</label>
              <input className="a-input" value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
          </div>
          <div className="a-field">
            <label className="a-label">Notas generales del cliente</label>
            <textarea className="a-input" rows="3" value={form.notas || ''} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
          </div>
          <div className="a-form-actions">
            <button type="submit" className="a-btn a-btn-accent">Guardar cambios</button>
          </div>
        </form>
      ) : (
        <div className="a-card a-info">
          <div className="a-info-grid">
            <div><span className="a-label">Email</span><p>{cliente.email || '—'}</p></div>
            <div><span className="a-label">Teléfono</span><p>{cliente.telefono || '—'}</p></div>
          </div>
          {cliente.notas && (
            <div className="a-info-notes">
              <span className="a-label">Notas</span>
              <p>{cliente.notas}</p>
            </div>
          )}
        </div>
      )}

      <ResenaCliente cliente={cliente} onCambio={(nuevo) => setCliente((c) => ({ ...c, ...nuevo }))} />

      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Proyectos</h2>
          <button className="a-btn a-btn-accent" onClick={() => setShowProj((s) => !s)}>{showProj ? 'Cancelar' : '+ Nuevo proyecto'}</button>
        </div>

        {showProj && (
          <form className="a-subform" onSubmit={crearProyecto}>
            <div className="a-field">
              <label className="a-label">Título *</label>
              <input className="a-input" value={proj.titulo} onChange={(e) => setProj({ ...proj, titulo: e.target.value })} placeholder="Ej. Web corporativa" required />
            </div>
            <div className="a-field">
              <label className="a-label">Descripción</label>
              <input className="a-input" value={proj.descripcion} onChange={(e) => setProj({ ...proj, descripcion: e.target.value })} placeholder="Breve descripción (opcional)" />
            </div>
            <div className="a-form-actions">
              <button type="submit" className="a-btn a-btn-accent">Crear proyecto</button>
            </div>
          </form>
        )}

        {proyectos.length === 0 ? (
          <p className="a-empty">Este cliente aún no tiene proyectos.</p>
        ) : (
          <ul className="a-list">
            {proyectos.map((p) => (
              <li key={p.id} className="a-row a-row-click" onClick={() => go('proyecto', { proyectoId: p.id, clienteId })}>
                <div>
                  <strong>{p.titulo}</strong>
                  <span className="a-muted a-small">{p.dominio || p.descripcion || '—'}</span>
                </div>
                <span className={`a-badge a-estado-${p.estado}`}>{p.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Renovaciones clienteId={clienteId} />
    </div>
  )
}
