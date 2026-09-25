// src/components/admin/Resenas.jsx — pedir a los clientes que dejen reseña de extreweb en Google
// El enlace (el de "Pedir reseñas" de la ficha de Google) y los textos se configuran
// en Ajustes → Reseñas en Google. Aquí están:
//   · <ResenaCliente>  tarjeta en la ficha de cada cliente
//   · <PedirResenas>   tarjeta en Clientes con los que ya tienen la web publicada
// Se registra cuándo se pidió, si se recordó y si ya la dejaron (columnas resena_* de
// `clientes`, ver supabase/resenas.sql). Que la dejaron se marca a mano: Google no avisa.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { fechaCorta, plazo } from './helpers.js'

export const MENSAJE_DEFECTO =
  'Hola, {nombre}:\n\nGracias por confiar en extreweb para vuestra web. ¿Nos dejarías tu opinión en Google? ' +
  'Es un minuto y nos ayuda mucho a que otros negocios de la zona nos encuentren:\n{enlace}\n\n¡Muchas gracias!'
export const RECORDATORIO_DEFECTO =
  'Hola, {nombre}. Te escribimos de nuevo por si no te dio tiempo: si puedes dejarnos tu opinión en Google, ' +
  'nos ayudas muchísimo. Aquí tienes el enlace:\n{enlace}\n\n¡Gracias!'
export const ASUNTO = '¿Nos dejas tu opinión en Google?'

const DIA = 864e5

export async function leerConfigResenas() {
  const { data } = await supabase
    .from('ajustes')
    .select('clave, valor')
    .in('clave', ['resenas_url', 'resenas_mensaje', 'resenas_recordatorio'])
  const c = Object.fromEntries((data || []).map((x) => [x.clave, x.valor]))
  return {
    url: c.resenas_url || '',
    mensaje: c.resenas_mensaje || MENSAJE_DEFECTO,
    recordatorio: c.resenas_recordatorio || RECORDATORIO_DEFECTO,
  }
}

const primerNombre = (n) => String(n || '').trim().split(/\s+/)[0] || ''

// Texto final: {nombre} y {enlace}. Si la plantilla no lleva {enlace}, se añade al final
export function textoResena(cliente, conf, recordar = false) {
  const plantilla = recordar ? conf.recordatorio : conf.mensaje
  let t = plantilla.replaceAll('{nombre}', primerNombre(cliente.nombre)).replaceAll('{negocio}', cliente.empresa || cliente.nombre)
  t = t.includes('{enlace}') ? t.replaceAll('{enlace}', conf.url) : `${t}\n${conf.url}`
  return t
}

// "722 49 61 24" → "34722496124" (wa.me necesita el número con prefijo y sin símbolos)
export function telefonoWhatsApp(tel) {
  let d = String(tel || '').replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.length === 9 && /^[6789]/.test(d)) d = `34${d}`
  return d.length >= 11 ? d : ''
}

export const enlaceWhatsApp = (tel, texto) => `https://wa.me/${telefonoWhatsApp(tel)}?text=${encodeURIComponent(texto)}`
export const enlaceEmail = (email, texto) =>
  `mailto:${email}?subject=${encodeURIComponent(ASUNTO)}&body=${encodeURIComponent(texto)}`

// Estado de la reseña de un cliente
export function estadoResena(c) {
  if (c.resena_recibida_at) return { clave: 'recibida', texto: 'Reseña recibida', tono: 'ok' }
  if (c.resena_recordada_at) return { clave: 'recordada', texto: `Recordada ${plazo(c.resena_recordada_at)}`, tono: 'date' }
  if (c.resena_pedida_at) {
    const toca = Date.now() - new Date(c.resena_pedida_at) > 7 * DIA
    return { clave: 'pedida', texto: `Pedida ${plazo(c.resena_pedida_at)}`, tono: toca ? 'warn' : 'date', toca }
  }
  return { clave: 'sin', texto: 'Sin pedir', tono: 'none' }
}

// ¿Tiene la web ya en marcha? (algún proyecto terminado o con la web publicada en su ficha)
export const tieneWebPublicada = (c) => (c.proyectos || []).some((p) => p.estado === 'terminado' || p.web_url)

