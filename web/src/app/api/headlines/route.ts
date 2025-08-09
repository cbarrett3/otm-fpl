// Description: Server route that fetches public football RSS feeds and returns top headlines (no API key).
import { NextResponse } from 'next/server'

type Headline = { title: string; link: string; pubDate?: string }

const SOURCES = [
  'https://feeds.bbci.co.uk/sport/football/rss.xml',
  'https://www.theguardian.com/football/rss',
]

function extractItems(xml: string): Headline[] {
  const items: Headline[] = []
  const itemRegex = /<item[\s\S]*?<\/item>/g
  const titleRegex = /<title>([\s\S]*?)<\/title>/
  const linkRegex = /<link>([\s\S]*?)<\/link>/
  const dateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/
  const strip = (s: string) => s.replace(/<!\[CDATA\[|\]\]>/g, '').trim()
  for (const m of xml.matchAll(itemRegex)) {
    const block = m[0]
    const title = block.match(titleRegex)?.[1]
    const link = block.match(linkRegex)?.[1]
    if (!title || !link) continue
    const pub = block.match(dateRegex)?.[1]
    items.push({ title: strip(title), link: strip(link), pubDate: pub ? strip(pub) : undefined })
  }
  return items
}

export async function GET() {
  try {
    const results: Headline[] = []
    for (const url of SOURCES) {
      const res = await fetch(url, { next: { revalidate: 900 } })
      if (!res.ok) continue
      const xml = await res.text()
      const items = extractItems(xml)
      results.push(...items)
    }
    // De-dupe by title
    const seen = new Set<string>()
    const deduped = results.filter((h) => {
      const key = h.title.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    // Sort by pubDate desc when available
    deduped.sort((a, b) => (new Date(b.pubDate ?? 0).getTime() - new Date(a.pubDate ?? 0).getTime()))
    const top = deduped.slice(0, 12)
    return NextResponse.json({ headlines: top }, { headers: { 'cache-control': 's-maxage=900, stale-while-revalidate=300' } })
  } catch {
    return NextResponse.json({ headlines: [] })
  }
}


