// src/components/admin/Ajustes.jsx — engranaje de la cabecera
// Datos de la empresa (para los presupuestos en PDF), reseñas en Google, plantillas
// de respuesta, webs de clientes que miden sus visitas y el calendario del iPhone.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { CLAVES_EMPRESA } from './PresupuestoPDF.jsx'
import CalendarioSync from './CalendarioSync.jsx'
import { leerConfigResenas, MENSAJE_DEFECTO, RECORDATORIO_DEFECTO } from './Resenas.jsx'

const falta = (error) => error && /relation|does not exist|schema cache/i.test(error.message || '')

export default function Ajustes() {
  const [sync, setSync] = useState(false)
  return (
    <div>
      <div className="a-topbar">
        <div>
          <h1 className="a-h1">Ajustes</h1>
          <p className="a-muted">Lo que se configura una vez y usa el resto del panel.</p>
        </div>
        <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setSync(true)}>Calendario en el iPhone</button>
      </div>
      <DatosEmpresa />
      <ResenasGoogle />
      <Plantillas />
      <WebsMedidas />
      {sync && <CalendarioSync onClose={() => setSync(false)} />}
    </div>
  )
}

/* ============================ DATOS DE LA EMPRESA ============================ */

const CAMPOS_EMPRESA = [
  { k: 'nombre', label: 'Nombre o razón social', placeholder: 'Nombre fiscal de la empresa' },
  { k: 'nif', label: 'NIF / CIF', placeholder: 'B12345678' },
  { k: 'direccion', label: 'Dirección', placeholder: 'Calle, número, CP, localidad' },
  { k: 'email', label: 'Email', placeholder: 'contactoextreweb@gmail.com' },
  { k: 'telefono', label: 'Teléfono', placeholder: '+34 …' },
  { k: 'web', label: 'Web', placeholder: 'extreweb.es' },
]

function DatosEmpresa() {
  const [form, setForm] = useState(null)
  const [estado, setEstado] = useState('') // '' | 'guardado' | 'error'

  useEffect(() => {
    supabase
      .from('ajustes')
      .select('clave, valor')
      .in('clave', CLAVES_EMPRESA)
      .then(({ data }) => {
        const f = {}
        for (const k of CLAVES_EMPRESA) f[k.replace('empresa_', '')] = ''
        for (const x of data || []) f[x.clave.replace('empresa_', '')] = x.valor || ''
        setForm(f)
      })
  }, [])

  async function guardar(e) {
    e.preventDefault()
    const ahora = new Date().toISOString()
    const filas = Object.entries(form).map(([k, v]) => ({ clave: `empresa_${k}`, valor: String(v).trim(), updated_at: ahora }))
    const { error } = await supabase.from('ajustes').upsert(filas, { onConflict: 'clave' })
    setEstado(error ? 'error' : 'guardado')
    if (!error) setTimeout(() => setEstado(''), 2500)
  }

  if (!form) return null

  return (
    <form className="a-card a-form" onSubmit={guardar}>
      <div className="a-card-head">
        <h2 className="a-h2">Datos de la empresa</h2>
      </div>
      <p className="a-small a-muted">
        Salen en la cabecera de los presupuestos en PDF. Pon el nombre fiscal con el que está registrada la empresa.
      </p>
      <div className="a-grid2">
        {CAMPOS_EMPRESA.map((c) => (
          <div className="a-field" key={c.k}>
            <label className="a-label" htmlFor={`emp-${c.k}`}>{c.label}</label>
            <input
              id={`emp-${c.k}`}
              className="a-input"
              value={form[c.k]}
              onChange={(e) => setForm({ ...form, [c.k]: e.target.value })}
              placeholder={c.placeholder}
            />
          </div>
        ))}
      </div>
      <div className="a-field">
        <label className="a-label" htmlFor="emp-pie">Texto al pie del presupuesto</label>
        <textarea
          id="emp-pie"
          className="a-input"
          rows="2"
          value={form.pie}
          onChange={(e) => setForm({ ...form, pie: e.target.value })}
          placeholder="Presupuesto válido durante 30 días. Forma de pago: 50 % al aceptar y 50 % a la entrega."
        />
      </div>
      {estado === 'error' && <p className="a-error">No se han podido guardar los datos.</p>}
      <div className="a-form-actions">
        <button type="submit" className="a-btn a-btn-accent">{estado === 'guardado' ? '¡Guardado!' : 'Guardar datos'}</button>
      </div>
    </form>
  )
}

