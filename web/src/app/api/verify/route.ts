// Description: Verifies a Stripe session and sets an httpOnly cookie to mark as paid
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

export async function GET(request: Request) {
  try {
    // Optional host enforcement
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
    const allowedHost = process.env.NEXT_PUBLIC_PAID_HOST
    if (allowedHost && !(host === allowedHost || host.startsWith(`${allowedHost}:`))) {
      return NextResponse.json({ ok: false, error: 'invalid_host', host, allowedHost }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return NextResponse.json({ ok: false }, { status: 400 })

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) return NextResponse.json({ ok: false }, { status: 500 })

    const stripeMod = await import('stripe')
    const stripe = new stripeMod.default(secretKey, { apiVersion: '2023-10-16' })
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const paid = session.payment_status === 'paid' || session.status === 'complete'
    const res = NextResponse.json({ ok: paid, token: paid ? generateLicense() : undefined })
    if (paid) {
      const oneYear = 60 * 60 * 24 * 365
      const proto = request.headers.get('x-forwarded-proto') || 'https'
      res.cookies.set('otm_paid', '1', { httpOnly: true, sameSite: 'lax', maxAge: oneYear, path: '/', secure: proto === 'https' })
    }
    return res
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function generateLicense(): string {
  // support key rotation via LICENSE_SECRETS (comma-separated). kid indexes the array
  const secrets = (process.env.LICENSE_SECRETS?.split(',').map((s) => s.trim()).filter(Boolean)) || []
  const secret = secrets[0] || process.env.LICENSE_SECRET || ''
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: 0, ver: 'v1' }))
  const payload = base64url(JSON.stringify({
    typ: 'otm_license',
    aud: 'otm-fpl',
    ver: 'v1',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 31536000,
  }))
  const sig = base64url(crypto.createHmac('sha256', secret).update(`${header}.${payload}`).digest())
  return `${header}.${payload}.${sig}`
}


