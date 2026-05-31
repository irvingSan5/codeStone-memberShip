'use client'
// src/components/qr/MemberQR.tsx
// El socio ve este componente en su teléfono. El QR se rota cada 15s.
import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Props {
  membershipId: string
  memberName: string
  planName: string
}

export default function MemberQR({ membershipId, memberName, planName }: Props) {
  const [token, setToken]           = useState<string | null>(null)
  const [expiresIn, setExpiresIn]   = useState(15)
  const [error, setError]           = useState(false)

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/qr?membershipId=${membershipId}`)
      if (!res.ok) { setError(true); return }
      const { data } = await res.json()
      setToken(data.token)
      setExpiresIn(data.expiresIn)
      setError(false)
    } catch {
      setError(true)
    }
  }, [membershipId])

  // Pedir nuevo token cuando el actual vence
  useEffect(() => {
    fetchToken()
    const interval = setInterval(fetchToken, 15_000)
    return () => clearInterval(interval)
  }, [fetchToken])

  // Countdown visual
  useEffect(() => {
    if (expiresIn <= 0) return
    const timer = setInterval(() => setExpiresIn(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [expiresIn])

  const progress = (expiresIn / 15) * 100

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '2rem',
    }}>
      <div>
        <p style={{ fontSize: '22px', fontWeight: 700, textAlign: 'center', color: 'var(--cs-text)' }}>
          {memberName}
        </p>
        <p style={{ fontSize: '14px', color: 'var(--cs-muted)', textAlign: 'center' }}>
          {planName}
        </p>
      </div>

      {/* QR */}
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '16px',
        opacity: error ? 0.3 : 1,
        transition: 'opacity 0.3s',
      }}>
        {token ? (
          <QRCodeSVG value={token} size={220} level="M" />
        ) : (
          <div style={{ width: 220, height: 220, background: '#f0f0f0', borderRadius: '8px' }} />
        )}
      </div>

      {error && (
        <p style={{ color: 'var(--cs-danger)', fontSize: '14px' }}>
          Error al cargar QR. Verifica tu conexión.
        </p>
      )}

      {/* Barra de progreso del countdown */}
      <div style={{ width: '220px' }}>
        <div style={{
          height: '4px',
          background: 'var(--cs-border)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: progress > 40 ? 'var(--cs-success)' : 'var(--cs-warning)',
            borderRadius: '2px',
            transition: 'width 1s linear, background 0.3s',
          }} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--cs-muted)', textAlign: 'center', marginTop: '6px' }}>
          Nuevo QR en {expiresIn}s
        </p>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--cs-muted)', textAlign: 'center', maxWidth: '240px' }}>
        Muestra este código al entrar. Se renueva automáticamente.
      </p>
    </div>
  )
}
