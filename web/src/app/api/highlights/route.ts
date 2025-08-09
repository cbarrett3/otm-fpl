// Description: API route that returns a best-effort YouTube videoId for a given query.
// No API key required – uses lightweight scraping of YouTube search HTML.

import { NextResponse } from 'next/server'

async function fetchViaScrape(query: string): Promise<string | null> {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'Mozilla/5.0' } })
  if (!res.ok) return null
  const html = await res.text()
  const m = html.match(/\"videoId\":\"([a-zA-Z0-9_-]{6,})\"/)
  return m ? m[1] : null
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({ videoId: null }, { status: 400 })

  let videoId: string | null = null
  try {
    videoId = await fetchViaScrape(q)
  } catch {}
  return NextResponse.json({ videoId })
}


