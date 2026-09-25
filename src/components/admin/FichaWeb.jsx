// src/components/admin/FichaWeb.jsx — pestaña "Web" del proyecto
// 1) Ficha técnica: dónde está el dominio, cuándo caduca, dónde se aloja…
//    (la caducidad del dominio sale en Pendientes 30 días antes).
//    Las CONTRASEÑAS no van aquí: van en un gestor de contraseñas.
// 2) Checklist de lanzamiento: lo que hay que comprobar antes de entregar.
//    La lista está en el código (se puede ampliar); en la base solo se guarda qué está hecho.
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { fechaCorta, plazo, diasHasta } from './helpers.js'

export const CHECKLIST = [
  { clave: 'dominio', texto: 'Dominio conectado, con HTTPS, con y sin www' },
  { clave: 'canonical', texto: 'Canonical y og:url con el dominio real (site en astro.config, nada de localhost)' },
  { clave: 'titulos', texto: 'Título y descripción propios en cada página' },
  { clave: 'og', texto: 'Favicon e imagen para compartir (og:image)' },
  { clave: 'sitemap', texto: 'Sitemap y robots.txt' },
  { clave: 'search-console', texto: 'Alta en Search Console y sitemap enviado' },
  { clave: 'formulario', texto: 'Formulario probado en producción: el aviso llega' },
  { clave: 'legal', texto: 'Aviso legal, privacidad y cookies con los datos del cliente' },
  { clave: 'movil', texto: 'Revisada en móvil de verdad (iPhone y Android)' },
  { clave: 'velocidad', texto: 'Velocidad comprobada en móvil (PageSpeed)' },
  { clave: 'analitica', texto: 'Contador de visitas instalado (Ajustes → Webs medidas)' },
  { clave: 'google-business', texto: 'Ficha de Google del cliente enlazando a la web' },
  { clave: 'redirecciones', texto: 'Redirecciones desde la web antigua (si la había)' },
  { clave: 'enlace-extreweb', texto: 'Enlace «Web hecha por extreweb» en el pie' },
  { clave: 'accesos', texto: 'Accesos entregados al cliente y guardados en el gestor de contraseñas' },
]

const CAMPOS = [
  { k: 'web_url', label: 'Web publicada', placeholder: 'https://guadicar.es' },
  { k: 'dominio', label: 'Dominio', placeholder: 'guadicar.es' },
  { k: 'registrador', label: 'Dónde está registrado', placeholder: 'IONOS, DonDominio…' },
  { k: 'dominio_caduca', label: 'Caduca el', tipo: 'date' },
  { k: 'alojamiento', label: 'Alojamiento', placeholder: 'Netlify (cuenta de extreweb)' },
  { k: 'repositorio', label: 'Repositorio', placeholder: 'https://github.com/…' },
]

