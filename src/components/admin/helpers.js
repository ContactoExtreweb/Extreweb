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
// "Hoy · 17:00–18:00", "Mañana · 10:00" o, si es más adelante, la fecha completa
export const cuandoReunion = (ini, fin) => {
  if (!ini) return ''
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const dia = new Date(ini)
  dia.setHours(0, 0, 0, 0)
  const diff = Math.round((dia - hoy) / 864e5) // round: los días con cambio de hora no miden 24 h
  const horas = fin ? `${soloHora(ini)}–${soloHora(fin)}` : soloHora(ini)
  if (diff === 0) return `Hoy · ${horas}`
  if (diff === 1) return `Mañana · ${horas}`
  return rangoReunion(ini, fin)
}

// "ahora", "hace 5 min", "hace 3 h", "ayer", "hace 4 días" o la fecha
export const hace = (d) => {
  const min = Math.round((Date.now() - new Date(d)) / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `hace ${h} h`
  const dias = Math.round(h / 24)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return fechaCorta(d)
}
