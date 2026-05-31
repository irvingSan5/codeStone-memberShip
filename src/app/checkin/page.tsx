// src/app/checkin/page.tsx
// Esta página NO requiere autenticación del panel de admin.
// Se abre en la tablet/PC de recepción y se deja fija ahí.
import QRScanner from '@/components/qr/QRScanner'

export const metadata = { title: 'Check-in · codeStone' }

export default function CheckinPage() {
  return <QRScanner />
}
