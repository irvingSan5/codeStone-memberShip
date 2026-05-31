// src/app/dashboard/page.tsx
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  // TODO: reemplazar '1' con el businessId real del usuario autenticado
  const BUSINESS_ID = '1'

  const [totalMembers, activeMembers, overdueMembers] = await Promise.all([
    prisma.member.count({ where: { businessId: BUSINESS_ID } }),
    prisma.member.count({ where: { businessId: BUSINESS_ID, status: 'ACTIVE' } }),
    prisma.member.count({ where: { businessId: BUSINESS_ID, status: 'OVERDUE' } }),
  ])

  const recentCheckins = await prisma.checkin.findMany({
    take: 5,
    orderBy: { checkedInAt: 'desc' },
    include: {
      membership: {
        include: { member: true, plan: true }
      }
    }
  })

  const stats = [
    { label: 'Total socios',    value: totalMembers,   color: 'var(--cs-accent)' },
    { label: 'Activos',         value: activeMembers,  color: 'var(--cs-success)' },
    { label: 'Con adeudo',      value: overdueMembers, color: 'var(--cs-danger)' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: 'var(--cs-muted)', fontSize: '14px', marginBottom: '2rem' }}>
        Resumen general de tu negocio
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '2rem' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--cs-surface)',
            border: '1px solid var(--cs-border)',
            borderRadius: '12px',
            padding: '1.5rem',
          }}>
            <p style={{ fontSize: '13px', color: 'var(--cs-muted)', marginBottom: '8px' }}>{s.label}</p>
            <p style={{ fontSize: '36px', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Check-ins recientes */}
      <div style={{
        background: 'var(--cs-surface)',
        border: '1px solid var(--cs-border)',
        borderRadius: '12px',
        padding: '1.5rem',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '1rem' }}>Check-ins recientes</h2>
        {recentCheckins.length === 0 ? (
          <p style={{ color: 'var(--cs-muted)', fontSize: '14px' }}>Aún no hay check-ins registrados.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--cs-border)' }}>
                {['Socio', 'Plan', 'Hora'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--cs-muted)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCheckins.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--cs-border)' }}>
                  <td style={{ padding: '10px 12px' }}>{c.membership.member.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--cs-muted)' }}>{c.membership.plan.name}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--cs-muted)' }}>
                    {new Date(c.checkedInAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
