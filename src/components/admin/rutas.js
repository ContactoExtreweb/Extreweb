// src/components/admin/rutas.js — la pantalla del panel va en la URL (#/cliente/5)
// Así, al refrescar, te quedas donde estabas, y el botón "atrás" del navegador
// vuelve a la pantalla anterior del panel en vez de salir a la web.
//
//   #/                       Inicio
//   #/mensajes[/<id>]        Mensajes (con uno abierto)
//   #/clientes               Clientes
//   #/cliente/<id>           Ficha de un cliente
//   #/proyecto/<id>[/<tab>]  Proyecto (y su pestaña)
//   #/visitas[/<tab>]        Visitas (y su pestaña)
//   #/calendario · #/calculadora · #/ajustes
//
// Lo que es "de un solo uso" (abrir el formulario de nuevo cliente o de nueva
// reunión) NO va en la URL: al volver atrás o refrescar no se vuelve a abrir.

const VISTAS = ['inicio', 'mensajes', 'clientes', 'cliente', 'proyecto', 'calendario', 'calculadora', 'visitas', 'ajustes']

export const TITULOS = {
  inicio: 'Inicio',
  mensajes: 'Mensajes',
  clientes: 'Clientes',
  cliente: 'Cliente',
  proyecto: 'Proyecto',
  calendario: 'Calendario',
  calculadora: 'Calculadora',
  visitas: 'Visitas',
  ajustes: 'Ajustes',
}

export function leerHash(hash) {
  const partes = String(hash || '')
    .replace(/^#\/?/, '')
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p)
      } catch (e) {
        return p
      }
    })
  const [vista, id, sub] = partes
  const view = VISTAS.includes(vista) ? vista : 'inicio'

  if (view === 'cliente') return id ? { view, clienteId: id } : { view: 'clientes' }
  if (view === 'proyecto') return id ? { view, proyectoId: id, pestana: sub } : { view: 'clientes' }
  if (view === 'mensajes' && id) return { view, mensajeId: id }
  if (view === 'visitas' && id) return { view, pestana: id }
  return { view }
}

export function hashDe(nav) {
  const e = (v) => encodeURIComponent(String(v))
  switch (nav.view) {
    case 'inicio':
      return '#/'
    case 'cliente':
      return `#/cliente/${e(nav.clienteId)}`
    case 'proyecto':
      return `#/proyecto/${e(nav.proyectoId)}${nav.pestana ? `/${e(nav.pestana)}` : ''}`
    case 'mensajes':
      return nav.mensajeId ? `#/mensajes/${e(nav.mensajeId)}` : '#/mensajes'
    case 'visitas':
      return nav.pestana ? `#/visitas/${e(nav.pestana)}` : '#/visitas'
    default:
      return `#/${nav.view}`
  }
}