/* ============================ RESEÑAS EN GOOGLE ============================ */

function ResenasGoogle() {
  const [form, setForm] = useState(null)
  const [estado, setEstado] = useState('') // '' | 'guardado' | 'error'

  useEffect(() => {
    leerConfigResenas().then((c) => setForm({ url: c.url, mensaje: c.mensaje, recordatorio: c.recordatorio }))
  }, [])

  if (!form) return null

  const url = form.url.trim()
  const valida = !url || /^https:\/\/\S+$/.test(url)

  async function guardar(e) {
    e.preventDefault()
    if (!valida) return
    const ahora = new Date().toISOString()
    const filas = [
      { clave: 'resenas_url', valor: url, updated_at: ahora },
      { clave: 'resenas_mensaje', valor: form.mensaje.trim() || MENSAJE_DEFECTO, updated_at: ahora },
      { clave: 'resenas_recordatorio', valor: form.recordatorio.trim() || RECORDATORIO_DEFECTO, updated_at: ahora },
    ]
    const { error } = await supabase.from('ajustes').upsert(filas, { onConflict: 'clave' })
    setEstado(error ? 'error' : 'guardado')
    if (!error) setTimeout(() => setEstado(''), 2500)
  }

  return (
    <form className="a-card a-form" onSubmit={guardar}>
      <div className="a-card-head">
        <h2 className="a-h2">Reseñas en Google</h2>
      </div>
      <p className="a-small a-muted">
        Para pedir a los clientes que os dejen reseña (Clientes → Reseñas en Google, y la ficha de cada cliente).
        El enlace está en vuestra ficha de Google: <strong>Pedir reseñas → Copiar enlace</strong> (algo como
        g.page/r/…/review).
      </p>
      <div className="a-field">
        <label className="a-label" htmlFor="res-url">Enlace para dejar reseña *</label>
        <div className="a-resena-url">
          <input
            id="res-url"
            className="a-input"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://g.page/r/…/review"
          />
          {url && valida && (
            <a className="a-btn a-btn-ghost a-btn-sm" href={url} target="_blank" rel="noopener noreferrer">Probar ↗</a>
          )}
        </div>
        {!valida && <span className="a-small a-warn">Tiene que empezar por https://</span>}
      </div>
      <div className="a-grid2">
        <div className="a-field">
          <label className="a-label" htmlFor="res-msg">Mensaje para pedirla</label>
          <textarea id="res-msg" className="a-input" rows="7" value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} />
          <button type="button" className="a-link a-small a-resena-defecto" onClick={() => setForm({ ...form, mensaje: MENSAJE_DEFECTO })}>
            Volver al texto de partida
          </button>
        </div>
        <div className="a-field">
          <label className="a-label" htmlFor="res-rec">Recordatorio (a la semana)</label>
          <textarea id="res-rec" className="a-input" rows="7" value={form.recordatorio} onChange={(e) => setForm({ ...form, recordatorio: e.target.value })} />
          <button type="button" className="a-link a-small a-resena-defecto" onClick={() => setForm({ ...form, recordatorio: RECORDATORIO_DEFECTO })}>
            Volver al texto de partida
          </button>
        </div>
      </div>
      <p className="a-small a-muted">
        <code>{'{nombre}'}</code> es el nombre del cliente y <code>{'{enlace}'}</code>, vuestro enlace (si no lo pones, se añade
        al final). Normas de Google: no se puede ofrecer nada a cambio, hay que pedírsela a todos los clientes por igual (no
        solo a los que sabes que están contentos) y nunca se escribe por ellos.
      </p>
      {estado === 'error' && <p className="a-error">No se ha podido guardar. ¿Está Supabase activo?</p>}
      <div className="a-form-actions">
        <button type="submit" className="a-btn a-btn-accent" disabled={!valida}>{estado === 'guardado' ? '¡Guardado!' : 'Guardar'}</button>
      </div>
    </form>
  )
}

/* ============================ PLANTILLAS ============================ */