const enlace = (v) => (/^https?:\/\//.test(v || '') ? v : null)

export default function FichaWeb({ proyecto, onGuardado }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({})
  const [hechos, setHechos] = useState(new Set())
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('checklist')
      .select('clave')
      .eq('proyecto_id', proyecto.id)
      .then(({ data, error }) => {
        if (error) setError('Para la checklist falta ejecutar supabase/panel-ampliacion.sql.')
        setHechos(new Set((data || []).map((x) => x.clave)))
      })
  }, [proyecto.id])

  function abrirEdicion() {
    const f = {}
    for (const c of [...CAMPOS, { k: 'notas_tecnicas' }]) f[c.k] = proyecto[c.k] || ''
    setForm(f)
    setEditando(true)
  }

  async function guardar(e) {
    e.preventDefault()
    const fila = {}
    for (const [k, v] of Object.entries(form)) fila[k] = String(v).trim() || null
    const { error } = await supabase.from('proyectos').update(fila).eq('id', proyecto.id)
    if (error) return setError('No se ha podido guardar la ficha. ¿Está ejecutado panel-ampliacion.sql?')
    setError('')
    setEditando(false)
    onGuardado(fila)
  }

  async function marcar(clave) {
    const on = !hechos.has(clave)
    setHechos((s) => {
      const n = new Set(s)
      on ? n.add(clave) : n.delete(clave)
      return n
    })
    const { error } = on
      ? await supabase.from('checklist').insert({ proyecto_id: proyecto.id, clave })
      : await supabase.from('checklist').delete().eq('proyecto_id', proyecto.id).eq('clave', clave)
    if (error) setError('No se ha podido guardar la checklist.')
  }

  const hechosN = CHECKLIST.filter((c) => hechos.has(c.clave)).length
  const pct = Math.round((hechosN / CHECKLIST.length) * 100)
  const caduca = proyecto.dominio_caduca ? diasHasta(proyecto.dominio_caduca) : null

  return (
    <>
      {error && <p className="a-error">{error}</p>}

      {/* ---------- FICHA TÉCNICA ---------- */}
      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Ficha técnica</h2>
          {!editando && (
            <button className="a-btn a-btn-ghost a-btn-sm" onClick={abrirEdicion}>
              Editar
            </button>
          )}
        </div>

        {editando ? (
          <form className="a-form" onSubmit={guardar}>
            <div className="a-grid2">
              {CAMPOS.map((c) => (
                <div className="a-field" key={c.k}>
                  <label className="a-label" htmlFor={`ficha-${c.k}`}>{c.label}</label>
                  <input
                    id={`ficha-${c.k}`}
                    className="a-input"
                    type={c.tipo || 'text'}
                    value={form[c.k]}
                    onChange={(e) => setForm({ ...form, [c.k]: e.target.value })}
                    placeholder={c.placeholder}
                  />
                </div>
              ))}
            </div>
            <div className="a-field">
              <label className="a-label" htmlFor="ficha-notas">Notas técnicas</label>
              <textarea
                id="ficha-notas"
                className="a-input"
                rows="3"
                value={form.notas_tecnicas}
                onChange={(e) => setForm({ ...form, notas_tecnicas: e.target.value })}
                placeholder="DNS, correo del cliente, integraciones… (sin contraseñas)"
              />
            </div>
            <p className="a-small a-muted">
              Las contraseñas no se guardan aquí: van en un gestor de contraseñas (Bitwarden, 1Password…).
            </p>
            <div className="a-form-actions a-form-actions-2">
              <button type="button" className="a-btn a-btn-ghost" onClick={() => setEditando(false)}>Cancelar</button>
              <button type="submit" className="a-btn a-btn-accent">Guardar ficha</button>
            </div>
          </form>
        ) : (
          <>
            <div className="a-ficha">
              {CAMPOS.map((c) => {
                const v = proyecto[c.k]
                let contenido = v || '—'
                if (v && c.k === 'dominio_caduca') {
                  contenido = (
                    <>
                      {fechaCorta(v)}{' '}
                      <span className={`a-badge ${caduca < 0 ? 'a-badge-mal' : caduca <= 30 ? 'a-badge-warn' : 'a-badge-date'}`}>
                        {plazo(v)}
                      </span>
                    </>
                  )
                } else if (enlace(v)) {
                  contenido = (
                    <a href={v} target="_blank" rel="noopener noreferrer" className="a-link">
                      {v.replace(/^https?:\/\//, '')} ↗
                    </a>
                  )
                }
                return (
                  <div key={c.k}>
                    <span className="a-label">{c.label}</span>
                    <p>{contenido}</p>
                  </div>
                )
              })}
            </div>
            {proyecto.notas_tecnicas && (
              <div className="a-info-notes">
                <span className="a-label">Notas técnicas</span>
                <p>{proyecto.notas_tecnicas}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------- CHECKLIST ---------- */}
      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Checklist de lanzamiento</h2>
          <span className={`a-badge ${hechosN === CHECKLIST.length ? 'a-badge-ok' : 'a-badge-date'}`}>
            {hechosN} de {CHECKLIST.length}
          </span>
        </div>
        <div className="a-progress" aria-hidden="true">
          <div className="a-progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <ul className="a-checklist">
          {CHECKLIST.map((c) => {
            const on = hechos.has(c.clave)
            return (
              <li key={c.clave}>
                <button className={`a-checklist-item ${on ? 'is-on' : ''}`} onClick={() => marcar(c.clave)} aria-pressed={on}>
                  <span className={`a-check ${on ? 'is-on' : ''}`} aria-hidden="true">{on ? '✓' : ''}</span>
                  <span>{c.texto}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}
