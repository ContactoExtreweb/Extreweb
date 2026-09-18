// src/components/admin/Mensajes.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { fechaHora } from './helpers.js'

const SERVICIOS = {
  web: 'Diseño y desarrollo web',
  seo: 'SEO',
  social: 'Redes sociales',
  sistemas: 'Sistemas y soporte',
  otro: 'Otra consulta',
}

export default function Mensajes({ go, onChange }) {
  const [mensajes, setMensajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos') // 'todos' | 'sinleer'
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    setLoading(true)
    const { data, error } = await supabase
      .from('mensajes')
      .select('id, nombre, email, servicio, mensaje, leido, created_at')
      .order('created_at', { ascending: false })
    if (error) setError('No se han podido cargar los mensajes. ¿Está Supabase activo?')
    setMensajes(data || [])
    setLoading(false)
  }

  async function marcar(m, leido) {
    const { error } = await supabase.from('mensajes').update({ leido }).eq('id', m.id)
    if (error) return setError('No se ha podido actualizar el mensaje.')
    setMensajes((list) => list.map((x) => (x.id === m.id ? { ...x, leido } : x)))
    onChange?.()
  }

  function abrir(m) {
    const cerrar = abierto === m.id
    setAbierto(cerrar ? null : m.id)
    if (!cerrar && !m.leido) marcar(m, true)
  }

  async function borrar(m) {
    if (!confirm(`¿Eliminar el mensaje de ${m.nombre}? No se puede deshacer.`)) return
    const { error } = await supabase.from('mensajes').delete().eq('id', m.id)
    if (error) return setError('No se ha podido eliminar el mensaje.')
    setMensajes((list) => list.filter((x) => x.id !== m.id))
    setAbierto(null)
    onChange?.()
  }

  async function crearCliente(m) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        nombre: m.nombre,
        email: m.email || null,
        notas: `Primer contacto por la web (${fechaHora(m.created_at)}):\n${m.mensaje}`,
      })
      .select('id')
      .single()
    if (error) return setError('No se ha podido crear el cliente.')
    go('cliente', { clienteId: data.id })
  }

  const sinLeer = mensajes.filter((m) => !m.leido).length
  const lista = filtro === 'sinleer' ? mensajes.filter((m) => !m.leido) : mensajes

  return (
    <div>
      <div className="a-topbar">
        <div>
          <h1 className="a-h1">Mensajes</h1>
          <p className="a-muted">
            {sinLeer === 0 ? 'Todo leído.' : `${sinLeer} sin leer.`} Llegan desde el formulario de contacto.
          </p>
        </div>
        <div className="a-cal-switch">
          <button className={`a-switch-btn ${filtro === 'todos' ? 'is-on' : ''}`} onClick={() => setFiltro('todos')}>
            Todos
          </button>
          <button className={`a-switch-btn ${filtro === 'sinleer' ? 'is-on' : ''}`} onClick={() => setFiltro('sinleer')}>
            Sin leer
          </button>
        </div>
      </div>

      {error && <p className="a-error">{error}</p>}

      {loading ? (
        <p className="a-muted">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="a-card a-empty-card">
          <p className="a-empty">{filtro === 'sinleer' ? 'No hay mensajes sin leer. 🎉' : 'Aún no ha llegado ningún mensaje.'}</p>
        </div>
      ) : (
        <div className="a-card a-msgs">
          {lista.map((m) => {
            const open = abierto === m.id
            return (
              <article key={m.id} className={`a-msg ${m.leido ? '' : 'is-unread'} ${open ? 'is-open' : ''}`}>
                <button className="a-msg-head" onClick={() => abrir(m)} aria-expanded={open}>
                  <span className="a-msg-dot" aria-hidden="true" />
                  <span className="a-msg-main">
                    <span className="a-msg-top">
                      <strong className="a-msg-name">{m.nombre}</strong>
                      <span className="a-msg-date">{fechaHora(m.created_at)}</span>
                    </span>
                    {m.servicio && <span className="a-msg-service">{SERVICIOS[m.servicio] || m.servicio}</span>}
                    {!open && <span className="a-msg-excerpt">{m.mensaje}</span>}
                  </span>
                </button>

                {open && (
                  <div className="a-msg-body">
                    <p className="a-msg-text">{m.mensaje}</p>
                    <a className="a-msg-email" href={`mailto:${m.email}`}>{m.email}</a>
                    <div className="a-msg-actions">
                      <a
                        className="a-btn a-btn-accent"
                        href={`mailto:${m.email}?subject=${encodeURIComponent('Tu consulta en extreweb')}`}
                      >
                        Responder
                      </a>
                      <button className="a-btn" onClick={() => crearCliente(m)}>Crear cliente</button>
                      <button className="a-btn a-btn-ghost" onClick={() => marcar(m, false)}>Marcar no leído</button>
                      <button className="a-btn a-btn-danger" onClick={() => borrar(m)}>Eliminar</button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
