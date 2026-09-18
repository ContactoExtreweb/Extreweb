// src/components/admin/CalendarioSync.jsx — suscribir el iPhone al calendario del panel
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'

// Siempre el dominio real: el iPhone no puede suscribirse a localhost
const HOST = 'extreweb.es'

const nuevoToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, '0')).join('')

export default function CalendarioSync({ onClose }) {
  const [token, setToken] = useState(null)
  const [estado, setEstado] = useState('cargando') // cargando | listo | error
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('ajustes')
        .select('valor')
        .eq('clave', 'calendario_token')
        .maybeSingle()
      if (error || !data) return setEstado('error')
      setToken(data.valor)
      setEstado('listo')
    })()
  }, [])

  const https = token ? `https://${HOST}/calendario.ics?t=${token}` : ''
  const webcal = token ? `webcal://${HOST}/calendario.ics?t=${token}` : ''

  async function copiar() {
    try {
      await navigator.clipboard.writeText(https)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch (e) {
      document.getElementById('a-sync-url')?.select()
    }
  }

  async function regenerar() {
    if (!confirm('El enlace actual dejará de funcionar y tendréis que volver a suscribiros en cada iPhone. ¿Seguir?')) return
    const valor = nuevoToken()
    const { error } = await supabase
      .from('ajustes')
      .update({ valor, updated_at: new Date().toISOString() })
      .eq('clave', 'calendario_token')
    if (error) return setEstado('error')
    setToken(valor)
  }

  return (
    <div className="a-modal-back" onClick={onClose}>
      <div className="a-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="a-sync-title">
        <div className="a-modal-head">
          <h2 className="a-h2" id="a-sync-title">Ver las reuniones en el iPhone</h2>
          <button className="a-icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {estado === 'cargando' && <p className="a-muted">Cargando…</p>}

        {estado === 'error' && (
          <p className="a-error">
            No se ha encontrado el enlace del calendario. Ejecuta <code>supabase/ajustes.sql</code> en Supabase y vuelve a abrir esta ventana.
          </p>
        )}

        {estado === 'listo' && (
          <div className="a-sync">
            <p className="a-sync-intro">
              Te suscribes una vez y las reuniones del panel aparecen solas en el calendario del iPhone, con aviso 30 minutos antes.
            </p>

            <a className="a-btn a-btn-accent a-btn-full a-sync-main" href={webcal}>
              Suscribirme en este dispositivo
            </a>
            <p className="a-sync-hint">Ábrelo desde el iPhone y pulsa «Suscribirse».</p>

            <div className="a-field">
              <label className="a-label" htmlFor="a-sync-url">O copia el enlace</label>
              <div className="a-sync-copy">
                <input id="a-sync-url" className="a-input a-input-sm" value={https} readOnly onFocus={(e) => e.target.select()} />
                <button className="a-btn a-btn-sm" onClick={copiar}>{copiado ? 'Copiado ✓' : 'Copiar'}</button>
              </div>
              <p className="a-sync-hint">
                En el iPhone: Ajustes → Calendario → Cuentas → Añadir cuenta → Otra → Añadir calendario suscrito.
              </p>
            </div>

            <ul className="a-sync-notes">
              <li>Es de solo lectura: las citas se crean y editan aquí, en el panel.</li>
              <li>El iPhone lo actualiza cada cierto tiempo; un cambio puede tardar hasta una hora en verse.</li>
              <li>El enlace es secreto: quien lo tenga ve vuestras reuniones. No lo compartas.</li>
            </ul>

            <button className="a-btn a-btn-danger a-btn-sm a-sync-regen" onClick={regenerar}>
              Regenerar enlace
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
