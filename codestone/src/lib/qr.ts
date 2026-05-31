// src/lib/qr.ts
// Lógica del QR dinámico: genera tokens JWT que expiran en 15 segundos.
// El QR no expone datos del socio — solo un token opaco que el servidor valida.
import jwt from 'jsonwebtoken'

const QR_SECRET = process.env.QR_SECRET!
const QR_TTL_SECONDS = 15

export interface QRPayload {
  memberId: string
  membershipId: string
  // iat y exp los agrega jwt automáticamente
}

/** Genera un token firmado válido por 15 segundos */
export function generateQRToken(payload: QRPayload): string {
  return jwt.sign(payload, QR_SECRET, { expiresIn: QR_TTL_SECONDS })
}

/** Verifica el token. Lanza error si expiró o es inválido. */
export function verifyQRToken(token: string): QRPayload {
  return jwt.verify(token, QR_SECRET) as QRPayload
}

/** Cuántos segundos faltan para que expire el slot actual de 15s */
export function secondsUntilNextRotation(): number {
  const now = Math.floor(Date.now() / 1000)
  return QR_TTL_SECONDS - (now % QR_TTL_SECONDS)
}
