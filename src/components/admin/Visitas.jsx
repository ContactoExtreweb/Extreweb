// src/components/admin/Visitas.jsx — analítica propia (tablas `visitas` y `velocidad`)
// Los datos los mete netlify/functions/visita.mjs desde public/v.js, en
// extreweb.es y en las webs de clientes dadas de alta (Ajustes → Webs medidas).
// Aquí solo se leen y se agrupan; el volumen es bajo, así que se traen las
// filas del periodo y se suman en el navegador (sin vistas ni funciones SQL).
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { mediana, segundos } from './helpers.js'
import Imprimible from './Imprimible.jsx'

const PROPIA = 'extreweb.es'
const PERIODOS = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
]
const PESTANAS = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'paginas', label: 'Páginas' },
  { key: 'origen', label: 'Origen' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'enlaces', label: 'Enlaces' },
]
const TOPE = 20000 // por si algún día hay mucho tráfico: no traer media base

// Umbrales de Google para el LCP (lo que tarda en verse lo principal)
const LCP_BUENO = 2500
const LCP_MEJORABLE = 4000

const claveDia = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const diaCorto = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
const diaLargo = (d) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

// Inicio del periodo: medianoche de hace (dias - 1) días
function inicioPeriodo(dias) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (dias - 1))
  return d
}

// Cuenta cuántas veces aparece cada valor y devuelve los más repetidos
function top(filas, saca, n) {
  const cuenta = new Map()
  for (const f of filas) {
    const k = saca(f)
    if (!k) continue
    cuenta.set(k, (cuenta.get(k) || 0) + 1)
  }
  return [...cuenta.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([etiqueta, total]) => ({ etiqueta, total }))
}

// "+18 %", "−5 %" o null si no hay con qué comparar
function variacion(ahora, antes) {
  if (antes == null || antes === 0) return null
  const p = Math.round(((ahora - antes) / antes) * 100)
  return { texto: `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p)} %`, sube: p > 0, baja: p < 0 }
}

// Agrupa las filas del periodo. Función aparte (y exportada) para poder
// comprobarla con datos de prueba sin montar toda la pantalla.
export function agrupar(filas, dias) {
  // Un hueco por día, aunque no haya visitas: si no, el gráfico engaña
  const huecos = new Map()
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date(hoy)
    d.setDate(d.getDate() - i)
    huecos.set(claveDia(d), { fecha: d, vistas: 0 })
  }

  const buenas = filas.filter((f) => !f.es_404)
  const visitantes = new Set()
  const primera = new Map() // visitante → su primera página vista (página de entrada)
  for (const f of buenas) {
    const hueco = huecos.get(claveDia(new Date(f.creado)))
    if (hueco) hueco.vistas++
    visitantes.add(f.visitante)
    const antes = primera.get(f.visitante)
    if (!antes || f.creado < antes.creado) primera.set(f.visitante, f)
  }

  // Enlaces rotos: qué dirección se pidió y desde qué web se llegó a ella
  const rotos = new Map()
  for (const f of filas.filter((x) => x.es_404)) {
    const r = rotos.get(f.ruta) || { etiqueta: f.ruta, total: 0, desde: new Set() }
    r.total++
    if (f.referente) r.desde.add(f.referente)
    rotos.set(f.ruta, r)
  }

  const movil = buenas.filter((f) => f.movil).length
  return {
    porDia: [...huecos.values()],
    vistas: buenas.length,
    visitantes: visitantes.size,
    media: Math.round((buenas.length / dias) * 10) / 10,
    movil: buenas.length ? Math.round((movil / buenas.length) * 100) : 0,
    rutas: top(buenas, (f) => f.ruta, 8),
    entradas: top([...primera.values()], (f) => f.ruta, 8),
    referentes: top(buenas, (f) => f.referente || 'Directo (sin origen)', 6),
    lugares: top(buenas, (f) => f.ciudad || f.pais, 6),
    campanas: top(buenas, (f) => (f.campana ? `${f.campana}${f.fuente ? ` · ${f.fuente}` : ''}` : null), 8),
    rotos: [...rotos.values()]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((r) => ({ ...r, desde: [...r.desde].slice(0, 3).join(', ') })),
  }
}

