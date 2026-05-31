// src/app/api/members/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const CreateMemberSchema = z.object({
  businessId: z.string(),
  name:       z.string().min(2),
  email:      z.string().email(),
  phone:      z.string().optional(),
  photoUrl:   z.string().url().optional(),
  notes:      z.string().optional(),
})

// GET /api/members?businessId=xxx
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId')
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 })

  const members = await prisma.member.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
    include: {
      memberships: {
        where: { status: 'ACTIVE' },
        take: 1,
        include: { plan: true },
      },
    },
  })

  return NextResponse.json({ data: members })
}

// POST /api/members
export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = CreateMemberSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 422 })
  }

  const member = await prisma.member.create({ data: result.data })
  return NextResponse.json({ data: member }, { status: 201 })
}
