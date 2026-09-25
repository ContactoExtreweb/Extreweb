// src/components/admin/Buscador.jsx — buscar en todo el panel (lupa o Ctrl+K)
// Busca a la vez en clientes, proyectos, mensajes, notas de proyecto y reuniones.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { fechaCorta } from './helpers.js'

// En los filtros "or" de Supabase las comas y los paréntesis tienen significado: fuera
const limpia = (t) => t.replace(/[%,()*\\"]/g, ' ').replace(/\s+/g, ' ').trim()

async function buscar(texto) {
  const p = `%${texto}%`
  const proyectos = async () => {
    const r = await supabase
      .from('proyectos')
      .select('id, titulo, dominio, cliente_id, cliente:clientes(nombre)')
      .or(`titulo.ilike.${p},descripcion.ilike.${p},dominio.ilike.${p}`)
      .limit(5)
    if (!r.error) return r
    // Sin la migración no existe `dominio`
    return supabase
      .from('proyectos')
      .select('id, titulo, cliente_id, cliente:clientes(nombre)')
      .or(`titulo.ilike.${p},descripcion.ilike.${p}`)
      .limit(5)
  }

  const [cli, pro, msg, not, reu] = await Promise.all([
    supabase.from('clientes').select('id, nombre, empresa, email').or(`nombre.ilike.${p},empresa.ilike.${p},email.ilike.${p},telefono.ilike.${p}`).limit(5),
    proyectos(),
    supabase.from('mensajes').select('id, nombre, email, mensaje, created_at').or(`nombre.ilike.${p},email.ilike.${p},mensaje.ilike.${p}`).order('created_at', { ascending: false }).limit(5),
    supabase.from('notas').select('id, contenido, proyecto:proyectos(id, titulo, cliente_id)').ilike('contenido', p).limit(4),
    supabase.from('reuniones').select('id, titulo, fecha').ilike('titulo', p).order('fecha', { ascending: false }).limit(3),
  ])

  return [
    ...(cli.data || []).map((c) => ({
      id: `c${c.id}`,
      grupo: 'Clientes',
      titulo: c.nombre,
      detalle: [c.empresa, c.email].filter(Boolean).join(' · '),
      ir: ['cliente', { clienteId: c.id }],
    })),
    ...(pro.data || []).map((x) => ({
      id: `p${x.id}`,
      grupo: 'Proyectos',
      titulo: x.titulo,
      detalle: [x.cliente?.nombre, x.dominio].filter(Boolean).join(' · '),
      ir: ['proyecto', { proyectoId: x.id, clienteId: x.cliente_id }],
    })),
    ...(msg.data || []).map((m) => ({
      id: `m${m.id}`,
      grupo: 'Mensajes',
      titulo: m.nombre,
      detalle: `${fechaCorta(m.created_at)} · ${m.mensaje.slice(0, 80)}`,
      ir: ['mensajes', { mensajeId: m.id }],
    })),
    ...(not.data || [])
      .filter((n) => n.proyecto)
      .map((n) => ({
        id: `n${n.id}`,
        grupo: 'Notas de proyecto',
        titulo: n.contenido.slice(0, 70),
        detalle: n.proyecto.titulo,
        ir: ['proyecto', { proyectoId: n.proyecto.id, clienteId: n.proyecto.cliente_id }],
      })),
    ...(reu.data || []).map((r) => ({
      id: `r${r.id}`,
      grupo: 'Reuniones',
      titulo: r.titulo,
      detalle: fechaCorta(r.fecha),
      ir: ['calendario', {}],
    })),
  ]
}

export default function Buscador({ onClose, go }) {
  const [q, setQ] = useState('')
  const [res, setRes] = useState(null) // null = aún no se ha buscado
  const [sel, setSel] = useState(0)
  const [cargando, setCargando] = useState(false)
  const input = useRef(null)

  useEffect(() => {
    input.current?.focus()
  }, [])

  // Espera a que se deje de escribir un momento antes de buscar
  useEffect(() => {
    const t = limpia(q)
    if (t.length < 2) {
      setRes(null)
      return
    }
    setCargando(true)
    let vivo = true
    const id = setTimeout(async () => {
      const r = await buscar(t)
      if (!vivo) return
      setRes(r)
      setSel(0)
      setCargando(false)
    }, 250)
    return () => {
      vivo = false
      clearTimeout(id)
    }
  }, [q])

  function abrir(r) {
    onClose()
    go(r.ir[0], r.ir[1])
  }

  function teclas(e) {
    if (e.key === 'Escape') return onClose()
    if (!res?.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSel((s) => (s + 1) % res.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSel((s) => (s - 1 + res.length) % res.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      abrir(res[sel])
    }
  }

  let grupoAnterior = ''
  return (
    <div className="a-modal-back a-busca-back" onClick={onClose}>
      <div className="a-busca" role="dialog" aria-modal="true" aria-label="Buscar en el panel" onClick={(e) => e.stopPropagation()}>
        <div className="a-busca-campo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={teclas}
            placeholder="Buscar clientes, proyectos, mensajes, notas…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded={!!res?.length}
            aria-controls="a-busca-lista"
            aria-activedescendant={res?.length ? `a-busca-${res[sel]?.id}` : undefined}
          />
          <kbd className="a-kbd">Esc</kbd>
        </div>

        {res === null ? (
          <p className="a-busca-vacio">Escribe al menos dos letras. Consejo: <kbd className="a-kbd">Ctrl</kbd> + <kbd className="a-kbd">K</kbd> lo abre desde cualquier pantalla.</p>
        ) : cargando && res.length === 0 ? (
          <p className="a-busca-vacio">Buscando…</p>
        ) : res.length === 0 ? (
          <p className="a-busca-vacio">Nada con «{limpia(q)}».</p>
        ) : (
          <ul className="a-busca-lista" id="a-busca-lista" role="listbox">
            {res.map((r, i) => {
              const cabecera = r.grupo !== grupoAnterior
              grupoAnterior = r.grupo
              return (
                <li key={r.id} role="presentation">
                  {cabecera && <span className="a-busca-grupo">{r.grupo}</span>}
                  <button
                    id={`a-busca-${r.id}`}
                    role="option"
                    aria-selected={i === sel}
                    className={`a-busca-item ${i === sel ? 'is-sel' : ''}`}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => abrir(r)}
                  >
                    <strong>{r.titulo}</strong>
                    {r.detalle && <span>{r.detalle}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
