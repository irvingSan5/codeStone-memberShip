// src/types/index.ts
// Re-exporta los tipos de Prisma y agrega tipos de UI propios

export type {
  Member,
  Membership,
  Plan,
  Payment,
  Checkin,
  Business,
  MemberStatus,
  MembershipStatus,
  PaymentStatus,
} from '@prisma/client'

// ─── Tipos de respuesta de la API ──────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
}

// ─── Tipo extendido para mostrar miembro con membresía activa ──────────────

export interface MemberWithActiveMembership {
  id: string
  name: string
  email: string
  phone?: string | null
  photoUrl?: string | null
  status: string
  activeMembership?: {
    id: string
    endDate: Date
    classesUsed: number
    plan: {
      name: string
      classLimit: number | null
      intervalDays: number
    }
  } | null
}

// ─── Resultado del check-in al escanear QR ────────────────────────────────

export type CheckinResult =
  | { allowed: true;  member: MemberWithActiveMembership; daysLeft: number }
  | { allowed: false; reason: 'expired' | 'no_membership' | 'invalid_token' | 'overdue' }
