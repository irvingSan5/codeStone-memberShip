'use client'
// src/app/members/[id]/qr/page.tsx
// El socio accede a esta URL desde su teléfono para ver su QR dinámico.
// En el MVP: el admin le comparte el link directo. En v2: magic link por email.
import { useEffect, useState } from 'react'
import MemberQR from '@/components/qr/MemberQR'

interface MemberData {
  name: string
  planName: string
  endDate: string
  status: string
}

export default function MemberQRPage({ params }: { params: { id: string } }) {
  const [member, setMember] = useState<MemberData | null>(null)
  const [membershipId, setMembershipId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/members/${params.id}/membership`)
        if (!res.ok) { setError(true); setLoading(false); return }
        const { data } = await res.json()
        setMember({
          name:     data.name,
          planName: data.activeMembership?.plan.name ?? 'Sin plan activo',
          endDate:  data.activeMembership?.endDate,
          status:   data.status,
        })
        setMembershipId(data.activeMembership?.id ?? null)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'var(--cs-bg)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  }

  if (loading) return (
    <div style={containerStyle}>
      <p style={{ color: 'var(--cs-muted)', fontSize: '14px' }}>Cargando...</p>
    </div>
  )

  if (error || !member || !membershipId) return (
    <div style={containerStyle}>
      <p style={{ color: 'var(--cs-danger)', fontSize: '16px', textAlign: 'center', padding: '2rem' }}>
        No se encontró una membresía activa.<br />
        <span style={{ fontSize: '13px', color: 'var(--cs-muted)' }}>
          Contacta a recepción para más información.
        </span>
      </p>
    </div>
  )

  return (
    <div style={containerStyle}>
      <MemberQR
        membershipId={membershipId}
        memberName={member.name}
        planName={member.planName}
      />
    </div>
  )
}
