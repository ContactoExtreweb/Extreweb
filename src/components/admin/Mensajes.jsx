// src/components/admin/Mensajes.jsx
// Mensajes del formulario de contacto. Responder (o usar una plantilla de
// Ajustes → Plantillas) los marca como respondidos, para que no salgan en Pendientes.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { fechaHora, fechaCorta } from './helpers.js'

const SERVICIOS = {
  web: 'Diseño y desarrollo web',
  seo: 'SEO',
  social: 'Redes sociales',
  sistemas: 'Sistemas y soporte',
  otro: 'Otra consulta',
}

const primerNombre = (n) => String(n || '').trim().split(/\s+/)[0] || ''

// mailto con asunto y texto; {nombre} se cambia por el nombre de quien escribió
export function enlaceCorreo(m, plantilla) {
  const rellena = (t) => String(t || '').replaceAll('{nombre}', primerNombre(m.nombre))
  const q = new URLSearchParams()
  q.set('subject', rellena(plantilla?.asunto) || 'Tu consulta en extreweb')
  if (plantilla?.cuerpo) q.set('body', rellena(plantilla.cuerpo))
  // URLSearchParams pone "+" en los espacios; los programas de correo quieren %20
  return `mailto:${m.email}?${q.toString().replace(/\+/g, '%20')}`
}

export default function Mensajes({ go, onChange, abrirId = null }) {
  const [mensajes, setMensajes] = useState([])
  const [plantillas, setPlantillas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtro, setFiltro] = useState('todos') // 'todos' | 'sinleer' | 'sinresponder'
  const [abierto, setAbierto] = useState(null)

  useEffect(() => {
    cargar()
    supabase
      .from('plantillas')
      .select('id, titulo, asunto, cuerpo')
      .order('created_at')
      .then(({ data }) => setPlantillas(data || []))
  }, [])

  async function cargar() {
    setLoading(true)
    let { data, error } = await supabase
      .from('mensajes')
      .select('id, nombre, email, servicio, mensaje, leido, created_at, pagina, origen, respondido_at')
      .order('created_at', { ascending: false })
    // Sin la migración aún no existen las columnas nuevas: se carga lo de siempre
    if (error) {
      ;({ data, error } = await supabase
        .from('mensajes')
        .select('id, nombre, email, servicio, mensaje, leido, created_at')
        .order('created_at', { ascending: false }))
    }
    if (error) setError('No se han podido cargar los mensajes. ¿Está Supabase activo?')
    setMensajes(data || [])
    setLoading(false)

    // Viene de pulsar un mensaje en el Inicio: se abre directamente
    // String(): el id que llega de la URL es texto ("61") y el de la base, número
    const pedido = abrirId && (data || []).find((m) => String(m.id) === String(abrirId))
    if (pedido) {
      setAbierto(pedido.id)
      if (!pedido.leido) marcar(pedido, true)
    }
  }

  async function actualizar(m, cambios) {
    const { error } = await supabase.from('mensajes').update(cambios).eq('id', m.id)
    if (error) return setError('No se ha podido actualizar el mensaje.')
    setMensajes((list) => list.map((x) => (x.id === m.id ? { ...x, ...cambios } : x)))
    onChange?.()
  }

  const marcar = (m, leido) => actualizar(m, { leido })

  // Al pulsar Responder se da por respondido (y leído)
  function respondido(m) {
    if (m.respondido_at === undefined) return // sin la migración, no hay dónde apuntarlo
    if (!m.respondido_at) actualizar(m, { respondido_at: new Date().toISOString(), leido: true })
  }

  function usarPlantilla(m, id) {
    const p = plantillas.find((x) => String(x.id) === String(id))
    if (!p) return
    respondido(m)
    window.location.href = enlaceCorreo(m, p)
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

  const hayRespondido = mensajes.some((m) => m.respondido_at !== undefined)
  const sinLeer = mensajes.filter((m) => !m.leido).length
  const sinResponder = hayRespondido ? mensajes.filter((m) => !m.respondido_at).length : 0
  const lista =
    filtro === 'sinleer'
      ? mensajes.filter((m) => !m.leido)
      : filtro === 'sinresponder'
        ? mensajes.filter((m) => !m.respondido_at)
        : mensajes

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
          {hayRespondido && (
            <button className={`a-switch-btn ${filtro === 'sinresponder' ? 'is-on' : ''}`} onClick={() => setFiltro('sinresponder')}>
              Sin responder{sinResponder ? ` (${sinResponder})` : ''}
            </button>
          )}
        </div>
      </div>

      {error && <p className="a-error">{error}</p>}

      {loading ? (
        <p className="a-muted">Cargando…</p>
      ) : lista.length === 0 ? (
        <div className="a-card a-empty-card">
          <p className="a-empty">
            {filtro === 'sinleer'
              ? 'No hay mensajes sin leer. 🎉'
              : filtro === 'sinresponder'
                ? 'Todo respondido. 🎉'
                : 'Aún no ha llegado ningún mensaje.'}
          </p>
        </div>
      ) : (
        <div className="a-card a-msgs">
          {lista.map((m) => {
            const open = abierto === m.id
            const desde = [m.pagina && `la página ${m.pagina}`, m.origen].filter(Boolean).join(' · ')
            return (
              <article key={m.id} className={`a-msg ${m.leido ? '' : 'is-unread'} ${open ? 'is-open' : ''}`}>
                <button className="a-msg-head" onClick={() => abrir(m)} aria-expanded={open}>
                  <span className="a-msg-dot" aria-hidden="true" />
                  <span className="a-msg-main">
                    <span className="a-msg-top">
                      <strong className="a-msg-name">{m.nombre}</strong>
                      <span className="a-msg-date">{fechaHora(m.created_at)}</span>
                    </span>
                    <span className="a-msg-tags">
                      {m.servicio && <span className="a-msg-service">{SERVICIOS[m.servicio] || m.servicio}</span>}
                      {m.respondido_at && <span className="a-badge a-badge-ok">Respondido</span>}
                    </span>
                    {!open && <span className="a-msg-excerpt">{m.mensaje}</span>}
                  </span>
                </button>

                {open && (
                  <div className="a-msg-body">
                    <p className="a-msg-text">{m.mensaje}</p>
                    <a className="a-msg-email" href={`mailto:${m.email}`}>{m.email}</a>
                    {desde && <p className="a-small a-muted a-msg-desde">Llegó desde {desde}.</p>}
                    {m.respondido_at && (
                      <p className="a-small a-muted">Respondido el {fechaCorta(m.respondido_at)}.</p>
                    )}
                    <div className="a-msg-actions">
                      <a className="a-btn a-btn-accent" href={enlaceCorreo(m)} onClick={() => respondido(m)}>
                        Responder
                      </a>
                      {plantillas.length > 0 && (
                        <select
                          className="a-select a-select-sm a-msg-plantilla"
                          value=""
                          onChange={(e) => usarPlantilla(m, e.target.value)}
                          aria-label="Responder con una plantilla"
                        >
                          <option value="">Con plantilla…</option>
                          {plantillas.map((p) => (
                            <option key={p.id} value={p.id}>{p.titulo}</option>
                          ))}
                        </select>
                      )}
                      <button className="a-btn" onClick={() => crearCliente(m)}>Crear cliente</button>
                      {m.respondido_at === null && (
                        <button className="a-btn a-btn-ghost" onClick={() => respondido(m)} title="No necesita respuesta o ya se contestó por otro lado">
                          Dar por respondido
                        </button>
                      )}
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
