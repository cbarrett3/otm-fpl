// Description: Returns simple paid status based on cookie set by /api/verify
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const cookie = (request.headers.get('cookie') || '').split(';').map((s) => s.trim())
  const paid = cookie.some((c) => c.startsWith('otm_paid=1'))
  // Do NOT trust any client-set values beyond exact match. Optionally check license presence.
  const hasLic = cookie.some((c) => c.startsWith('otm_lic='))
  return NextResponse.json({ paid })
}


