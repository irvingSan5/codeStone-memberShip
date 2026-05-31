// src/app/layout.tsx
import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'codeStone — Gestión de membresías',
  description: 'Plataforma de gestión para gimnasios boutique y academias',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body>{children}</body>
    </html>
  )
}
