// src/components/admin/Archivos.jsx — pestaña "Archivos" del proyecto
// Logos, textos y fotos del cliente en Supabase Storage (carpeta privada
// `archivos`, ruta proyectos/<id>/). Se descargan con enlaces que caducan
// en un minuto. El plan gratuito de Supabase admite archivos de hasta 50 MB.
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { fechaCorta } from './helpers.js'

const BUCKET = 'archivos'
const MAX = 50 * 1024 * 1024

export const carpetaProyecto = (id) => `proyectos/${id}`

// Quita el prefijo de tiempo que se añade al subir: "1727…-logo.png" → "logo.png"
const nombreVisible = (n) => n.replace(/^\d{10,}-/, '')
// Nombre seguro para la ruta (sin acentos ni espacios raros)
const nombreSeguro = (n) =>
  n
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.\-]+/g, '-')
    .slice(-120)

const tamano = (b) =>
  b == null ? '' : b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toLocaleString('es-ES', { maximumFractionDigits: 1 })} MB`

// Borra todos los archivos de un proyecto (se usa al eliminar el proyecto)
export async function borrarArchivosProyecto(id) {
  const { data } = await supabase.storage.from(BUCKET).list(carpetaProyecto(id), { limit: 1000 })
  const rutas = (data || []).map((f) => `${carpetaProyecto(id)}/${f.name}`)
  if (rutas.length) await supabase.storage.from(BUCKET).remove(rutas)
}

export default function Archivos({ proyectoId }) {
  const [lista, setLista] = useState([])
  const [subiendo, setSubiendo] = useState('')
  const [error, setError] = useState('')
  const [encima, setEncima] = useState(false)
  const input = useRef(null)
  const carpeta = carpetaProyecto(proyectoId)

  useEffect(() => {
    cargar()
  }, [proyectoId])

  async function cargar() {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(carpeta, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } })
    if (error) setError(/bucket|not found/i.test(error.message) ? 'Falta ejecutar supabase/panel-ampliacion.sql (crea la carpeta de archivos).' : 'No se han podido cargar los archivos.')
    // Supabase devuelve un marcador vacío en carpetas nuevas: fuera
    setLista((data || []).filter((f) => f.name && f.name !== '.emptyFolderPlaceholder'))
  }

  async function subir(files) {
    const todos = [...files]
    if (!todos.length) return
    setError('')
    for (const [i, f] of todos.entries()) {
      if (f.size > MAX) {
        setError(`«${f.name}» pasa de 50 MB y no se ha subido.`)
        continue
      }
      setSubiendo(todos.length > 1 ? `Subiendo ${i + 1} de ${todos.length}…` : 'Subiendo…')
      const ruta = `${carpeta}/${Date.now()}-${nombreSeguro(f.name)}`
      const { error } = await supabase.storage.from(BUCKET).upload(ruta, f, { upsert: false, contentType: f.type || undefined })
      if (error) setError(`No se ha podido subir «${f.name}».`)
    }
    setSubiendo('')
    if (input.current) input.current.value = ''
    cargar()
  }

  async function descargar(f) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(`${carpeta}/${f.name}`, 60, { download: nombreVisible(f.name) })
    if (error) return setError('No se ha podido descargar.')
    window.location.href = data.signedUrl
  }

  async function ver(f) {
    // Se abre la pestaña antes de esperar: si no, el navegador la bloquea como ventana emergente
    const w = window.open('', '_blank')
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(`${carpeta}/${f.name}`, 60)
    if (error || !w) {
      w?.close()
      return setError('No se ha podido abrir.')
    }
    w.location.href = data.signedUrl
  }

  async function borrar(f) {
    if (!confirm(`¿Eliminar «${nombreVisible(f.name)}»? No se puede deshacer.`)) return
    const { error } = await supabase.storage.from(BUCKET).remove([`${carpeta}/${f.name}`])
    if (error) return setError('No se ha podido eliminar.')
    setLista((l) => l.filter((x) => x.name !== f.name))
  }

  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">Archivos del proyecto</h2>
      </div>

      <label
        className={`a-drop ${encima ? 'is-encima' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setEncima(true)
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={(e) => {
          e.preventDefault()
          setEncima(false)
          subir(e.dataTransfer.files)
        }}
      >
        <input ref={input} type="file" multiple onChange={(e) => subir(e.target.files)} className="a-drop-input" />
        <strong>{subiendo || 'Arrastra aquí logos, textos o fotos'}</strong>
        <span className="a-small a-muted">o pulsa para elegirlos · hasta 50 MB cada uno</span>
      </label>

      {error && <p className="a-error">{error}</p>}

      {lista.length === 0 ? (
        <p className="a-empty">Sin archivos todavía.</p>
      ) : (
        <ul className="a-list">
          {lista.map((f) => (
            <li key={f.id || f.name} className="a-row">
              <div className="a-archivo">
                <strong>{nombreVisible(f.name)}</strong>
                <span className="a-muted a-small">
                  {tamano(f.metadata?.size)}
                  {f.created_at ? ` · ${fechaCorta(f.created_at)}` : ''}
                </span>
              </div>
              <div className="a-row-right">
                <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => ver(f)}>Ver</button>
                <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => descargar(f)}>Descargar</button>
                <button className="a-icon-btn" onClick={() => borrar(f)} aria-label={`Eliminar ${nombreVisible(f.name)}`}>×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
