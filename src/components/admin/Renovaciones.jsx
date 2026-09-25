// src/components/admin/Renovaciones.jsx — cobros que se repiten (en la ficha del cliente)
// Dominios, alojamiento y cuotas de mantenimiento con su próxima fecha. Las que
// vencen en 30 días salen en Pendientes (Inicio). "Renovada" pasa la fecha al
// siguiente periodo.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro, fechaCorta, plazo, diasHasta, sumarPeriodo, diaISO } from './helpers.js'

const TIPOS = { dominio: 'Dominio', alojamiento: 'Alojamiento', mantenimiento: 'Mantenimiento', otro: 'Otro' }
const PERIODOS = { mensual: 'al mes', trimestral: 'al trimestre', anual: 'al año' }
const POR_ANO = { mensual: 12, trimestral: 4, anual: 1 }

const vacia = () => ({ concepto: '', tipo: 'mantenimiento', importe: '', periodo: 'anual', proxima: diaISO(), notas: '' })

export default function Renovaciones({ clienteId }) {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(null) // null = cerrado; si tiene id, es edición
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [clienteId])

  async function cargar() {
    const { data, error } = await supabase
      .from('renovaciones')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('proxima')
    if (error) setError(/relation|does not exist|schema cache/i.test(error.message) ? 'Falta ejecutar supabase/panel-ampliacion.sql.' : 'No se han podido cargar las renovaciones.')
    setLista(data || [])
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.concepto.trim() || !form.proxima) return
    const fila = {
      concepto: form.concepto.trim(),
      tipo: form.tipo,
      importe: Number(String(form.importe).replace(',', '.')) || 0,
      periodo: form.periodo,
      proxima: form.proxima,
      notas: form.notas.trim() || null,
    }
    const { error } = form.id
      ? await supabase.from('renovaciones').update(fila).eq('id', form.id)
      : await supabase.from('renovaciones').insert({ ...fila, cliente_id: clienteId })
    if (error) return setError('No se ha podido guardar la renovación.')
    setError('')
    setForm(null)
    cargar()
  }

  async function renovada(r) {
    const proxima = sumarPeriodo(r.proxima, r.periodo)
    if (!confirm(`¿Marcar «${r.concepto}» como renovada? La próxima fecha pasará al ${fechaCorta(proxima)}.`)) return
    const { error } = await supabase.from('renovaciones').update({ proxima }).eq('id', r.id)
    if (error) return setError('No se ha podido actualizar.')
    cargar()
  }

  async function pausar(r) {
    await supabase.from('renovaciones').update({ activa: !r.activa }).eq('id', r.id)
    cargar()
  }

  async function borrar(r) {
    if (!confirm(`¿Eliminar «${r.concepto}»?`)) return
    await supabase.from('renovaciones').delete().eq('id', r.id)
    cargar()
  }

  // Lo que entra al año por estas cuotas (solo las activas)
  const alAno = lista.filter((r) => r.activa).reduce((s, r) => s + Number(r.importe || 0) * POR_ANO[r.periodo], 0)

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Renovaciones y cuotas</h2>
        <button className="a-btn a-btn-accent" onClick={() => setForm(form ? null : vacia())}>
          {form && !form.id ? 'Cancelar' : '+ Añadir'}
        </button>
      </div>

      {error && <p className="a-error">{error}</p>}

      {form && (
        <form className="a-subform" onSubmit={guardar}>
          <div className="a-grid2">
            <div className="a-field">
              <label className="a-label" htmlFor="ren-concepto">Concepto *</label>
              <input
                id="ren-concepto"
                className="a-input"
                value={form.concepto}
                onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                placeholder="Ej. Dominio guadicar.es"
                required
              />
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ren-tipo">Tipo</label>
              <select id="ren-tipo" className="a-select" value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                {Object.entries(TIPOS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ren-importe">Importe (€)</label>
              <input
                id="ren-importe"
                className="a-input a-input-num"
                inputMode="decimal"
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ren-periodo">Cada cuánto</label>
              <select id="ren-periodo" className="a-select" value={form.periodo} onChange={(e) => setForm({ ...form, periodo: e.target.value })}>
                <option value="mensual">Cada mes</option>
                <option value="trimestral">Cada trimestre</option>
                <option value="anual">Cada año</option>
              </select>
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ren-proxima">Próxima fecha *</label>
              <input
                id="ren-proxima"
                className="a-input"
                type="date"
                value={form.proxima}
                onChange={(e) => setForm({ ...form, proxima: e.target.value })}
                required
              />
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ren-notas">Notas</label>
              <input
                id="ren-notas"
                className="a-input"
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Ej. registrado en IONOS"
              />
            </div>
          </div>
          <div className="a-form-actions a-form-actions-2">
            <button type="button" className="a-btn a-btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            <button type="submit" className="a-btn a-btn-accent">{form.id ? 'Guardar cambios' : 'Guardar'}</button>
          </div>
        </form>
      )}

      {lista.length === 0 ? (
        <p className="a-empty">
          Sin cuotas. Apunta aquí el dominio, el alojamiento o el mantenimiento para que el panel te avise antes de que venzan.
        </p>
      ) : (
        <>
          <ul className="a-list">
            {lista.map((r) => {
              const d = diasHasta(r.proxima)
              return (
                <li key={r.id} className={`a-row a-renov ${r.activa ? '' : 'is-pausada'}`}>
                  <div>
                    <strong>{r.concepto}</strong>
                    <span className="a-muted a-small">
                      {TIPOS[r.tipo]} · {euro(r.importe)} {PERIODOS[r.periodo]}
                      {r.notas ? ` · ${r.notas}` : ''}
                      {r.activa ? '' : ' · pausada'}
                    </span>
                  </div>
                  <div className="a-row-right a-renov-acciones">
                    <span
                      className={`a-badge ${!r.activa ? 'a-badge-date' : d < 0 ? 'a-badge-mal' : d <= 30 ? 'a-badge-warn' : 'a-badge-date'}`}
                      title={fechaCorta(r.proxima)}
                    >
                      {fechaCorta(r.proxima)} · {plazo(r.proxima)}
                    </span>
                    {r.activa && (
                      <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => renovada(r)}>
                        Renovada
                      </button>
                    )}
                    <button
                      className="a-icon-btn"
                      onClick={() => setForm({ ...r, importe: String(r.importe), notas: r.notas || '' })}
                      aria-label={`Editar ${r.concepto}`}
                    >
                      ✎
                    </button>
                    <button className="a-icon-btn" onClick={() => pausar(r)} aria-label={r.activa ? 'Pausar' : 'Reactivar'} title={r.activa ? 'Pausar (ya no se renueva)' : 'Reactivar'}>
                      {r.activa ? '⏸' : '▶'}
                    </button>
                    <button className="a-icon-btn" onClick={() => borrar(r)} aria-label={`Eliminar ${r.concepto}`}>
                      ×
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
          {alAno > 0 && (
            <p className="a-small a-muted a-renov-total">
              Ingresos recurrentes de este cliente: <strong>{euro(alAno)} al año</strong>.
            </p>
          )}
        </>
      )}
    </div>
  )
}