// Apunta que se ha pedido (la primera vez) o recordado (las siguientes)
async function registrar(cliente, canal) {
  const ahora = new Date().toISOString()
  const cambios = cliente.resena_pedida_at
    ? { resena_recordada_at: ahora, resena_canal: canal }
    : { resena_pedida_at: ahora, resena_canal: canal }
  const { error } = await supabase.from('clientes').update(cambios).eq('id', cliente.id)
  return error ? null : cambios
}

/* ============================ BOTONES (compartidos) ============================ */

function Acciones({ cliente, conf, onCambio, compacto = false }) {
  const [copiado, setCopiado] = useState(false)
  const estado = estadoResena(cliente)
  const recordar = !!cliente.resena_pedida_at
  const texto = textoResena(cliente, conf, recordar)
  const tel = telefonoWhatsApp(cliente.telefono)

  async function apuntar(canal) {
    const cambios = await registrar(cliente, canal)
    if (cambios) onCambio({ ...cliente, ...cambios })
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
      apuntar('otro')
    } catch (e) {}
  }

  async function recibida(si) {
    const cambios = { resena_recibida_at: si ? new Date().toISOString() : null }
    const { error } = await supabase.from('clientes').update(cambios).eq('id', cliente.id)
    if (!error) onCambio({ ...cliente, ...cambios })
  }

  if (estado.clave === 'recibida') {
    return (
      <div className="a-resena-acciones">
        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => recibida(false)}>Deshacer</button>
      </div>
    )
  }
  // Ya se pidió y se recordó: no se insiste una tercera vez, solo queda apuntar si llega
  if (estado.clave === 'recordada') {
    return (
      <div className="a-resena-acciones">
        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => recibida(true)}>Ya la ha dejado ✓</button>
      </div>
    )
  }

  const verbo = recordar ? 'Recordar' : 'Pedir'
  return (
    <div className="a-resena-acciones">
      {tel ? (
        <a className="a-btn a-btn-accent a-btn-sm" href={enlaceWhatsApp(cliente.telefono, texto)} target="_blank" rel="noopener noreferrer" onClick={() => apuntar('whatsapp')}>
          {compacto ? 'WhatsApp' : `${verbo} por WhatsApp`}
        </a>
      ) : (
        !compacto && <span className="a-small a-muted">Sin teléfono para WhatsApp</span>
      )}
      {cliente.email && (
        <a className="a-btn a-btn-ghost a-btn-sm" href={enlaceEmail(cliente.email, texto)} onClick={() => apuntar('email')}>
          {compacto ? 'Email' : `${verbo} por email`}
        </a>
      )}
      {!compacto && (
        <button className="a-btn a-btn-ghost a-btn-sm" onClick={copiar}>{copiado ? '¡Copiado!' : 'Copiar mensaje'}</button>
      )}
      {cliente.resena_pedida_at && (
        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => recibida(true)} title="Márcalo cuando la veas en vuestra ficha de Google">
          Ya la ha dejado ✓
        </button>
      )}
    </div>
  )
}

/* ============================ FICHA DEL CLIENTE ============================ */

export function ResenaCliente({ cliente, onCambio }) {
  const [conf, setConf] = useState(null)
  const [ver, setVer] = useState(false)

  useEffect(() => {
    leerConfigResenas().then(setConf)
  }, [])

  // Sin la migración no existen las columnas: la tarjeta no se enseña
  if (!conf || !('resena_pedida_at' in cliente)) return null

  const estado = estadoResena(cliente)
  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Reseña en Google</h2>
        <span className={`a-badge ${estado.tono === 'ok' ? 'a-badge-ok' : estado.tono === 'warn' ? 'a-badge-warn' : estado.tono === 'date' ? 'a-badge-date' : ''}`}>
          {estado.texto}
        </span>
      </div>

      {!conf.url ? (
        <p className="a-empty">Falta vuestro enlace de reseñas: pégalo en Ajustes → Reseñas en Google.</p>
      ) : (
        <>
          <p className="a-small a-muted a-resena-estado">
            {estado.clave === 'sin' && 'Aún no se la habéis pedido. Se abre el mensaje ya escrito; solo tienes que darle a enviar.'}
            {estado.clave === 'pedida' && `Se la pedisteis el ${fechaCorta(cliente.resena_pedida_at)}${cliente.resena_canal && cliente.resena_canal !== 'otro' ? ` por ${cliente.resena_canal === 'whatsapp' ? 'WhatsApp' : 'email'}` : ''}.${estado.toca ? ' Ha pasado una semana: un recordatorio amable suele funcionar.' : ''}`}
            {estado.clave === 'recordada' && `Pedida el ${fechaCorta(cliente.resena_pedida_at)} y recordada el ${fechaCorta(cliente.resena_recordada_at)}. Mejor no insistir más.`}
            {estado.clave === 'recibida' && `Os la dejó (marcado el ${fechaCorta(cliente.resena_recibida_at)}). ¡Gracias, ${primerNombre(cliente.nombre)}!`}
          </p>
          <Acciones cliente={cliente} conf={conf} onCambio={onCambio} />
          {estado.clave !== 'recibida' && (
            <button className="a-link a-small a-resena-ver" onClick={() => setVer((v) => !v)}>
              {ver ? 'Ocultar el mensaje' : 'Ver el mensaje que se envía'}
            </button>
          )}
          {ver && <pre className="a-resena-texto">{textoResena(cliente, conf, !!cliente.resena_pedida_at)}</pre>}
        </>
      )}
    </div>
  )
}

