// src/components/admin/AdminApp.jsx
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import Login from './Login.jsx'
import Inicio from './Inicio.jsx'
import Clientes from './Clientes.jsx'
import ClienteDetalle from './ClienteDetalle.jsx'
import ProyectoDetalle from './ProyectoDetalle.jsx'
import Calendario from './Calendario.jsx'
import Mensajes from './Mensajes.jsx'
import Calculadora from './Calculadora.jsx'
import Visitas from './Visitas.jsx'
import Ajustes from './Ajustes.jsx'
import Buscador from './Buscador.jsx'
import { leerHash, hashDe, TITULOS } from './rutas.js'

const NAV = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'mensajes', label: 'Mensajes' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'calendario', label: 'Calendario' },
  { key: 'calculadora', label: 'Calculadora' },
  { key: 'visitas', label: 'Visitas' },
]
// En el móvil el engranaje no cabe en la cabecera: Ajustes va en el menú
const NAV_MOVIL = [...NAV, { key: 'ajustes', label: 'Ajustes' }]

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  // La pantalla sale de la URL (#/cliente/5): al refrescar te quedas donde estabas
  const [nav, setNav] = useState(() => leerHash(window.location.hash))
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const [sinLeer, setSinLeer] = useState(0)
  const [buscando, setBuscando] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  // Contador de mensajes sin leer (se refresca al cambiar de sección)
  const cargarSinLeer = useCallback(async () => {
    const { count } = await supabase
      .from('mensajes')
      .select('id', { count: 'exact', head: true })
      .eq('leido', false)
    setSinLeer(count || 0)
  }, [])

  useEffect(() => {
    if (session) cargarSinLeer()
  }, [session, nav.view, cargarSinLeer])

  // Botones atrás/adelante del navegador: se vuelve a la pantalla del panel que toque
  useEffect(() => {
    const alMoverse = () => {
      setNav(leerHash(window.location.hash))
      setMenuOpen(false)
      setBuscando(false)
    }
    window.addEventListener('popstate', alMoverse)
    return () => window.removeEventListener('popstate', alMoverse)
  }, [])

  // Título de la pestaña del navegador (también es lo que sale en el historial)
  useEffect(() => {
    document.title = `${TITULOS[nav.view] || 'Panel'} · Panel extreweb`
  }, [nav.view])

  // Ctrl+K (o Cmd+K en Mac) abre el buscador desde cualquier pantalla
  useEffect(() => {
    const atajo = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setBuscando(true)
      }
    }
    window.addEventListener('keydown', atajo)
    return () => window.removeEventListener('keydown', atajo)
  }, [])

  // Cambiar de pantalla: se apunta en la URL y crea una entrada en el historial
  // (así "atrás" vuelve aquí). Si ya estás en esa misma pantalla, no se duplica
  function go(view, params = {}) {
    const nuevo = { view, ...params }
    const hash = hashDe(nuevo)
    if (hash !== window.location.hash) window.history.pushState(null, '', hash)
    setNav(nuevo)
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }

  // Cambiar de pestaña dentro de una pantalla (proyecto, visitas): se apunta en la
  // URL para que sobreviva al refresco, pero sin llenar el historial de entradas
  function cambiarPestana(pestana) {
    const nuevo = { ...nav, pestana }
    window.history.replaceState(null, '', hashDe(nuevo))
    setNav(nuevo)
  }

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch (e) {}
  }

  async function logout() {
    await supabase.auth.signOut()
    window.history.replaceState(null, '', '#/')
    setNav({ view: 'inicio' })
  }

  if (loading) return <div className="a-loading">Cargando…</div>
  if (!session) return <Login />

  const isActive = (key) =>
    nav.view === key || (key === 'clientes' && (nav.view === 'cliente' || nav.view === 'proyecto'))

  return (
    <div className="a-app">
      {/* ---------- HEADER ---------- */}
      <header className="a-header">
        <div className="a-header-inner">
          {/* Marca */}
          <button className="a-brand" onClick={() => go('inicio')} aria-label="Inicio">
            <svg width="30" height="30" viewBox="0 0 512 512" aria-hidden="true">
              <defs>
                <linearGradient id="ewh" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#0071e3" />
                  <stop offset="1" stopColor="#7c5cff" />
                </linearGradient>
              </defs>
              <rect width="512" height="512" rx="118" fill="url(#ewh)" />
              <g fill="#fff">
                <rect x="150" y="140" width="50" height="232" rx="25" />
                <rect x="150" y="140" width="220" height="50" rx="25" />
                <rect x="150" y="231" width="158" height="50" rx="25" />
                <rect x="150" y="322" width="220" height="50" rx="25" />
              </g>
            </svg>
            <span className="a-brand-name">extreweb</span>
            <span className="a-brand-tag">panel</span>
          </button>

          {/* Nav escritorio */}
          <nav className="a-topnav">
            {NAV.map((n) => (
              <button key={n.key} className={`a-topnav-link ${isActive(n.key) ? 'is-active' : ''}`} onClick={() => go(n.key)}>
                {n.label}
                {n.key === 'mensajes' && sinLeer > 0 && <span className="a-nav-count">{sinLeer}</span>}
              </button>
            ))}
          </nav>

          {/* Acciones derecha */}
          <div className="a-header-actions">
            <button className="a-hicon" onClick={() => setBuscando(true)} aria-label="Buscar (Ctrl+K)" title="Buscar (Ctrl+K)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
            <button className={`a-hicon a-hicon-ajustes ${nav.view === 'ajustes' ? 'is-active' : ''}`} onClick={() => go('ajustes')} aria-label="Ajustes" title="Ajustes">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            </button>
            <button className="a-hicon" onClick={toggleTheme} aria-label="Cambiar tema">
              {dark ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M6 6L4.5 4.5M19.5 19.5 18 18M6 18l-1.5 1.5M19.5 4.5 18 6" /></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
              )}
            </button>
            <button className="a-hicon a-hicon-logout" onClick={logout} aria-label="Cerrar sesión">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            </button>
            {/* Hamburguesa (solo móvil) */}
            <button className="a-burger" onClick={() => setMenuOpen((s) => !s)} aria-label="Menú" aria-expanded={menuOpen}>
              {menuOpen ? '✕' : '☰'}
              {!menuOpen && sinLeer > 0 && <span className="a-burger-dot" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Nav desplegable móvil */}
        {menuOpen && (
          <nav className="a-mobilenav">
            {NAV_MOVIL.map((n) => (
              <button key={n.key} className={`a-mobilenav-link ${isActive(n.key) ? 'is-active' : ''}`} onClick={() => go(n.key)}>
                {n.label}
                {n.key === 'mensajes' && sinLeer > 0 && <span className="a-nav-count">{sinLeer}</span>}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* ---------- CONTENIDO ---------- */}
      <main className="a-main">
        {nav.view === 'inicio' && <Inicio go={go} email={session.user?.email} />}
        {/* key: si ya estás en Mensajes y el buscador abre otro, se vuelve a montar para abrirlo */}
        {nav.view === 'mensajes' && <Mensajes key={nav.mensajeId || 'lista'} go={go} onChange={cargarSinLeer} abrirId={nav.mensajeId} />}
        {nav.view === 'clientes' && <Clientes go={go} nuevo={nav.nuevo} />}
        {nav.view === 'cliente' && <ClienteDetalle clienteId={nav.clienteId} go={go} />}
        {nav.view === 'proyecto' && (
          <ProyectoDetalle proyectoId={nav.proyectoId} clienteId={nav.clienteId} go={go} pestana={nav.pestana} onPestana={cambiarPestana} />
        )}
        {nav.view === 'calendario' && <Calendario go={go} nueva={nav.nueva} />}
        {nav.view === 'calculadora' && <Calculadora />}
        {nav.view === 'visitas' && <Visitas pestanaInicial={nav.pestana} onPestana={cambiarPestana} />}
        {nav.view === 'ajustes' && <Ajustes />}
      </main>

      {buscando && <Buscador go={go} onClose={() => setBuscando(false)} />}
    </div>
  )
}