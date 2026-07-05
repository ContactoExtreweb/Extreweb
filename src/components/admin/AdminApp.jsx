// src/components/admin/AdminApp.jsx
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/adminClient.js'
import Login from './Login.jsx'
import Inicio from './Inicio.jsx'
import Clientes from './Clientes.jsx'
import ClienteDetalle from './ClienteDetalle.jsx'
import ProyectoDetalle from './ProyectoDetalle.jsx'
import Calendario from './Calendario.jsx'

const NAV = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'clientes', label: 'Clientes' },
  { key: 'calendario', label: 'Calendario' },
]

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nav, setNav] = useState({ view: 'inicio' })
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  )
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  function go(view, params = {}) {
    setNav({ view, ...params })
    setMenuOpen(false)
    window.scrollTo(0, 0)
  }

  function toggleTheme() {
    const next = !dark
    setDark(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    try { localStorage.setItem('theme', next ? 'dark' : 'light') } catch (e) {}
  }

  async function logout() {
    await supabase.auth.signOut()
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
              </button>
            ))}
          </nav>

          {/* Acciones derecha */}
          <div className="a-header-actions">
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
            <button className="a-burger" onClick={() => setMenuOpen((s) => !s)} aria-label="Menú">
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Nav desplegable móvil */}
        {menuOpen && (
          <nav className="a-mobilenav">
            {NAV.map((n) => (
              <button key={n.key} className={`a-mobilenav-link ${isActive(n.key) ? 'is-active' : ''}`} onClick={() => go(n.key)}>
                {n.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* ---------- CONTENIDO ---------- */}
      <main className="a-main">
        {nav.view === 'inicio' && <Inicio go={go} email={session.user?.email} />}
        {nav.view === 'clientes' && <Clientes go={go} />}
        {nav.view === 'cliente' && <ClienteDetalle clienteId={nav.clienteId} go={go} />}
        {nav.view === 'proyecto' && <ProyectoDetalle proyectoId={nav.proyectoId} clienteId={nav.clienteId} go={go} />}
        {nav.view === 'calendario' && <Calendario go={go} />}
      </main>
    </div>
  )
}