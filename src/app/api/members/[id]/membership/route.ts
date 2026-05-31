// src/app/api/members/[id]/membership/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const member = await prisma.member.findUnique({
    where: { id: params.id },
    select: {
      id:      true,
      name:    true,
      status:  true,
      memberships: {
        where:   { status: 'ACTIVE' },
        take:    1,
        orderBy: { createdAt: 'desc' },
        select: {
          id:          true,
          endDate:     true,
          classesUsed: true,
          plan: { select: { name: true, classLimit: true, intervalDays: true } },
        },
      },
    },
  })

  if (!member) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  return NextResponse.json({
    data: {
      ...member,
      activeMembership: member.memberships[0] ?? null,
    }
  })
}
