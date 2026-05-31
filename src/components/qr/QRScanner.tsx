'use client'
// src/components/qr/QRScanner.tsx
// La pantalla de recepción. Usa la cámara del dispositivo para escanear QRs.
// Al validar muestra verde (acceso) o rojo (denegado) con foto del socio.
import { useEffect, useRef, useState, useCallback } from 'react'
import jsQR from 'jsqr'
import type { CheckinResult } from '@/types'

type ScanState = 'idle' | 'success' | 'denied'

export default function QRScanner() {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef<number | null>(null)

  const [scanState, setScanState]   = useState<ScanState>('idle')
  const [result, setResult]         = useState<CheckinResult | null>(null)
  const [cameraError, setCameraError] = useState(false)

  // Iniciar cámara
  useEffect(() => {
    let stream: MediaStream | null = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: 640, height: 480 },
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch {
        setCameraError(true)
      }
    }

    startCamera()
    return () => {
      stream?.getTracks().forEach(t => t.stop())
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const validateToken = useCallback(async (token: string) => {
    // Pausar el scan mientras validamos
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    try {
      const res = await fetch('/api/qr', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      })
      const data: CheckinResult = await res.json()
      setResult(data)
      setScanState(data.allowed ? 'success' : 'denied')
    } catch {
      setScanState('denied')
      setResult({ allowed: false, reason: 'invalid_token' })
    }

    // Volver a idle después de 4 segundos
    setTimeout(() => {
      setScanState('idle')
      setResult(null)
      startScan()
    }, 4000)
  }, [])

  const startScan = useCallback(() => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d')!

    function tick() {
      if (video!.readyState === video!.HAVE_ENOUGH_DATA) {
        canvas!.width  = video!.videoWidth
        canvas!.height = video!.videoHeight
        ctx.drawImage(video!, 0, 0, canvas!.width, canvas!.height)

        const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code?.data) {
          validateToken(code.data)
          return // detener el loop hasta que se resuelva
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [validateToken])

  // Arrancar scan cuando el video esté listo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.addEventListener('playing', startScan)
    return () => video.removeEventListener('playing', startScan)
  }, [startScan])

  const REASON_LABELS: Record<string, string> = {
    expired:       'Membresía vencida',
    no_membership: 'Sin membresía activa',
    invalid_token: 'QR inválido o expirado',
    overdue:       'Cuenta con adeudo',
  }

  const bgColor =
    scanState === 'success' ? 'var(--cs-success)' :
    scanState === 'denied'  ? 'var(--cs-danger)'  :
    'var(--cs-bg)'

  return (
    <div style={{
      minHeight: '100vh',
      background: bgColor,
      transition: 'background 0.4s ease',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '2rem',
    }}>

      {/* Header */}
      {scanState === 'idle' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            background: 'var(--cs-accent)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '12px',
            letterSpacing: '0.08em',
            padding: '4px 10px',
            borderRadius: '5px',
            marginBottom: '12px',
          }}>
            codeStone · Recepción
          </div>
          <p style={{ color: 'var(--cs-muted)', fontSize: '14px' }}>
            Apunta la cámara al QR del socio
          </p>
        </div>
      )}

      {/* Visor de cámara — solo visible en idle */}
      {scanState === 'idle' && (
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          aspectRatio: '4/3',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '2px solid var(--cs-border)',
          background: '#000',
        }}>
          {cameraError ? (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--cs-muted)', fontSize: '14px', textAlign: 'center', padding: '1rem',
            }}>
              No se pudo acceder a la cámara.<br />Verifica los permisos del navegador.
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {/* Marco de guía */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '200px', height: '200px',
                  border: '3px solid rgba(255,255,255,0.7)',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                }} />
              </div>
            </>
          )}
        </div>
      )}

      {/* Canvas oculto para jsQR */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* ── RESULTADO: ACCESO PERMITIDO ── */}
      {scanState === 'success' && result?.allowed && (
        <div style={{ textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          {/* Foto */}
          {result.member.photoUrl ? (
            <img
              src={result.member.photoUrl}
              alt={result.member.name}
              style={{
                width: 120, height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid #fff',
                marginBottom: '1rem',
              }}
            />
          ) : (
            <div style={{
              width: 120, height: 120, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '48px', marginBottom: '1rem', margin: '0 auto 1rem',
            }}>
              {result.member.name[0].toUpperCase()}
            </div>
          )}

          <p style={{ fontSize: '48px', marginBottom: '8px' }}>✓</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            {result.member.name}
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
            {result.member.activeMembership?.plan.name}
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
            {result.daysLeft > 0
              ? `${result.daysLeft} día${result.daysLeft !== 1 ? 's' : ''} restante${result.daysLeft !== 1 ? 's' : ''}`
              : 'Último día de membresía'}
          </p>
        </div>
      )}

      {/* ── RESULTADO: ACCESO DENEGADO ── */}
      {scanState === 'denied' && result && !result.allowed && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '64px', marginBottom: '12px' }}>✗</p>
          <p style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
            Acceso denegado
          </p>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.85)' }}>
            {REASON_LABELS[result.reason] ?? 'Error desconocido'}
          </p>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
