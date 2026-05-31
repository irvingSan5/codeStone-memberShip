// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar userEmail={user.email ?? ''} />
      <main style={{
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
        background: 'var(--cs-bg)',
      }}>
        {children}
      </main>
    </div>
  )
}