/* ============================ LISTA EN CLIENTES ============================ */

export function PedirResenas({ go }) {
  const [clientes, setClientes] = useState(null)
  const [conf, setConf] = useState(null)
  const [todos, setTodos] = useState(false)

  useEffect(() => {
    leerConfigResenas().then(setConf)
    supabase
      .from('clientes')
      .select('id, nombre, empresa, email, telefono, resena_pedida_at, resena_canal, resena_recordada_at, resena_recibida_at, proyectos(estado, web_url, dominio)')
      .order('nombre')
      .then(({ data, error }) => setClientes(error ? [] : data || []))
  }, [])

  if (!clientes || !conf || !clientes.length) return null

  const conWeb = clientes.filter(tieneWebPublicada)
  const recibidas = conWeb.filter((c) => c.resena_recibida_at).length
  // Primero a quien toca pedírsela, luego a quien recordársela, y al final las recibidas
  const peso = (c) => ({ sin: 0, pedida: estadoResena(c).toca ? 1 : 2, recordada: 3, recibida: 4 })[estadoResena(c).clave]
  const lista = (todos ? clientes : conWeb).slice().sort((a, b) => peso(a) - peso(b))

  const cambiar = (nuevo) => setClientes((l) => l.map((c) => (c.id === nuevo.id ? { ...c, ...nuevo } : c)))

  return (
    <div className="a-card a-resenas">
      <div className="a-card-head">
        <div>
          <h2 className="a-h2">Reseñas en Google</h2>
          <p className="a-small a-muted">
            {conWeb.length
              ? `${recibidas} de ${conWeb.length} clientes con la web publicada os han dejado reseña.`
              : 'Aún no hay clientes con la web publicada (proyecto terminado o con la web en su ficha).'}
          </p>
        </div>
        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setTodos((t) => !t)}>
          {todos ? 'Solo con web publicada' : 'Ver todos'}
        </button>
      </div>

      {!conf.url ? (
        <p className="a-empty">
          Primero pega vuestro enlace de reseñas en{' '}
          <button className="a-link" onClick={() => go('ajustes')}>Ajustes → Reseñas en Google</button>.
        </p>
      ) : lista.length === 0 ? (
        <p className="a-empty-sm">Nadie en esta lista todavía.</p>
      ) : (
        <ul className="a-list">
          {lista.map((c) => {
            const estado = estadoResena(c)
            const web = (c.proyectos || []).find((p) => p.dominio || p.web_url)
            return (
              <li key={c.id} className="a-row a-resena-fila">
                <button className="a-resena-quien" onClick={() => go('cliente', { clienteId: c.id })}>
                  <strong>{c.empresa || c.nombre}</strong>
                  <span className="a-muted a-small">
                    {[c.empresa ? c.nombre : null, web?.dominio || web?.web_url?.replace(/^https?:\/\//, '')].filter(Boolean).join(' · ') || '—'}
                  </span>
                </button>
                <span className={`a-badge ${estado.tono === 'ok' ? 'a-badge-ok' : estado.tono === 'warn' ? 'a-badge-warn' : estado.tono === 'date' ? 'a-badge-date' : ''}`}>
                  {estado.texto}
                </span>
                <Acciones cliente={c} conf={conf} onCambio={cambiar} compacto />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
