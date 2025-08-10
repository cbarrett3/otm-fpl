// Description: Activates a license token (JWT-like HMAC) and sets the paid cookie
import { NextResponse } from 'next/server'
import crypto from 'node:crypto'

// Simple in-memory rate limit for activation
const rl = new Map<string, { n: number; t: number }>()
function rateLimit(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now()
  const cur = rl.get(ip)
  if (!cur || now - cur.t > windowMs) { rl.set(ip, { n: 1, t: now }); return true }
  if (cur.n >= limit) return false
  cur.n += 1
  return true
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function getSecrets(): string[] {
  const multi = process.env.LICENSE_SECRETS
  if (multi) return multi.split(',').map((s) => s.trim()).filter(Boolean)
  const single = process.env.LICENSE_SECRET || ''
  return single ? [single] : []
}

function verifyToken(token: string): boolean {
  const parts = token.split('.')
  if (parts.length !== 3) return false
  const [h, p, s] = parts
  type Header = { alg?: string; typ?: string; kid?: number }
  let header: Header
  try { header = JSON.parse(Buffer.from(h, 'base64').toString('utf8')) as Header } catch { return false }
  const kid = Number(header && typeof header.kid === 'number' ? header.kid : 0)
  const secrets = getSecrets()
  const secret = secrets[kid]
  if (!secret) return false
  const check = base64url(crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest())
  if (check !== s) return false
  // check exp if present
  try {
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8')) as { exp?: number; typ?: string; aud?: string | null; ver?: string | null }
    if (payload.typ !== 'otm_license') return false
    // Backward compatibility: accept tokens issued before aud/ver were added
    if (payload.aud != null && payload.aud !== 'otm-fpl') return false
    if (payload.ver != null && payload.ver !== 'v1') return false
    if (payload.exp && Date.now() / 1000 > payload.exp) return false
    return true
  } catch { return false }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as { token?: string }
  const token = body?.token || ''
  const ip = request.headers.get('x-forwarded-for') || 'local'
  if (!rateLimit(ip)) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })

  const secrets = getSecrets()
  if (!secrets.length || !token) return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  const valid = verifyToken(token)
  const res = NextResponse.json({ ok: valid })
  if (valid) {
    const oneYear = 60 * 60 * 24 * 365
    const proto = request.headers.get('x-forwarded-proto') || 'https'
    res.cookies.set('otm_paid', '1', { httpOnly: true, sameSite: 'lax', maxAge: oneYear, path: '/', secure: proto === 'https' })
  }
  return res
}


