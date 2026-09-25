// src/components/admin/Horas.jsx — pestaña "Horas" del proyecto
// Apuntar lo que se dedica (aunque sea a ojo) y ver cuánto sale la hora de verdad:
// lo presupuestado sin IVA entre las horas apuntadas.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro, fechaCorta, duracion, diaISO } from './helpers.js'

// "1:30" → 90 · "1,5" → 90 · "2h" → 120 · "45 min" → 45
export function aMinutos(txt) {
  const s = String(txt || '').trim().toLowerCase().replace(',', '.')
  if (!s) return 0
  const hm = s.match(/^(\d+):(\d{1,2})$/)
  if (hm) return Number(hm[1]) * 60 + Number(hm[2])
  const min = s.match(/^(\d+(?:\.\d+)?)\s*(m|min|mins|minutos?)$/)
  if (min) return Math.round(Number(min[1]))
  const h = s.match(/^(\d+(?:\.\d+)?)\s*(h|hora|horas)?$/)
  if (h) return Math.round(Number(h[1]) * 60)
  return 0
}

export default function Horas({ proyectoId, totalBase }) {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState({ fecha: diaISO(), tiempo: '', nota: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [proyectoId])

  async function cargar() {
    const { data, error } = await supabase
      .from('horas')
      .select('id, fecha, minutos, nota')
      .eq('proyecto_id', proyectoId)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) setError(/relation|does not exist|schema cache/i.test(error.message) ? 'Falta ejecutar supabase/panel-ampliacion.sql.' : 'No se han podido cargar las horas.')
    setLista(data || [])
  }

  const minutos = aMinutos(form.tiempo)

  async function add(e) {
    e.preventDefault()
    if (!minutos) return
    const { error } = await supabase
      .from('horas')
      .insert({ proyecto_id: proyectoId, fecha: form.fecha || diaISO(), minutos, nota: form.nota.trim() || null })
    if (error) return setError('No se han podido guardar las horas.')
    setError('')
    setForm({ fecha: form.fecha, tiempo: '', nota: '' })
    cargar()
  }

  async function borrar(id) {
    await supabase.from('horas').delete().eq('id', id)
    setLista((l) => l.filter((x) => x.id !== id))
  }

  const total = lista.reduce((s, h) => s + h.minutos, 0)
  const porHora = total > 0 && totalBase > 0 ? totalBase / (total / 60) : null

  return (
    <>
      <div className="a-vis-stats">
        <div className="a-money-box">
          <span className="a-stat-label">Horas dedicadas</span>
          <strong>{duracion(total)}</strong>
        </div>
        <div className="a-money-box">
          <span className="a-stat-label">Presupuestado (sin IVA)</span>
          <strong>{euro(totalBase)}</strong>
        </div>
        <div className="a-money-box">
          <span className="a-stat-label">Sale la hora a</span>
          <strong>{porHora ? euro(porHora) : '—'}</strong>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Apuntar horas</h2>
        </div>
        {error && <p className="a-error">{error}</p>}
        <form className="a-horas-add" onSubmit={add}>
          <input
            className="a-input"
            type="date"
            value={form.fecha}
            onChange={(e) => setForm({ ...form, fecha: e.target.value })}
            aria-label="Día"
          />
          <input
            className="a-input a-input-num a-horas-tiempo"
            value={form.tiempo}
            onChange={(e) => setForm({ ...form, tiempo: e.target.value })}
            placeholder="1:30"
            aria-label="Tiempo (1:30, 1,5 o 45 min)"
            inputMode="decimal"
          />
          <input
            className="a-input a-horas-nota"
            value={form.nota}
            onChange={(e) => setForm({ ...form, nota: e.target.value })}
            placeholder="Qué se hizo (opcional)"
            aria-label="Qué se hizo"
            maxLength={200}
          />
          <button type="submit" className="a-btn a-btn-accent" disabled={!minutos}>
            + {minutos ? duracion(minutos) : 'Añadir'}
          </button>
        </form>
        <p className="a-small a-muted">Vale «1:30», «1,5» (hora y media) o «45 min».</p>

        {lista.length === 0 ? (
          <p className="a-empty">Sin horas apuntadas todavía.</p>
        ) : (
          <ul className="a-list">
            {lista.map((h) => (
              <li key={h.id} className="a-row">
                <div>
                  <strong>{duracion(h.minutos)}</strong>
                  <span className="a-muted a-small">
                    {fechaCorta(h.fecha)}
                    {h.nota ? ` · ${h.nota}` : ''}
                  </span>
                </div>
                <button className="a-icon-btn" onClick={() => borrar(h.id)} aria-label="Borrar">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