function Plantillas() {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState(null) // null = cerrado; con id = edición
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    const { data, error } = await supabase.from('plantillas').select('*').order('created_at')
    if (falta(error)) setError('Falta ejecutar supabase/panel-ampliacion.sql.')
    setLista(data || [])
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.titulo.trim() || !form.cuerpo.trim()) return
    const fila = { titulo: form.titulo.trim(), asunto: form.asunto.trim() || null, cuerpo: form.cuerpo.trim() }
    const { error } = form.id
      ? await supabase.from('plantillas').update(fila).eq('id', form.id)
      : await supabase.from('plantillas').insert(fila)
    if (error) return setError('No se ha podido guardar la plantilla.')
    setError('')
    setForm(null)
    cargar()
  }

  async function borrar(p) {
    if (!confirm(`¿Eliminar la plantilla «${p.titulo}»?`)) return
    await supabase.from('plantillas').delete().eq('id', p.id)
    cargar()
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Plantillas de respuesta</h2>
        <button className="a-btn a-btn-accent a-btn-sm" onClick={() => setForm(form ? null : { titulo: '', asunto: '', cuerpo: '' })}>
          {form && !form.id ? 'Cancelar' : '+ Nueva'}
        </button>
      </div>
      <p className="a-small a-muted">
        Salen en Mensajes → «Con plantilla…». Escribe <code>{'{nombre}'}</code> donde quieras el nombre de quien escribió.
      </p>
      {error && <p className="a-error">{error}</p>}

      {form && (
        <form className="a-subform" onSubmit={guardar}>
          <div className="a-grid2">
            <div className="a-field">
              <label className="a-label" htmlFor="pl-titulo">Nombre *</label>
              <input id="pl-titulo" className="a-input" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ej. Primera respuesta" required />
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="pl-asunto">Asunto del correo</label>
              <input id="pl-asunto" className="a-input" value={form.asunto} onChange={(e) => setForm({ ...form, asunto: e.target.value })} placeholder="Tu consulta en extreweb" />
            </div>
          </div>
          <div className="a-field">
            <label className="a-label" htmlFor="pl-cuerpo">Texto *</label>
            <textarea id="pl-cuerpo" className="a-input" rows="6" value={form.cuerpo} onChange={(e) => setForm({ ...form, cuerpo: e.target.value })} placeholder={'Hola, {nombre}:\n\n…'} required />
          </div>
          <div className="a-form-actions a-form-actions-2">
            <button type="button" className="a-btn a-btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
            <button type="submit" className="a-btn a-btn-accent">{form.id ? 'Guardar cambios' : 'Guardar plantilla'}</button>
          </div>
        </form>
      )}

      {lista.length === 0 ? (
        <p className="a-empty-sm">Sin plantillas.</p>
      ) : (
        <ul className="a-list">
          {lista.map((p) => (
            <li key={p.id} className="a-row">
              <div className="a-plantilla">
                <strong>{p.titulo}</strong>
                <span className="a-muted a-small">{p.cuerpo.replace(/\s+/g, ' ').slice(0, 110)}…</span>
              </div>
              <div className="a-row-right">
                <button className="a-icon-btn" onClick={() => setForm({ ...p, asunto: p.asunto || '' })} aria-label={`Editar ${p.titulo}`}>✎</button>
                <button className="a-icon-btn" onClick={() => borrar(p)} aria-label={`Eliminar ${p.titulo}`}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ============================ WEBS MEDIDAS ============================ */

const SNIPPET = '<script defer src="https://extreweb.es/v.js"></script>'
const TEXTO_COOKIES =
  'Medición de visitas (sin cookies): esta web cuenta las páginas que se ven con un sistema propio, ' +
  'que no instala cookies ni guarda nada en tu dispositivo. De cada visita se registran la página, ' +
  'la web desde la que llegaste (solo el dominio), el país y la ciudad aproximados, si el dispositivo ' +
  'es móvil, cuánto tardó en cargar y un código anónimo que cambia cada día. No se guarda tu dirección IP ' +
  'ni permite reconocerte de un día para otro. Los datos se conservan un máximo de 12 meses.'

// "https://www.GuadiCar.es/contacto" → "guadicar.es"
export const limpiaDominio = (t) =>
  String(t || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[/?#].*$/, '')

function WebsMedidas() {
  const [lista, setLista] = useState([])
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({ dominio: '', cliente_id: '', nombre: '' })
  const [copiado, setCopiado] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    cargar()
    supabase
      .from('clientes')
      .select('id, nombre, empresa')
      .order('nombre')
      .then(({ data }) => setClientes(data || []))
  }, [])

  async function cargar() {
    const { data, error } = await supabase.from('sitios').select('*, cliente:clientes(nombre)').order('dominio')
    if (falta(error)) setError('Falta ejecutar supabase/panel-ampliacion.sql.')
    setLista(data || [])
  }

  async function copiar(texto, que) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(que)
      setTimeout(() => setCopiado(''), 2000)
    } catch (e) {}
  }

  const dominio = limpiaDominio(form.dominio)
  const valido = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(dominio) && dominio !== 'extreweb.es'

  async function anadir(e) {
    e.preventDefault()
    if (!valido) return
    const { error } = await supabase.from('sitios').insert({
      dominio,
      cliente_id: form.cliente_id || null,
      nombre: form.nombre.trim() || null,
    })
    if (error) return setError(/duplicate|unique/i.test(error.message) ? 'Esa web ya está dada de alta.' : 'No se ha podido añadir la web.')
    setError('')
    setForm({ dominio: '', cliente_id: '', nombre: '' })
    cargar()
  }

  async function activar(s) {
    await supabase.from('sitios').update({ activo: !s.activo }).eq('dominio', s.dominio)
    cargar()
  }

  async function borrar(s) {
    if (!confirm(`¿Dejar de medir ${s.dominio}? Las visitas ya guardadas se conservan.`)) return
    await supabase.from('sitios').delete().eq('dominio', s.dominio)
    cargar()
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Webs medidas</h2>
      </div>
      <p className="a-small a-muted">
        Webs de clientes que cuentan sus visitas con nuestro contador. Se ven en Visitas (selector de arriba) y de ahí sale
        su informe mensual. Hasta que no se da de alta aquí, el servidor ignora lo que mande esa web.
      </p>
      {error && <p className="a-error">{error}</p>}

      <form className="a-subform" onSubmit={anadir}>
        <div className="a-grid2">
          <div className="a-field">
            <label className="a-label" htmlFor="sit-dom">Dominio *</label>
            <input id="sit-dom" className="a-input" value={form.dominio} onChange={(e) => setForm({ ...form, dominio: e.target.value })} placeholder="guadicar.es" />
            {form.dominio && dominio && <span className="a-small a-muted">Se guardará como {dominio}</span>}
          </div>
          <div className="a-field">
            <label className="a-label" htmlFor="sit-cli">Cliente</label>
            <select id="sit-cli" className="a-select" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}>
              <option value="">— Sin asignar —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{c.empresa ? ` · ${c.empresa}` : ''}</option>
              ))}
            </select>
          </div>
          <div className="a-field">
            <label className="a-label" htmlFor="sit-nombre">Nombre para el informe</label>
            <input id="sit-nombre" className="a-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="GuadiCar Multimarcas" />
          </div>
        </div>
        <div className="a-form-actions">
          <button type="submit" className="a-btn a-btn-accent" disabled={!valido}>+ Dar de alta</button>
        </div>
      </form>

      {lista.length > 0 && (
        <ul className="a-list">
          {lista.map((s) => (
            <li key={s.dominio} className={`a-row ${s.activo ? '' : 'is-pausada'}`}>
              <div>
                <strong>{s.dominio}</strong>
                <span className="a-muted a-small">
                  {[s.nombre, s.cliente?.nombre].filter(Boolean).join(' · ') || 'Sin cliente'}
                  {s.activo ? '' : ' · pausada'}
                </span>
              </div>
              <div className="a-row-right">
                <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => activar(s)}>{s.activo ? 'Pausar' : 'Reactivar'}</button>
                <button className="a-icon-btn" onClick={() => borrar(s)} aria-label={`Quitar ${s.dominio}`}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="a-instalar">
        <span className="a-label">1. Pega esto antes de &lt;/body&gt; en la web del cliente</span>
        <div className="a-copiable">
          <code>{SNIPPET}</code>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => copiar(SNIPPET, 'snippet')}>{copiado === 'snippet' ? '¡Copiado!' : 'Copiar'}</button>
        </div>
        <span className="a-label">2. Añade este párrafo a su política de cookies</span>
        <div className="a-copiable">
          <p>{TEXTO_COOKIES}</p>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => copiar(TEXTO_COOKIES, 'cookies')}>{copiado === 'cookies' ? '¡Copiado!' : 'Copiar'}</button>
        </div>
        <p className="a-small a-muted">
          Como tratáis esos datos por cuenta del cliente, conviene que el contrato de mantenimiento incluya la cláusula de
          encargado del tratamiento.
        </p>
      </div>
    </div>
  )
}
