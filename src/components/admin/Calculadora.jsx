// src/components/admin/Calculadora.jsx — calculadora de IVA (y retención de IRPF)
// Herramienta interna: se escriben varios importes y salen base, IVA y total.
// CADA LÍNEA GUARDA SU MODO (añadir o quitar el IVA): así se pueden mezclar
// ventas y compras en la misma lista sin que unas cambien a las otras.
// No toca Supabase: los ajustes y las líneas se guardan en este navegador.
import { useEffect, useRef, useState } from 'react'
import { euro } from './helpers.js'

const CLAVE = 'ew-calc-iva'
const TIPOS_IVA = [21, 10, 4, 0]
const TIPOS_IRPF = [15, 7]

// "1.234,56 €" → 1234.56. Acepta coma o punto; manda el último separador
export function aNumero(txt) {
  let s = String(txt ?? '').replace(/[^\d.,-]/g, '')
  const coma = s.lastIndexOf(',')
  const punto = s.lastIndexOf('.')
  if (coma > -1 && punto > -1) {
    s = coma > punto ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  } else if (coma > -1) {
    s = s.replace(',', '.')
  }
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

// A céntimos: se redondea cada línea, así la suma cuadra con lo que se ve
const cent = (n) => Math.round(n * 100) / 100

// modo 'anadir': el importe escrito es la base · 'quitar': ya lleva el IVA dentro
export function calcular(importe, modo, iva) {
  const v = aNumero(importe)
  const base = modo === 'quitar' ? cent(v / (1 + iva / 100)) : cent(v)
  const cuota = modo === 'quitar' ? cent(v - base) : cent((base * iva) / 100)
  return { base, cuota, total: cent(base + cuota) }
}

const esQuitar = (m) => (m === 'quitar' ? 'quitar' : 'anadir')
const lineaNueva = (modo) => ({ id: crypto.randomUUID(), concepto: '', importe: '', modo: esQuitar(modo) })

function guardado() {
  try {
    const raw = localStorage.getItem(CLAVE)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return null
}

export default function Calculadora() {
  const previo = guardado()
  // Antes el modo era uno para toda la lista: las líneas viejas heredan aquel
  const modoPrevio = esQuitar(previo?.modo)
  const [modoNuevas, setModoNuevas] = useState(modoPrevio)
  // Los tipos se guardan como texto para poder borrarlos y reescribirlos a gusto
  const [ivaTxt, setIvaTxt] = useState(previo?.ivaTxt ?? '21')
  const [conIrpf, setConIrpf] = useState(!!previo?.conIrpf)
  const [irpfTxt, setIrpfTxt] = useState(previo?.irpfTxt ?? '15')
  const [lineas, setLineas] = useState(
    previo?.lineas?.length
      ? previo.lineas.map((l) => ({ ...l, modo: esQuitar(l.modo ?? modoPrevio) }))
      : [lineaNueva(modoPrevio)]
  )
  const [copia, setCopia] = useState('') // '' | 'ok' | 'error'

  const tipo = (txt) => Math.min(100, Math.max(0, aNumero(txt)))
  const iva = tipo(ivaTxt)
  const irpf = tipo(irpfTxt)

  const importes = useRef(new Map()) // id → <input> del importe, para enfocar el nuevo
  const aEnfocar = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ modo: modoNuevas, ivaTxt, conIrpf, irpfTxt, lineas }))
    } catch (e) {}
  }, [modoNuevas, ivaTxt, conIrpf, irpfTxt, lineas])

  useEffect(() => {
    if (!aEnfocar.current) return
    importes.current.get(aEnfocar.current)?.focus()
    aEnfocar.current = null
  }, [lineas])

  function editar(id, campo, valor) {
    setLineas((list) => list.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)))
  }

  // El interruptor de arriba solo manda en las líneas NUEVAS y en las que aún
  // están vacías. Una línea ya escrita no cambia nunca sola
  function cambiarModoNuevas(modo) {
    setModoNuevas(modo)
    setLineas((list) => list.map((l) => (l.importe.trim() ? l : { ...l, modo })))
  }

  function anadir() {
    const l = lineaNueva(modoNuevas)
    aEnfocar.current = l.id
    setLineas((list) => [...list, l])
  }

  function borrar(id) {
    setLineas((list) => (list.length === 1 ? [lineaNueva(modoNuevas)] : list.filter((l) => l.id !== id)))
  }

  function vaciar() {
    setLineas([lineaNueva(modoNuevas)])
  }

  // Enter en el importe: salta a la siguiente línea (y la crea si es la última)
  function alPulsar(e, i) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const siguiente = lineas[i + 1]
    if (siguiente) importes.current.get(siguiente.id)?.focus()
    else anadir()
  }

  const calculadas = lineas.map((l) => ({ ...l, ...calcular(l.importe, l.modo, iva), vacia: !l.importe.trim() }))

  // Un bloque de totales por tipo: lo que lleva IVA añadido (ventas) y lo que ya
  // lo llevaba dentro (compras). Si solo hay de un tipo, solo se ve ese bloque
  const grupo = (modo) => {
    const ls = calculadas.filter((l) => l.modo === modo && !l.vacia)
    const base = cent(ls.reduce((s, l) => s + l.base, 0))
    const cuota = cent(ls.reduce((s, l) => s + l.cuota, 0))
    const retencion = conIrpf ? cent((base * irpf) / 100) : 0
    return { modo, n: ls.length, base, cuota, retencion, total: cent(base + cuota - retencion) }
  }
  const ventas = grupo('anadir')
  const compras = grupo('quitar')
  const mixto = ventas.n > 0 && compras.n > 0
  const diferencia = cent(ventas.cuota - compras.cuota)
  const hayNumeros = ventas.n + compras.n > 0

  async function copiar() {
    const cab = `Calculadora de IVA · IVA ${iva} %${conIrpf ? ` · IRPF ${irpf} %` : ''}`
    const filas = calculadas
      .filter((l) => !l.vacia)
      .map(
        (l) =>
          `${l.modo === 'quitar' ? '−IVA' : '+IVA'} ${l.concepto.trim() || 'Sin concepto'}: base ${euro(l.base)} · IVA ${euro(l.cuota)} · total ${euro(l.total)}`
      )
    const resumen = (g, nombre) =>
      g.n === 0
        ? null
        : [
            `${nombre}: base ${euro(g.base)}`,
            `IVA ${euro(g.cuota)}`,
            conIrpf ? `IRPF −${euro(g.retencion)}` : null,
            `TOTAL ${euro(g.total)}`,
          ]
            .filter(Boolean)
            .join(' · ')
    const pie = [
      resumen(ventas, mixto ? 'Ventas (IVA añadido)' : 'Total'),
      resumen(compras, mixto ? 'Compras (IVA incluido)' : 'Total'),
      mixto ? `Diferencia de IVA: ${euro(diferencia)}` : null,
    ].filter(Boolean)

    try {
      await navigator.clipboard.writeText([cab, ...filas, ...pie].join('\n'))
      setCopia('ok')
    } catch (e) {
      setCopia('error') // el navegador puede bloquear el portapapeles
    }
    setTimeout(() => setCopia(''), 2500)
  }

  const Totales = ({ g, titulo }) => (
    <div className="a-calc-bloque">
      {titulo && <h3 className="a-calc-bloque-tit">{titulo}</h3>}
      <div className="a-calc-totales">
        <div className="a-money-box">
          <span className="a-stat-label">Base imponible</span>
          <strong>{euro(g.base)}</strong>
        </div>
        <div className="a-money-box">
          <span className="a-stat-label">IVA ({iva} %)</span>
          <strong>{euro(g.cuota)}</strong>
        </div>
        {conIrpf && (
          <div className="a-money-box">
            <span className="a-stat-label">IRPF ({irpf} %)</span>
            <strong className="a-warn">−{euro(g.retencion)}</strong>
          </div>
        )}
        <div className="a-money-box a-calc-total">
          <span className="a-stat-label">
            {g.modo === 'quitar' ? 'Total pagado' : conIrpf ? 'Total a cobrar' : 'Total con IVA'}
          </span>
          <strong>{euro(g.total)}</strong>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      <div className="a-topbar">
        <h1 className="a-h1">Calculadora de IVA</h1>
        <div className="a-topbar-actions">
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={vaciar} disabled={!hayNumeros}>
            Vaciar
          </button>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={copiar} disabled={!hayNumeros}>
            {copia === 'ok' ? '¡Copiado!' : copia === 'error' ? 'No se ha podido copiar' : 'Copiar resumen'}
          </button>
        </div>
      </div>

      {/* ---------- AJUSTES ---------- */}
      <div className="a-card a-calc-ctrl">
        <div className="a-calc-row">
          <span className="a-label" id="a-calc-modo">Las líneas nuevas…</span>
          <div className="a-cal-switch" role="group" aria-labelledby="a-calc-modo">
            <button
              className={`a-switch-btn ${modoNuevas === 'anadir' ? 'is-on' : ''}`}
              onClick={() => cambiarModoNuevas('anadir')}
              aria-pressed={modoNuevas === 'anadir'}
            >
              No llevan IVA (añadir)
            </button>
            <button
              className={`a-switch-btn ${modoNuevas === 'quitar' ? 'is-on' : ''}`}
              onClick={() => cambiarModoNuevas('quitar')}
              aria-pressed={modoNuevas === 'quitar'}
            >
              Ya lo llevan (quitar)
            </button>
          </div>
          <span className="a-small a-muted a-calc-nota">
            Las líneas ya escritas no cambian: cada una guarda su +IVA o −IVA.
          </span>
        </div>

        <div className="a-calc-row">
          <span className="a-label" id="a-calc-iva">Tipo de IVA</span>
          <div className="a-chips" role="group" aria-labelledby="a-calc-iva">
            {TIPOS_IVA.map((t) => (
              <button key={t} className={`a-chip ${iva === t ? 'is-on' : ''}`} onClick={() => setIvaTxt(String(t))} aria-pressed={iva === t}>
                {t} %
              </button>
            ))}
          </div>
          <label className="a-calc-pct">
            <input
              className="a-input a-input-num"
              inputMode="decimal"
              value={ivaTxt}
              onChange={(e) => setIvaTxt(e.target.value)}
              aria-label="Otro tipo de IVA en porcentaje"
            />
            <span aria-hidden="true">%</span>
          </label>
        </div>

        <div className="a-calc-row">
          <label className="a-check-label">
            <input type="checkbox" checked={conIrpf} onChange={(e) => setConIrpf(e.target.checked)} />
            Restar retención de IRPF
          </label>
          {conIrpf && (
            <>
              <div className="a-chips" role="group" aria-label="Tipo de IRPF">
                {TIPOS_IRPF.map((t) => (
                  <button key={t} className={`a-chip ${irpf === t ? 'is-on' : ''}`} onClick={() => setIrpfTxt(String(t))} aria-pressed={irpf === t}>
                    {t} %
                  </button>
                ))}
              </div>
              <label className="a-calc-pct">
                <input
                  className="a-input a-input-num"
                  inputMode="decimal"
                  value={irpfTxt}
                  onChange={(e) => setIrpfTxt(e.target.value)}
                  aria-label="Otro tipo de IRPF en porcentaje"
                />
                <span aria-hidden="true">%</span>
              </label>
            </>
          )}
        </div>
      </div>

      {/* ---------- LÍNEAS ---------- */}
      <div className="a-card">
        <div className="a-card-head">
          <h2 className="a-h2">Importes</h2>
          <button className="a-btn a-btn-ghost a-btn-sm" onClick={anadir}>+ Añadir línea</button>
        </div>

        <ul className="a-calc-lines">
          {calculadas.map((l, i) => (
            <li key={l.id} className="a-calc-line">
              <input
                className="a-input a-calc-concepto"
                value={l.concepto}
                onChange={(e) => editar(l.id, 'concepto', e.target.value)}
                placeholder="Concepto (opcional)"
                aria-label={`Concepto de la línea ${i + 1}`}
                maxLength={80}
              />

              {/* Modo de ESTA línea: se queda como se registró */}
              <div className="a-calc-modo" role="group" aria-label={`Qué hacer con el IVA en la línea ${i + 1}`}>
                <button
                  className={`a-calc-modo-btn ${l.modo === 'anadir' ? 'is-on' : ''}`}
                  onClick={() => editar(l.id, 'modo', 'anadir')}
                  aria-pressed={l.modo === 'anadir'}
                  title="El importe no lleva IVA: añadírselo"
                >
                  +IVA
                </button>
                <button
                  className={`a-calc-modo-btn ${l.modo === 'quitar' ? 'is-on' : ''}`}
                  onClick={() => editar(l.id, 'modo', 'quitar')}
                  aria-pressed={l.modo === 'quitar'}
                  title="El importe ya lleva IVA: quitárselo"
                >
                  −IVA
                </button>
              </div>

              <input
                className="a-input a-input-num a-calc-imp"
                ref={(el) => {
                  if (el) importes.current.set(l.id, el)
                  else importes.current.delete(l.id)
                }}
                value={l.importe}
                onChange={(e) => editar(l.id, 'importe', e.target.value)}
                onKeyDown={(e) => alPulsar(e, i)}
                inputMode="decimal"
                placeholder={l.modo === 'quitar' ? 'Con IVA' : 'Sin IVA'}
                aria-label={`Importe de la línea ${i + 1}`}
              />
              <div className="a-calc-res">
                {l.vacia ? (
                  <span className="a-muted a-small">Escribe un importe…</span>
                ) : (
                  <>
                    <span className={l.modo === 'quitar' ? 'a-calc-dato is-fuerte' : 'a-calc-dato'}>
                      <em>Base</em> {euro(l.base)}
                    </span>
                    <span className="a-calc-dato">
                      <em>IVA</em> {euro(l.cuota)}
                    </span>
                    <span className={l.modo === 'anadir' ? 'a-calc-dato is-fuerte' : 'a-calc-dato'}>
                      <em>Total</em> {euro(l.total)}
                    </span>
                  </>
                )}
              </div>
              <button className="a-icon-btn" onClick={() => borrar(l.id)} aria-label={`Borrar línea ${i + 1}`}>
                ×
              </button>
            </li>
          ))}
        </ul>

        <p className="a-small a-muted a-calc-tip">
          Pulsa Intro en el importe para saltar a la siguiente línea.
        </p>
      </div>

      {/* ---------- TOTALES ---------- */}
      <div className="a-card">
        <h2 className="a-h2">Total</h2>
        {mixto ? (
          <>
            <Totales g={ventas} titulo="Ventas · IVA añadido" />
            <Totales g={compras} titulo="Compras · IVA ya incluido" />
            <p className="a-calc-dif">
              <span>Diferencia de IVA (repercutido − soportado)</span>
              <strong className={diferencia >= 0 ? 'a-warn' : 'a-ok'}>
                {euro(Math.abs(diferencia))} {diferencia >= 0 ? 'a pagar' : 'a tu favor'}
              </strong>
            </p>
            <p className="a-small a-muted">Orientativo: es la resta de estas líneas, no el modelo 303.</p>
          </>
        ) : (
          <Totales g={compras.n > 0 ? compras : ventas} />
        )}
      </div>
    </div>
  )
}
