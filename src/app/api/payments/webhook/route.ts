// src/app/api/payments/webhook/route.ts
// Stripe llama a este endpoint cuando un pago ocurre o falla.
// CRÍTICO: verificar la firma antes de procesar cualquier evento.
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const body      = await req.text()
  const signature = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Webhook inválido' }, { status: 400 })
  }

  switch (event.type) {
    // Pago exitoso → activar membresía y cambiar status a ACTIVE
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as { subscription: string; amount_paid: number; hosted_invoice_url: string }
      const subscriptionId = invoice.subscription

      const membership = await prisma.membership.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
        include: { plan: true },
      })
      if (!membership) break

      const newEndDate = addDays(new Date(), membership.plan.intervalDays)

      await prisma.$transaction([
        prisma.membership.update({
          where: { id: membership.id },
          data: { status: 'ACTIVE', endDate: newEndDate, classesUsed: 0 },
        }),
        prisma.member.update({
          where: { id: membership.memberId },
          data: { status: 'ACTIVE' },
        }),
        prisma.payment.create({
          data: {
            memberId:     membership.memberId,
            membershipId: membership.id,
            amount:       invoice.amount_paid / 100,
            status:       'PAID',
            receiptUrl:   invoice.hosted_invoice_url,
            paidAt:       new Date(),
          },
        }),
      ])
      break
    }

    // Pago fallido → marcar como moroso
    case 'invoice.payment_failed': {
      const invoice = event.data.object as { subscription: string }
      const membership = await prisma.membership.findFirst({
        where: { stripeSubscriptionId: invoice.subscription },
      })
      if (!membership) break

      await prisma.$transaction([
        prisma.membership.update({
          where: { id: membership.id },
          data: { status: 'EXPIRED' },
        }),
        prisma.member.update({
          where: { id: membership.memberId },
          data: { status: 'OVERDUE' },
        }),
      ])
      break
    }

    // Suscripción cancelada
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as { id: string }
      await prisma.membership.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'CANCELLED' },
      })
      break
    }
  }

  return NextResponse.json({ received: true })
}

// Stripe envía el cuerpo en formato raw — no usar el parser de Next
export const config = { api: { bodyParser: false } }
