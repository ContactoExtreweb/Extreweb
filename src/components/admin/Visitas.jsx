// src/components/admin/Visitas.jsx — analítica propia (tabla `visitas`)
// Los datos los mete netlify/functions/visita.mjs con cada página vista.
// Aquí solo se leen y se agrupan; el volumen es bajo, así que se traen las
// filas del periodo y se suman en el navegador (sin vistas ni funciones SQL).
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'

const PERIODOS = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
]
const TOPE = 20000 // por si algún día hay mucho tráfico: no traer media base

const claveDia = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const diaCorto = (d) => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
const diaLargo = (d) => d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

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

  const visitantes = new Set()
  for (const f of filas) {
    const hueco = huecos.get(claveDia(new Date(f.creado)))
    if (hueco) hueco.vistas++
    visitantes.add(f.visitante)
  }

  const movil = filas.filter((f) => f.movil).length
  return {
    porDia: [...huecos.values()],
    vistas: filas.length,
    visitantes: visitantes.size,
    media: Math.round((filas.length / dias) * 10) / 10,
    movil: filas.length ? Math.round((movil / filas.length) * 100) : 0,
    rutas: top(filas, (f) => f.ruta, 8),
    referentes: top(filas, (f) => f.referente || 'Directo (sin origen)', 6),
    lugares: top(filas, (f) => f.ciudad || f.pais, 6),
  }
}

export default function Visitas() {
  const [dias, setDias] = useState(30)
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let vivo = true
    setCargando(true)
    const desde = new Date()
    desde.setHours(0, 0, 0, 0)
    desde.setDate(desde.getDate() - (dias - 1))
    supabase
      .from('visitas')
      .select('creado, ruta, referente, pais, ciudad, movil, visitante')
      .gte('creado', desde.toISOString())
      .order('creado', { ascending: false })
      .limit(TOPE)
      .then(({ data, error }) => {
        if (!vivo) return
        if (error) setError('No se han podido cargar las visitas.')
        else setError('')
        setFilas(data || [])
        setCargando(false)
      })
    return () => {
      vivo = false
    }
  }, [dias])

  const datos = useMemo(() => agrupar(filas, dias), [filas, dias])

  return (
    <div>
      <div className="a-topbar">
        <h1 className="a-h1">Visitas</h1>
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
      </div>

      {error && <p className="a-error">{error}</p>}

      {cargando ? (
        <p className="a-muted">Cargando…</p>
      ) : datos.vistas === 0 ? (
        <div className="a-card">
          <p className="a-empty">
            Todavía no hay visitas en este periodo. Solo se cuentan las de <strong>extreweb.es</strong>:
            ni las de tu ordenador en local, ni las del propio panel.
          </p>
        </div>
      ) : (
        <>
          {/* ---------- RESUMEN ---------- */}
          <div className="a-vis-stats">
            <div className="a-money-box">
              <span className="a-stat-label">Páginas vistas</span>
              <strong>{datos.vistas}</strong>
            </div>
            <div className="a-money-box">
              <span className="a-stat-label">Visitantes</span>
              <strong>{datos.visitantes}</strong>
            </div>
            <div className="a-money-box">
              <span className="a-stat-label">Media al día</span>
              <strong>{datos.media}</strong>
            </div>
            <div className="a-money-box">
              <span className="a-stat-label">Desde el móvil</span>
              <strong>{datos.movil} %</strong>
            </div>
          </div>

          {/* ---------- POR DÍA ---------- */}
          <div className="a-card">
            <div className="a-card-head">
              <h2 className="a-h2">Páginas vistas por día</h2>
            </div>
            <GraficoDias porDia={datos.porDia} />
            <p className="a-small a-muted">
              «Visitantes» se calcula con una huella anónima que cambia cada día: quien vuelve mañana
              vuelve a contar.
            </p>
          </div>

          {/* ---------- DETALLE ---------- */}
          <div className="a-home-grid">
            <Lista titulo="Páginas más vistas" filas={datos.rutas} total={datos.vistas} />
            <Lista titulo="De dónde llegan" filas={datos.referentes} total={datos.vistas} />
          </div>
          <Lista titulo="Desde dónde nos ven" filas={datos.lugares} total={datos.vistas} />
        </>
      )}
    </div>
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
export function Lista({ titulo, filas, total }) {
  return (
    <div className="a-card">
      <div className="a-card-head">
        <h2 className="a-h2">{titulo}</h2>
      </div>
      {filas.length === 0 ? (
        <p className="a-empty-sm">Sin datos todavía.</p>
      ) : (
        <ul className="a-vis-lista">
          {filas.map((f) => (
            <li className="a-vis-fila" key={f.etiqueta} style={{ '--p': `${(f.total / total) * 100}%` }}>
              <span className="a-vis-fila-txt">{f.etiqueta}</span>
              <span className="a-vis-fila-num">{f.total}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
