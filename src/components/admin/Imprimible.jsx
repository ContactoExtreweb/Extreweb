// src/components/admin/Imprimible.jsx — hoja para imprimir o guardar como PDF
// La usan el presupuesto y el informe de visitas. Se monta directamente en el
// <body> (portal), fuera del panel: así, al imprimir, el CSS (admin.css →
// @media print) esconde el panel entero y solo sale la hoja, sin páginas en blanco.
// Para "PDF": Imprimir → Destino: Guardar como PDF (así no hace falta librería).
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function Imprimible({ titulo, onClose, children }) {
  const [raiz] = useState(() => {
    const d = document.createElement('div')
    d.className = 'a-print-raiz'
    return d
  })
  const cerrar = useRef(onClose)
  cerrar.current = onClose

  useEffect(() => {
    document.body.appendChild(raiz)
    // El título de la pestaña es el nombre que propone el navegador para el PDF
    const antes = document.title
    document.title = titulo
    document.documentElement.classList.add('a-imprimiendo')
    const esc = (e) => e.key === 'Escape' && cerrar.current()
    window.addEventListener('keydown', esc)
    return () => {
      document.title = antes
      document.documentElement.classList.remove('a-imprimiendo')
      window.removeEventListener('keydown', esc)
      raiz.remove()
    }
  }, [raiz, titulo])

  return createPortal(
    <div className="a-print-back" role="dialog" aria-modal="true" aria-label={titulo}>
      <div className="a-print-bar">
        <span className="a-print-hint">Para PDF: Imprimir → «Guardar como PDF»</span>
        <div className="a-print-bar-btns">
          <button className="a-btn a-btn-accent" onClick={() => window.print()}>Imprimir / PDF</button>
          <button className="a-btn" onClick={() => cerrar.current()}>Cerrar</button>
        </div>
      </div>
      <div className="a-print-hoja">{children}</div>
    </div>,
    raiz
  )
}
