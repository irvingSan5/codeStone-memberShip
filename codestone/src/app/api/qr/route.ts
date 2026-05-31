// src/app/api/qr/route.ts
// GET /api/qr?membershipId=xxx  → genera el token actual
// POST /api/qr                  → valida un token escaneado y registra check-in
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateQRToken, verifyQRToken, secondsUntilNextRotation } from '@/lib/qr'
import { differenceInDays } from 'date-fns'

// GET – el cliente pide su token actual (se llama cada ~5s desde el frontend)
export async function GET(req: NextRequest) {
  const membershipId = req.nextUrl.searchParams.get('membershipId')
  if (!membershipId) return NextResponse.json({ error: 'membershipId requerido' }, { status: 400 })

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: { member: true },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Membresía inactiva' }, { status: 403 })
  }

  const token = generateQRToken({
    memberId:     membership.memberId,
    membershipId: membership.id,
  })

  return NextResponse.json({
    data: {
      token,
      expiresIn: secondsUntilNextRotation(),
    }
  })
}

// POST – el staff escanea un QR y el sistema valida + registra check-in
export async function POST(req: NextRequest) {
  const { token } = await req.json()

  if (!token) return NextResponse.json({ allowed: false, reason: 'invalid_token' })

  let payload
  try {
    payload = verifyQRToken(token)
  } catch {
    return NextResponse.json({ allowed: false, reason: 'invalid_token' })
  }

  const membership = await prisma.membership.findUnique({
    where: { id: payload.membershipId },
    include: {
      member: { select: { id: true, name: true, photoUrl: true, status: true } },
      plan:   { select: { name: true, classLimit: true, intervalDays: true } },
    },
  })

  if (!membership) return NextResponse.json({ allowed: false, reason: 'no_membership' })

  // Verificar vigencia
  if (membership.status !== 'ACTIVE' || new Date() > membership.endDate) {
    return NextResponse.json({ allowed: false, reason: 'expired' })
  }

  // Verificar clases restantes (si el plan tiene límite)
  if (membership.plan.classLimit !== null && membership.classesUsed >= membership.plan.classLimit) {
    return NextResponse.json({ allowed: false, reason: 'expired' })
  }

  // Todo bien → registrar check-in y actualizar clases usadas
  await prisma.$transaction([
    prisma.checkin.create({ data: { membershipId: membership.id } }),
    prisma.membership.update({
      where: { id: membership.id },
      data: { classesUsed: { increment: 1 } },
    }),
  ])

  const daysLeft = differenceInDays(membership.endDate, new Date())

  return NextResponse.json({
    allowed: true,
    member: {
      id:       membership.member.id,
      name:     membership.member.name,
      photoUrl: membership.member.photoUrl,
      status:   membership.member.status,
      activeMembership: {
        id:          membership.id,
        endDate:     membership.endDate,
        classesUsed: membership.classesUsed + 1,
        plan:        membership.plan,
      },
    },
    daysLeft,
  })
}
