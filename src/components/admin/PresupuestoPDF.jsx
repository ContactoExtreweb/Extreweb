// src/components/admin/PresupuestoPDF.jsx — el presupuesto listo para enviar
// Se abre dentro de <Imprimible> y se guarda como PDF desde el navegador.
// Es un PRESUPUESTO, no una factura: las facturas tienen que salir de un
// programa que cumpla la normativa de facturación (ver CONTEXTO §11).
// Los datos de la empresa salen de Ajustes → Datos de la empresa (tabla `ajustes`).
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import { euro } from './helpers.js'
import { calcular } from './Calculadora.jsx'

export const CLAVES_EMPRESA = [
  'empresa_nombre',
  'empresa_nif',
  'empresa_direccion',
  'empresa_email',
  'empresa_telefono',
  'empresa_web',
  'empresa_pie',
]

export async function leerEmpresa() {
  const { data } = await supabase.from('ajustes').select('clave, valor').in('clave', CLAVES_EMPRESA)
  const e = {}
  for (const f of data || []) e[f.clave.replace('empresa_', '')] = f.valor
  return e
}

// Número legible: P-2026-0012 (o el principio del uuid si los id no son números)
export function numeroPresupuesto(pres) {
  const ano = new Date(pres.created_at || Date.now()).getFullYear()
  const id = typeof pres.id === 'number' || /^\d+$/.test(String(pres.id)) ? String(pres.id).padStart(4, '0') : String(pres.id).slice(0, 8).toUpperCase()
  return `P-${ano}-${id}`
}

// Base, IVA y total de un presupuesto (cada partida se redondea a céntimos, como en la calculadora)
export function totalesPresupuesto(pres) {
  const modo = pres.con_iva ? 'quitar' : 'anadir'
  const iva = Number(pres.iva ?? 21)
  let base = 0
  let cuota = 0
  for (const p of pres.partidas || []) {
    const r = calcular(String(p.importe ?? 0), modo, iva)
    base += r.base
    cuota += r.cuota
  }
  base = Math.round(base * 100) / 100
  cuota = Math.round(cuota * 100) / 100
  return { base, cuota, total: Math.round((base + cuota) * 100) / 100, iva }
}

const fechaLarga = (d) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })

export default function PresupuestoPDF({ pres, proyecto, cliente }) {
  const [empresa, setEmpresa] = useState(null)

  useEffect(() => {
    leerEmpresa().then(setEmpresa)
  }, [])

  if (!empresa) return <p className="a-muted">Preparando el presupuesto…</p>

  const t = totalesPresupuesto(pres)
  const hoy = new Date()
  const validez = new Date(hoy.getTime() + 30 * 864e5)
  const faltan = !empresa.nombre || !empresa.nif
  const modo = pres.con_iva ? 'quitar' : 'anadir'

  return (
    <article className="a-doc">
      {faltan && (
        <p className="a-error a-no-print">
          Faltan los datos de la empresa (nombre y NIF): complétalos en Ajustes → Datos de la empresa antes de enviarlo.
        </p>
      )}

      <header className="a-doc-head">
        <div>
          <p className="a-doc-marca">{empresa.nombre || 'extreweb'}</p>
          <p className="a-doc-datos">
            {empresa.nif && <>NIF {empresa.nif}<br /></>}
            {empresa.direccion && <>{empresa.direccion}<br /></>}
            {[empresa.email, empresa.telefono, empresa.web].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="a-doc-titulo">
          <h1>Presupuesto</h1>
          <p>
            <strong>{numeroPresupuesto(pres)}</strong>
            <br />
            Fecha: {fechaLarga(hoy)}
            <br />
            Válido hasta: {fechaLarga(validez)}
          </p>
        </div>
      </header>

      <section className="a-doc-cliente">
        <span className="a-doc-label">Para</span>
        <p>
          <strong>{cliente?.empresa || cliente?.nombre || '—'}</strong>
          {cliente?.empresa && cliente?.nombre && <><br />{cliente.nombre}</>}
          {cliente?.email && <><br />{cliente.email}</>}
          {cliente?.telefono && <><br />{cliente.telefono}</>}
        </p>
        <span className="a-doc-label">Proyecto</span>
        <p>
          <strong>{proyecto?.titulo}</strong>
          {pres.titulo && pres.titulo !== 'Presupuesto' && <> · {pres.titulo}</>}
        </p>
      </section>

      <table className="a-doc-tabla">
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="a-doc-num">Importe</th>
          </tr>
        </thead>
        <tbody>
          {(pres.partidas || []).map((p) => (
            <tr key={p.id}>
              <td>{p.concepto}</td>
              <td className="a-doc-num">{euro(calcular(String(p.importe ?? 0), modo, t.iva).base)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td>Base imponible</td>
            <td className="a-doc-num">{euro(t.base)}</td>
          </tr>
          <tr>
            <td>IVA ({t.iva} %)</td>
            <td className="a-doc-num">{euro(t.cuota)}</td>
          </tr>
          <tr className="a-doc-total">
            <td>Total</td>
            <td className="a-doc-num">{euro(t.total)}</td>
          </tr>
        </tfoot>
      </table>

      <footer className="a-doc-pie">
        <p>{empresa.pie || 'Presupuesto válido durante 30 días desde su fecha. Precios en euros.'}</p>
      </footer>
    </article>
  )
}
