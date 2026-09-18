// src/components/admin/NotasRapidas.jsx — post-its del Inicio
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'

export default function NotasRapidas() {
  const [notas, setNotas] = useState([])
  const [texto, setTexto] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const { data, error } = await supabase
      .from('notas_rapidas')
      .select('id, texto, hecha, created_at')
      .order('created_at', { ascending: false })
    if (error) setError('No se han podido cargar las notas.')
    setNotas(data || [])
  }

  async function add(e) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    setTexto('')
    const { data, error } = await supabase.from('notas_rapidas').insert({ texto: t }).select().single()
    if (error) {
      setTexto(t)
      return setError('No se ha podido guardar la nota.')
    }
    setError('')
    setNotas((list) => [data, ...list])
  }

  async function toggle(n) {
    setNotas((list) => list.map((x) => (x.id === n.id ? { ...x, hecha: !n.hecha } : x)))
    const { error } = await supabase.from('notas_rapidas').update({ hecha: !n.hecha }).eq('id', n.id)
    if (error) {
      setError('No se ha podido actualizar la nota.')
      cargar()
    }
  }

  async function borrar(n) {
    setNotas((list) => list.filter((x) => x.id !== n.id))
    const { error } = await supabase.from('notas_rapidas').delete().eq('id', n.id)
    if (error) {
      setError('No se ha podido borrar la nota.')
      cargar()
    }
  }

  async function borrarHechas() {
    const ids = notas.filter((n) => n.hecha).map((n) => n.id)
    if (!ids.length) return
    setNotas((list) => list.filter((x) => !x.hecha))
    const { error } = await supabase.from('notas_rapidas').delete().in('id', ids)
    if (error) {
      setError('No se han podido borrar las notas hechas.')
      cargar()
    }
  }

  // Pendientes primero; las hechas abajo
  const pendientes = notas.filter((n) => !n.hecha)
  const hechas = notas.filter((n) => n.hecha)

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Notas rápidas</h2>
        {hechas.length > 0 && (
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={borrarHechas}>
            Borrar hechas
          </button>
        )}
      </div>

      <form className="a-qnote-add" onSubmit={add}>
        <input
          className="a-input"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Apunta algo y pulsa Intro…"
          aria-label="Nueva nota rápida"
          maxLength={500}
        />
        <button type="submit" className="a-btn a-btn-accent" disabled={!texto.trim()} aria-label="Añadir nota">
          +
        </button>
      </form>

      {error && <p className="a-error">{error}</p>}

      {notas.length === 0 ? (
        <p className="a-empty">Nada apuntado. Aquí van los recados, ideas y cosas que no quieres olvidar.</p>
      ) : (
        <ul className="a-qnotes">
          {[...pendientes, ...hechas].map((n) => (
            <li key={n.id} className={`a-qnote ${n.hecha ? 'is-done' : ''}`}>
              <button
                className={`a-check ${n.hecha ? 'is-on' : ''}`}
                onClick={() => toggle(n)}
                aria-label={n.hecha ? 'Marcar como pendiente' : 'Marcar como hecha'}
              >
                {n.hecha ? '✓' : ''}
              </button>
              <span className="a-qnote-text">{n.texto}</span>
              <button className="a-icon-btn" onClick={() => borrar(n)} aria-label="Borrar nota">×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