// Velocidad: mediana del LCP por dispositivo y por página
export function agruparVelocidad(filas) {
  const con = filas.filter((f) => f.lcp)
  const grupo = (ls) => ({
    n: ls.length,
    lcp: mediana(ls.map((f) => f.lcp)),
    rapidas: ls.length ? Math.round((ls.filter((f) => f.lcp <= LCP_BUENO).length / ls.length) * 100) : null,
  })
  const porRuta = new Map()
  for (const f of con) porRuta.set(f.ruta, [...(porRuta.get(f.ruta) || []), f.lcp])
  return {
    movil: grupo(con.filter((f) => f.movil)),
    escritorio: grupo(con.filter((f) => !f.movil)),
    ttfb: mediana(filas.map((f) => f.ttfb).filter(Boolean)),
    paginas: [...porRuta.entries()]
      .map(([ruta, v]) => ({ ruta, n: v.length, lcp: mediana(v) }))
      .sort((a, b) => b.lcp - a.lcp)
      .slice(0, 10),
  }
}

// Supabase devuelve como mucho 1000 filas por consulta (aunque pidas más):
// se piden en tandas hasta que llega una incompleta. `consulta` crea la
// consulta de cero en cada tanda (una consulta de Supabase solo se usa una vez)
async function traerTodo(consulta) {
  const filas = []
  for (let i = 0; i < TOPE; i += 1000) {
    const { data, error } = await consulta().range(i, i + 999)
    if (error) return { data: filas, error }
    filas.push(...(data || []))
    if (!data || data.length < 1000) break
  }
  return { data: filas, error: null }
}

// ¿Falta la migración? (columna o tabla inexistente)
const faltaSQL = (error) => error && /column|relation|does not exist|schema cache/i.test(error.message || '')

