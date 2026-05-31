# codeStone — Plataforma de Membresías

Sistema de gestión para gimnasios boutique, academias y negocios de membresías.

---

## Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | Next.js 14 (App Router) | Frontend + API en un solo proyecto |
| Auth + DB + Storage | Supabase | Todo en uno, gratis para empezar |
| ORM | Prisma | Queries con tipos, sin SQL manual |
| Pagos | Stripe | Webhooks confiables, mejor DX |
| QR dinámico | jsonwebtoken + qrcode.react + jsQR | Sin dependencias extra |
| Deploy | Vercel | Gratis, con un clic |

---

## Estructura del proyecto

```
codestone/
├── prisma/
│   └── schema.prisma          # Modelos: Member, Plan, Membership, Payment, Checkin
├── src/
│   ├── app/
│   │   ├── auth/login/        # Login del admin
│   │   ├── dashboard/         # Panel principal con stats
│   │   ├── members/           # Lista y detalle de socios
│   │   │   └── [id]/qr/       # Portal móvil del socio (su QR)
│   │   ├── memberships/       # Gestión de planes
│   │   ├── checkin/           # Pantalla de recepción (escáner)
│   │   └── api/
│   │       ├── members/       # CRUD de socios
│   │       ├── qr/            # Genera y valida tokens QR
│   │       └── payments/
│   │           └── webhook/   # Stripe → activa/desactiva socios
│   ├── components/
│   │   ├── layout/Sidebar.tsx
│   │   └── qr/
│   │       ├── MemberQR.tsx   # QR del socio (se rota cada 15s)
│   │       └── QRScanner.tsx  # Escáner de recepción (verde/rojo)
│   ├── lib/
│   │   ├── prisma.ts          # Singleton de Prisma
│   │   ├── supabase/          # Clientes browser y server
│   │   ├── stripe.ts          # Cliente de Stripe
│   │   └── qr.ts             # generateQRToken / verifyQRToken
│   └── types/index.ts         # Tipos compartidos
└── .env.example               # Variables de entorno necesarias
```

---

## Setup paso a paso

### 1. Clonar e instalar dependencias

```bash
git clone <tu-repo>
cd codestone
npm install
```

### 2. Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Copiar las credenciales: **Settings → API**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Copiar la connection string: **Settings → Database → URI**
   - `DATABASE_URL` (con `?pgbouncer=true`)
   - `DIRECT_URL` (sin pooler)

### 3. Crear proyecto en Stripe

1. Ir a [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers → API keys** → copiar `sk_test_...` y `pk_test_...`
3. **Developers → Webhooks → Add endpoint**
   - URL: `https://tu-dominio.vercel.app/api/payments/webhook`
   - Eventos a escuchar:
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.subscription.deleted`
4. Copiar el **Signing secret** (`whsec_...`)

> En desarrollo usa `stripe listen --forward-to localhost:3000/api/payments/webhook`
> para recibir webhooks localmente. Requiere [Stripe CLI](https://stripe.com/docs/stripe-cli).

### 4. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales reales
```

Generar el `QR_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Sincronizar la base de datos

```bash
npm run db:push      # Crea las tablas en Supabase
npm run db:generate  # Genera el cliente de Prisma
npm run db:studio    # (opcional) Abre Prisma Studio para ver los datos
```

### 6. Arrancar en desarrollo

```bash
npm run dev
# → http://localhost:3000
```

---

## Flujos principales

### QR dinámico (el más importante)

```
Socio (teléfono)                    Servidor                    Recepción (tablet)
      |                                  |                              |
      |── GET /api/qr?membershipId=X ──>|                              |
      |<── { token, expiresIn: 14 } ────|                              |
      |                                  |                              |
      | [muestra QR con el token]        |                              |
      |                                  |     [escanea QR con jsQR]   |
      |                                  |<── POST /api/qr { token } ──|
      |                                  |── verifyQRToken(token)       |
      |                                  |── busca membership en DB     |
      |                                  |── registra checkin           |
      |                                  |── { allowed: true, ... } ──>|
      |                                  |                   [VERDE ✓] |
      | [a los 15s pide nuevo token]     |                              |
```

### Webhook de Stripe

```
Stripe ──── invoice.payment_succeeded ───> /api/payments/webhook
                                               │
                                    membership.status = ACTIVE
                                    member.status     = ACTIVE
                                    endDate           = hoy + intervalDays
                                    Payment.create()

Stripe ──── invoice.payment_failed ──────> /api/payments/webhook
                                               │
                                    membership.status = EXPIRED
                                    member.status     = OVERDUE
```

---

## Rutas de la aplicación

| Ruta | Quién la usa | Descripción |
|------|-------------|-------------|
| `/auth/login` | Admin | Login del panel |
| `/dashboard` | Admin | Stats generales |
| `/members` | Admin | Lista de socios |
| `/memberships` | Admin | Planes disponibles |
| `/checkin` | Staff/Recepción | Escáner QR (dejar fijo en tablet) |
| `/members/[id]/qr` | Socio | Su QR dinámico en el teléfono |

---

## Deploy en Vercel

```bash
npm install -g vercel
vercel --prod
```

Agregar las variables de entorno en:
**Vercel → tu proyecto → Settings → Environment Variables**

---

## División de trabajo sugerida (equipo de 3)

| Persona | Responsabilidad |
|---------|----------------|
| Dev 1 | Backend: Prisma schema, API routes, webhook de Stripe |
| Dev 2 | Frontend: Dashboard, lista de socios, formularios |
| Dev 3 | Módulo QR: MemberQR, QRScanner, integración end-to-end |

---

## Próximos pasos post-MVP

- [ ] Notificaciones por email (Resend) cuando el pago falla
- [ ] Subida de foto del socio a Supabase Storage
- [ ] Página de socios con búsqueda y filtros
- [ ] Historial de pagos con descarga de recibo en PDF
- [ ] Mercado Pago como segunda pasarela
- [ ] Multi-tenant: un sistema para N negocios
