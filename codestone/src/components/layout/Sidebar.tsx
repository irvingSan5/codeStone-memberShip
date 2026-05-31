'use client'
// src/components/layout/Sidebar.tsx
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',   icon: '▦' },
  { href: '/members',       label: 'Socios',       icon: '◉' },
  { href: '/memberships',   label: 'Membresías',   icon: '◈' },
  { href: '/checkin',       label: 'Check-in',     icon: '⊙' },
]

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--cs-surface)',
      borderRight: '1px solid var(--cs-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <span style={{
          display: 'inline-block',
          background: 'var(--cs-accent)',
          color: '#fff',
          fontWeight: 700,
          fontSize: '12px',
          letterSpacing: '0.08em',
          padding: '4px 10px',
          borderRadius: '5px',
        }}>
          codeStone
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', padding: '0 0.75rem' }}>
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--cs-text)' : 'var(--cs-muted)',
                background: active ? 'var(--cs-bg)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.1s',
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid var(--cs-border)',
        marginTop: 'auto',
      }}>
        <p style={{ fontSize: '12px', color: 'var(--cs-muted)', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {userEmail}
        </p>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid var(--cs-border)',
            borderRadius: '7px',
            color: 'var(--cs-muted)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