export default function Visitas({ pestanaInicial, onPestana }) {
  const [sitio, setSitio] = useState(PROPIA)
  const [sitios, setSitios] = useState([])
  const [dias, setDias] = useState(30)
  const [pestana, setPestanaLocal] = useState(() =>
    PESTANAS.some((p) => p.key === pestanaInicial) ? pestanaInicial : 'resumen'
  )
  // La pestaña se apunta también en la URL (sobrevive al refresco)
  const setPestana = (p) => {
    setPestanaLocal(p)
    onPestana?.(p === 'resumen' ? undefined : p)
  }
  const [filas, setFilas] = useState([])
  const [vel, setVel] = useState([])
  const [mensajes, setMensajes] = useState([])
  const [anterior, setAnterior] = useState({ vistas: null, mensajes: null })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [informe, setInforme] = useState(false)

  const propia = sitio === PROPIA

  useEffect(() => {
    supabase
      .from('sitios')
      .select('dominio, nombre, activo')
      .order('dominio')
      .then(({ data }) => setSitios(data || []))
  }, [])

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const desde = inicioPeriodo(dias)
    const desdeAnt = new Date(desde)
    desdeAnt.setDate(desdeAnt.getDate() - dias)

    const peticiones = [
      traerTodo(() =>
        supabase
          .from('visitas')
          .select('creado, ruta, referente, pais, ciudad, movil, visitante, campana, fuente, es_404')
          .eq('sitio', sitio)
          .gte('creado', desde.toISOString())
          .order('creado', { ascending: false })
      ),
      traerTodo(() =>
        supabase
          .from('velocidad')
          .select('ruta, movil, lcp, carga, ttfb')
          .eq('sitio', sitio)
          .gte('creado', desde.toISOString())
          .order('creado', { ascending: false })
      ),
      supabase
        .from('visitas')
        .select('id', { count: 'exact', head: true })
        .eq('sitio', sitio)
        .eq('es_404', false)
        .gte('creado', desdeAnt.toISOString())
        .lt('creado', desde.toISOString()),
    ]
    // Los mensajes del formulario solo tienen sentido en nuestra web
    if (propia) {
      peticiones.push(
        supabase.from('mensajes').select('id, created_at, pagina, origen').gte('created_at', desde.toISOString()),
        supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', desdeAnt.toISOString())
          .lt('created_at', desde.toISOString())
      )
    }

    Promise.all(peticiones).then(([vis, velo, ant, msg, msgAnt]) => {
      if (!vivo) return
      const fallo = [vis, velo, ant, msg, msgAnt].find((r) => r?.error)
      if (faltaSQL(fallo?.error)) setError('Falta ejecutar supabase/panel-ampliacion.sql en Supabase (SQL Editor).')
      else if (fallo) setError('No se han podido cargar todas las visitas.')
      else setError('')
      setFilas(vis.data || [])
      setVel(velo.data || [])
      setMensajes(msg?.data || [])
      setAnterior({ vistas: ant.count ?? null, mensajes: msgAnt?.count ?? null })
      setCargando(false)
    })
    return () => {
      vivo = false
    }
  }, [dias, sitio, propia])

  const datos = useMemo(() => agrupar(filas, dias), [filas, dias])
  const velocidad = useMemo(() => agruparVelocidad(vel), [vel])
  const nombreSitio = sitios.find((s) => s.dominio === sitio)?.nombre || sitio

  return (
    <div>
      <div className="a-topbar">
        <div>
          <h1 className="a-h1">Visitas</h1>
          {sitios.length > 0 && (
            <select className="a-select a-vis-sitio" value={sitio} onChange={(e) => setSitio(e.target.value)} aria-label="Web">
              <option value={PROPIA}>extreweb.es (la nuestra)</option>
              {sitios.map((s) => (
                <option key={s.dominio} value={s.dominio}>
                  {s.dominio}
                  {s.nombre ? ` · ${s.nombre}` : ''}
                  {s.activo ? '' : ' (pausada)'}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="a-topbar-actions a-vis-acciones">
          <div className="a-chips" role="group" aria-label="Periodo">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                className={`a-chip ${dias === p.dias ? 'is-on' : ''}`}
                onClick={() => setDias(p.dias)}
                aria-pressed={dias === p.dias}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => setInforme(true)} disabled={cargando || datos.vistas === 0}>
            Informe
          </button>
        </div>
      </div>

      <div className="a-tabs" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.key}
            role="tab"
            aria-selected={pestana === p.key}
            className={`a-tab ${pestana === p.key ? 'is-on' : ''}`}
            onClick={() => setPestana(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && <p className="a-error">{error}</p>}

      {pestana === 'enlaces' ? (
        <Enlaces sitio={sitio} filas={filas} />
      ) : cargando ? (
        <p className="a-muted">Cargando…</p>
      ) : datos.vistas === 0 && datos.rotos.length === 0 ? (
        <div className="a-card">
          <p className="a-empty">
            Todavía no hay visitas de <strong>{sitio}</strong> en este periodo. Solo se cuentan las de la web publicada:
            ni las de tu ordenador en local, ni las del propio panel.
          </p>
        </div>
      ) : pestana === 'resumen' ? (
        <Resumen datos={datos} anterior={anterior} mensajes={propia ? mensajes : null} />
      ) : pestana === 'paginas' ? (
        <Paginas datos={datos} />
      ) : pestana === 'origen' ? (
        <Origen datos={datos} mensajes={propia ? mensajes : null} />
      ) : (
        <Velocidad velocidad={velocidad} />
      )}

      {informe && (
        <Imprimible titulo={`Informe de visitas · ${sitio}`} onClose={() => setInforme(false)}>
          <Informe sitio={nombreSitio} dominio={sitio} dias={dias} datos={datos} velocidad={velocidad} />
        </Imprimible>
      )}
    </div>
  )
}

/* ============================ PESTAÑAS ============================ */

function Resumen({ datos, anterior, mensajes }) {
  const dv = variacion(datos.vistas, anterior.vistas)
  const conversion = mensajes && datos.visitantes ? (mensajes.length / datos.visitantes) * 100 : null
  return (
    <>
      <div className="a-vis-stats">
        <Dato label="Páginas vistas" valor={datos.vistas} cambio={dv} />
        <Dato label="Visitantes" valor={datos.visitantes} />
        <Dato label="Media al día" valor={datos.media.toLocaleString('es-ES')} />
        <Dato label="Desde el móvil" valor={`${datos.movil} %`} />
      </div>

      {mensajes && (
        <div className="a-card a-vis-conv">
          <div>
            <span className="a-stat-label">Mensajes del formulario</span>
            <strong className="a-vis-conv-num">{mensajes.length}</strong>
            {variacion(mensajes.length, anterior.mensajes) && (
              <Cambio c={variacion(mensajes.length, anterior.mensajes)} />
            )}
          </div>
          <p className="a-vis-conv-txt">
            {mensajes.length === 0
              ? 'Nadie ha escrito todavía en este periodo.'
              : `Escribió el ${conversion.toLocaleString('es-ES', { maximumFractionDigits: 1 })} % de los visitantes: un mensaje por cada ${Math.round(datos.visitantes / mensajes.length)} visitantes.`}
          </p>
        </div>
      )}

      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Páginas vistas por día</h2>
          {dv && <span className="a-small a-muted">frente al periodo anterior: {dv.texto}</span>}
        </div>
        <GraficoDias porDia={datos.porDia} />
        <p className="a-small a-muted">
          «Visitantes» se calcula con una huella anónima que cambia cada día: quien vuelve mañana vuelve a contar.
        </p>
      </div>
    </>
  )
}

function Paginas({ datos }) {
  return (
    <>
      <div className="a-home-grid">
        <Lista titulo="Páginas más vistas" filas={datos.rutas} total={datos.vistas} />
        <Lista
          titulo="Páginas de entrada"
          ayuda="La primera página que ve cada visitante: por donde os encuentran."
          filas={datos.entradas}
          total={datos.visitantes}
        />
      </div>
      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Enlaces rotos</h2>
        </div>
        {datos.rotos.length === 0 ? (
          <p className="a-empty-sm">Ningún enlace roto en este periodo. 🎉</p>
        ) : (
          <>
            <p className="a-small a-muted a-vis-ayuda">
              Direcciones que alguien pidió y no existen. Si viene de otra web, pídeles que lo corrijan o crea una
              redirección en <code>public/_redirects</code>.
            </p>
            <ul className="a-list">
              {datos.rotos.map((r) => (
                <li key={r.etiqueta} className="a-row">
                  <div className="a-vis-roto">
                    <strong>{r.etiqueta}</strong>
                    <span className="a-muted a-small">{r.desde ? `desde ${r.desde}` : 'sin web de origen'}</span>
                  </div>
                  <span className="a-badge a-badge-warn">{r.total}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}

function Origen({ datos, mensajes }) {
  const porPagina = mensajes ? top(mensajes, (m) => m.pagina || 'Entró directo a Contacto', 6) : []
  const porOrigen = mensajes ? top(mensajes, (m) => m.origen, 6) : []
  return (
    <>
      <div className="a-home-grid">
        <Lista titulo="De dónde llegan" filas={datos.referentes} total={datos.vistas} />
        <Lista
          titulo="Campañas"
          ayuda="Visitas que llegaron por un enlace creado en la pestaña Enlaces."
          filas={datos.campanas}
          total={datos.vistas}
          vacio="Aún no hay visitas desde enlaces de campaña."
        />
      </div>
      <div className="a-home-grid">
        <Lista titulo="Desde dónde nos ven" filas={datos.lugares} total={datos.vistas} />
        {mensajes && (
          <Lista
            titulo="Qué páginas traen mensajes"
            ayuda="La página en la que estaba quien escribió justo antes de ir a Contacto."
            filas={porPagina}
            total={mensajes.length}
            vacio="Sin mensajes en este periodo."
          />
        )}
      </div>
      {mensajes && porOrigen.length > 0 && (
        <Lista titulo="Mensajes por web de origen o campaña" filas={porOrigen} total={mensajes.length} />
      )}
    </>
  )
}

function Velocidad({ velocidad }) {
  const { movil, escritorio } = velocidad
  if (!movil.n && !escritorio.n) {
    return (
      <div className="a-card">
        <p className="a-empty">
          Aún no hay medidas de velocidad. Se toman al salir de cada página, así que llegan un poco después que las
          visitas.
        </p>
      </div>
    )
  }
  return (
    <>
      <div className="a-vis-stats">
        <div className="a-money-box">
          <span className="a-stat-label">En el móvil</span>
          <strong>{segundos(movil.lcp)}</strong>
          <Semaforo ms={movil.lcp} />
        </div>
        <div className="a-money-box">
          <span className="a-stat-label">En ordenador</span>
          <strong>{segundos(escritorio.lcp)}</strong>
          <Semaforo ms={escritorio.lcp} />
        </div>
        <div className="a-money-box">
          <span className="a-stat-label">Visitas rápidas en móvil</span>
          <strong>{movil.rapidas == null ? '—' : `${movil.rapidas} %`}</strong>
          <span className="a-small a-muted">se ven en menos de 2,5 s</span>
        </div>
        <div className="a-money-box">
          <span className="a-stat-label">Respuesta del servidor</span>
          <strong>{segundos(velocidad.ttfb)}</strong>
        </div>
      </div>

      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Por página (las más lentas primero)</h2>
        </div>
        <ul className="a-list">
          {velocidad.paginas.map((p) => (
            <li key={p.ruta} className="a-row">
              <div className="a-vis-roto">
                <strong>{p.ruta}</strong>
                <span className="a-muted a-small">
                  {p.n} medida{p.n === 1 ? '' : 's'}
                </span>
              </div>
              <span className="a-vis-vel">
                {segundos(p.lcp)} <Semaforo ms={p.lcp} corto />
              </span>
            </li>
          ))}
        </ul>
        <p className="a-small a-muted a-vis-nota">
          Es lo que tarda en verse lo principal de la página en el dispositivo real de cada visitante (la mitad de las
          visitas va más rápido que esta cifra). Google lo considera bueno por debajo de 2,5 s y lento por encima de 4 s.
        </p>
      </div>
    </>
  )
}

/* ============================ ENLACES DE CAMPAÑA ============================ */

const FUENTES = [
  { key: 'instagram', label: 'Instagram', medio: 'social' },
  { key: 'whatsapp', label: 'WhatsApp', medio: 'mensaje' },
  { key: 'facebook', label: 'Facebook', medio: 'social' },
  { key: 'google-business', label: 'Ficha de Google', medio: 'local' },
  { key: 'email', label: 'Email', medio: 'email' },
  { key: 'qr', label: 'QR / papel', medio: 'qr' },
]

// "Reel GuadiCar Sept" → "reel-guadicar-sept"
const slug = (t) =>
  t
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export function urlCampana(sitio, ruta, fuente, campana) {
  const f = FUENTES.find((x) => x.key === fuente)
  const r = '/' + String(ruta || '').replace(/^\/+/, '')
  const q = new URLSearchParams({ utm_source: fuente, utm_medium: f?.medio || 'enlace', utm_campaign: slug(campana) })
  return `https://${sitio}${r}?${q}`
}

function Enlaces({ sitio, filas }) {
  const [lista, setLista] = useState([])
  const [form, setForm] = useState({ nombre: '', ruta: '/', fuente: 'instagram' })
  const [copiado, setCopiado] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('enlaces')
      .select('id, nombre, url, campana, fuente, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(faltaSQL(error) ? 'Falta ejecutar supabase/panel-ampliacion.sql.' : 'No se han podido cargar los enlaces.')
        setLista(data || [])
      })
  }, [])

  const campana = slug(form.nombre)
  const url = campana ? urlCampana(sitio, form.ruta, form.fuente, form.nombre) : ''

  // Visitas de cada campaña en el periodo elegido
  const visitas = useMemo(() => {
    const m = new Map()
    for (const f of filas) if (f.campana) m.set(f.campana, (m.get(f.campana) || 0) + 1)
    return m
  }, [filas])

  async function copiar(texto, id) {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(id)
      setTimeout(() => setCopiado(null), 2000)
    } catch (e) {}
  }

  async function guardar(e) {
    e.preventDefault()
    if (!url) return
    const { data, error } = await supabase
      .from('enlaces')
      .insert({ nombre: form.nombre.trim(), url, campana, fuente: form.fuente })
      .select()
      .single()
    if (error) return setError('No se ha podido guardar el enlace.')
    setError('')
    setLista((l) => [data, ...l])
    copiar(url, data.id)
    setForm((f) => ({ ...f, nombre: '' }))
  }

  async function borrar(id) {
    if (!confirm('¿Borrar este enlace de la lista? Las visitas que trajo se conservan.')) return
    await supabase.from('enlaces').delete().eq('id', id)
    setLista((l) => l.filter((x) => x.id !== id))
  }

  return (
    <>
      <form className="a-card a-form" onSubmit={guardar}>
        <div className="a-card-head">
          <h2 className="a-h2">Crear un enlace con seguimiento</h2>
        </div>
        <p className="a-small a-muted a-vis-ayuda">
          Úsalo en la bio de Instagram, en un estado de WhatsApp o en un QR. Las visitas que traiga aparecerán en Origen →
          Campañas, y los mensajes, con su campaña.
        </p>
        <div className="a-grid2">
          <div className="a-field">
            <label className="a-label" htmlFor="enl-nombre">Nombre de la campaña *</label>
            <input
              id="enl-nombre"
              className="a-input"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Reel GuadiCar septiembre"
              maxLength={60}
            />
          </div>
          <div className="a-field">
            <label className="a-label" htmlFor="enl-ruta">Página de {sitio}</label>
            <input
              id="enl-ruta"
              className="a-input"
              value={form.ruta}
              onChange={(e) => setForm({ ...form, ruta: e.target.value })}
              placeholder="/contacto/"
            />
          </div>
        </div>
        <div className="a-field">
          <span className="a-label">Dónde lo vas a poner</span>
          <div className="a-chips" role="group" aria-label="Dónde lo vas a poner">
            {FUENTES.map((f) => (
              <button
                type="button"
                key={f.key}
                className={`a-chip ${form.fuente === f.key ? 'is-on' : ''}`}
                aria-pressed={form.fuente === f.key}
                onClick={() => setForm({ ...form, fuente: f.key })}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {url && <code className="a-vis-url">{url}</code>}
        {error && <p className="a-error">{error}</p>}
        <div className="a-form-actions">
          <button type="submit" className="a-btn a-btn-accent" disabled={!url}>
            Guardar y copiar
          </button>
        </div>
      </form>

      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Enlaces guardados</h2>
        </div>
        {lista.length === 0 ? (
          <p className="a-empty-sm">Aún no has creado ningún enlace.</p>
        ) : (
          <ul className="a-list">
            {lista.map((e) => (
              <li key={e.id} className="a-row">
                <div className="a-vis-roto">
                  <strong>{e.nombre}</strong>
                  <span className="a-muted a-small">
                    {FUENTES.find((f) => f.key === e.fuente)?.label || e.fuente} · {visitas.get(e.campana) || 0} visitas en
                    este periodo
                  </span>
                </div>
                <div className="a-row-right">
                  <button className="a-btn a-btn-ghost a-btn-sm" onClick={() => copiar(e.url, e.id)}>
                    {copiado === e.id ? '¡Copiado!' : 'Copiar'}
                  </button>
                  <button className="a-icon-btn" onClick={() => borrar(e.id)} aria-label={`Borrar ${e.nombre}`}>
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

/* ============================ INFORME IMPRIMIBLE ============================ */

function Informe({ sitio, dominio, dias, datos, velocidad }) {
  const desde = datos.porDia[0]?.fecha
  const hasta = datos.porDia[datos.porDia.length - 1]?.fecha
  const fecha = (d) => d?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  const principal = datos.rutas[0]
  const buscador = datos.referentes.find((r) => /google|bing/.test(r.etiqueta))
  return (
    <article className="a-informe">
      <header className="a-informe-head">
        <div>
          <p className="a-informe-kicker">Informe de visitas</p>
          <h1>{sitio}</h1>
          <p className="a-muted">
            {dominio} · del {fecha(desde)} al {fecha(hasta)} ({dias} días)
          </p>
        </div>
        <span className="a-informe-marca">extreweb</span>
      </header>

      <div className="a-vis-stats">
        <Dato label="Páginas vistas" valor={datos.vistas} />
        <Dato label="Visitantes" valor={datos.visitantes} />
        <Dato label="Desde el móvil" valor={`${datos.movil} %`} />
        <Dato label="Velocidad en móvil" valor={segundos(velocidad.movil.lcp)} />
      </div>

      <section>
        <h2 className="a-h2">En pocas palabras</h2>
        <ul className="a-informe-puntos">
          <li>
            Tu web recibió <strong>{datos.vistas}</strong> visitas a páginas de <strong>{datos.visitantes}</strong>{' '}
            visitantes, una media de {datos.media.toLocaleString('es-ES')} al día.
          </li>
          {principal && (
            <li>
              La página más vista fue <strong>{principal.etiqueta}</strong> ({principal.total} visitas).
            </li>
          )}
          <li>
            El {datos.movil} % de las visitas llegó desde el móvil
            {velocidad.movil.lcp ? `, y en el móvil la web se ve en ${segundos(velocidad.movil.lcp)}` : ''}.
          </li>
          {buscador && (
            <li>
              Desde buscadores llegaron <strong>{buscador.total}</strong> visitas.
            </li>
          )}
        </ul>
      </section>

      <section>
        <h2 className="a-h2">Visitas por día</h2>
        <GraficoDias porDia={datos.porDia} />
      </section>

      <div className="a-informe-cols">
        <Lista titulo="Páginas más vistas" filas={datos.rutas.slice(0, 6)} total={datos.vistas} />
        <Lista titulo="De dónde llegan" filas={datos.referentes} total={datos.vistas} />
      </div>

      <p className="a-small a-muted">
        Medición propia y anónima, sin cookies: no se guarda ninguna IP ni se sigue a las personas entre días.
      </p>
    </article>
  )
}

/* ============================ PIEZAS ============================ */

function Dato({ label, valor, cambio }) {
  return (
    <div className="a-money-box">
      <span className="a-stat-label">{label}</span>
      <strong>{valor}</strong>
      {cambio && <Cambio c={cambio} />}
    </div>
  )
}

function Cambio({ c }) {
  return (
    <span className={`a-vis-cambio ${c.sube ? 'is-sube' : c.baja ? 'is-baja' : ''}`}>
      {c.sube ? '▲' : c.baja ? '▼' : '='} {c.texto} <span className="a-muted">vs. periodo anterior</span>
    </span>
  )
}

// Estado de velocidad: siempre con texto, nunca solo color
function Semaforo({ ms, corto = false }) {
  if (ms == null) return null
  const est = ms <= LCP_BUENO ? 'ok' : ms <= LCP_MEJORABLE ? 'warn' : 'mal'
  const txt = { ok: 'Rápida', warn: 'Mejorable', mal: 'Lenta' }[est]
  return (
    <span className={`a-sem a-sem-${est}`}>
      <i aria-hidden="true" />
      {corto ? txt : `${txt} para Google`}
    </span>
  )
}

// Barras por día. Una sola serie, así que va en el azul del panel y sin leyenda;
// solo se escribe el número del día más alto (un número en cada barra sería ruido)
export function GraficoDias({ porDia }) {
  const max = Math.max(1, ...porDia.map((d) => d.vistas))
  const iMax = porDia.findIndex((d) => d.vistas === max)

  return (
    <>
      <div className="a-vis-chart" role="img" aria-label={`Páginas vistas por día. Máximo: ${max}.`}>
        {porDia.map((d, i) => (
          <div className="a-vis-col" key={claveDia(d.fecha)}>
            {i === iMax && d.vistas > 0 && <span className="a-vis-max">{d.vistas}</span>}
            <div
              className="a-vis-bar"
              style={{ height: `${(d.vistas / max) * 100}%` }}
              tabIndex={0}
              role="button"
              aria-label={`${diaLargo(d.fecha)}: ${d.vistas} páginas vistas`}
            />
            <span className="a-vis-tip" aria-hidden="true">
              <strong>{d.vistas}</strong> · {diaCorto(d.fecha)}
            </span>
          </div>
        ))}
      </div>
      <div className="a-vis-eje">
        <span>{diaCorto(porDia[0].fecha)}</span>
        <span>hoy</span>
      </div>
    </>
  )
}

// Lista tipo ranking: la barra de fondo es la proporción sobre el total
export function Lista({ titulo, ayuda, filas, total, vacio = 'Sin datos todavía.' }) {
  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">{titulo}</h2>
      </div>
      {ayuda && <p className="a-small a-muted a-vis-ayuda">{ayuda}</p>}
      {filas.length === 0 ? (
        <p className="a-empty-sm">{vacio}</p>
      ) : (
        <ul className="a-vis-lista">
          {filas.map((f) => (
            <li className="a-vis-fila" key={f.etiqueta} style={{ '--p': `${total ? (f.total / total) * 100 : 0}%` }}>
              <span className="a-vis-fila-txt">{f.etiqueta}</span>
              <span className="a-vis-fila-num">{f.total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
