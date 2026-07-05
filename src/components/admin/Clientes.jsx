// src/components/admin/Clientes.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'

export default function Clientes({ go }) {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nombre: '', empresa: '', email: '', telefono: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, empresa, email, telefono')
      .order('created_at', { ascending: false })
    setClientes(data || [])
    setLoading(false)
  }

  async function crear(e) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    const { error } = await supabase.from('clientes').insert({
      nombre: form.nombre.trim(),
      empresa: form.empresa.trim() || null,
      email: form.email.trim() || null,
      telefono: form.telefono.trim() || null,
    })
    setSaving(false)
    if (!error) {
      setForm({ nombre: '', empresa: '', email: '', telefono: '' })
      setShowForm(false)
      cargar()
    }
  }

  return (
    <div>
      <div className="a-topbar">
        <div>
          <h1 className="a-h1">Clientes</h1>
          <p className="a-muted">{clientes.length} en total.</p>
        </div>
        <button className="a-btn a-btn-accent" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancelar' : '+ Nuevo cliente'}
        </button>
      </div>

      {showForm && (
        <form className="a-card a-form" onSubmit={crear}>
          <div className="a-grid2">
            <div className="a-field">
              <label className="a-label">Nombre *</label>
              <input className="a-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del cliente" required />
            </div>
            <div className="a-field">
              <label className="a-label">Empresa</label>
              <input className="a-input" value={form.empresa} onChange={(e) => setForm({ ...form, empresa: e.target.value })} placeholder="Empresa (opcional)" />
            </div>
            <div className="a-field">
              <label className="a-label">Email</label>
              <input className="a-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            </div>
            <div className="a-field">
              <label className="a-label">Teléfono</label>
              <input className="a-input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="600 000 000" />
            </div>
          </div>
          <div className="a-form-actions">
            <button type="submit" className="a-btn a-btn-accent" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cliente'}</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="a-muted">Cargando…</p>
      ) : clientes.length === 0 ? (
        <div className="a-card a-empty-card">
          <p className="a-empty">Aún no hay clientes. Crea el primero con “Nuevo cliente”.</p>
        </div>
      ) : (
        <div className="a-card">
          <ul className="a-list">
            {clientes.map((c) => (
              <li key={c.id} className="a-row a-row-click" onClick={() => go('cliente', { clienteId: c.id })}>
                <div>
                  <strong>{c.nombre}</strong>
                  <span className="a-muted a-small">{c.empresa || c.email || c.telefono || '—'}</span>
                </div>
                <span className="a-chevron">›</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
