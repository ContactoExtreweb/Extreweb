// src/components/admin/Login.jsx
import { useState } from 'react'
import { supabase } from '@/lib/adminClient.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError('Email o contraseña incorrectos.')
    }
    // Si va bien, onAuthStateChange en AdminApp cambia la vista solo.
  }

  return (
    <div className="a-login">
      <div className="a-login-card">
        <div className="a-login-mark" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 512 512">
            <defs>
              <linearGradient id="ewl" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#0071e3" />
                <stop offset="1" stopColor="#7c5cff" />
              </linearGradient>
            </defs>
            <rect width="512" height="512" rx="118" fill="url(#ewl)" />
            <g fill="#fff">
              <rect x="150" y="140" width="50" height="232" rx="25" />
              <rect x="150" y="140" width="220" height="50" rx="25" />
              <rect x="150" y="231" width="158" height="50" rx="25" />
              <rect x="150" y="322" width="220" height="50" rx="25" />
            </g>
          </svg>
        </div>
        <h1 className="a-login-title">Panel de extreweb</h1>
        <p className="a-login-sub">Acceso privado del equipo.</p>

        <form onSubmit={onSubmit} className="a-login-form">
          <div className="a-field">
            <label className="a-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="a-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@extreweb.es"
              required
              autoComplete="username"
            />
          </div>
          <div className="a-field">
            <label className="a-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className="a-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="a-login-error">{error}</p>}

          <button type="submit" className="a-btn a-btn-accent a-btn-full" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
