// src/components/admin/helpers.js

export const euro = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n || 0))

export const fechaCorta = (d) =>
  d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : ''

export const fechaHora = (d) =>
  d
    ? new Date(d).toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''

// Solo la hora (ej. 17:30)
export const soloHora = (d) =>
  d ? new Date(d).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''

// Rango "10 jun 2026 · 17:00–18:30" (o sin fin si no hay)
export const rangoReunion = (ini, fin) => {
  if (!ini) return ''
  const f = fechaCorta(ini)
  const h1 = soloHora(ini)
  if (!fin) return `${f} · ${h1}`
  return `${f} · ${h1}–${soloHora(fin)}`
}

// Para <input type="datetime-local"> (necesita 'YYYY-MM-DDTHH:mm' en hora local)
export const paraInputDatetime = (d) => {
  const date = d ? new Date(d) : new Date()
  const off = date.getTimezoneOffset()
  const local = new Date(date.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}