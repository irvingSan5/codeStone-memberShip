'use client'
// src/app/auth/login/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--cs-bg)',
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--cs-surface)',
        border: '1px solid var(--cs-border)',
        borderRadius: '16px',
        padding: '2.5rem',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--cs-accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '0.1em',
            padding: '6px 14px',
            borderRadius: '6px',
            marginBottom: '1rem',
          }}>
            codeStone
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--cs-text)' }}>
            Panel de administración
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--cs-muted)', marginTop: '6px' }}>
            Inicia sesión para continuar
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cs-muted)', display: 'block', marginBottom: '6px' }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--cs-bg)',
                border: '1px solid var(--cs-border)',
                borderRadius: '8px',
                color: 'var(--cs-text)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', color: 'var(--cs-muted)', display: 'block', marginBottom: '6px' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--cs-bg)',
                border: '1px solid var(--cs-border)',
                borderRadius: '8px',
                color: 'var(--cs-text)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '13px', color: 'var(--cs-danger)', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? 'var(--cs-border)' : 'var(--cs-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              marginTop: '4px',
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
