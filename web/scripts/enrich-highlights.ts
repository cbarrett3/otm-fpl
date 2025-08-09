// Description: Enrich app_bundle.json with YouTube highlight video IDs per player using name+team search

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'

type AppBundle = {
  generatedAt: string
  startEvent: number
  players: Array<{
    id: number
    name: string
    team: { name: string; shortName: string }
    highlight?: { source: 'youtube'; videoId: string } | null
  }>
}

function queriesFor(p: { name: string; team: { name: string } }): string[] {
  const base = `${p.name} ${p.team.name}`
  return [
    `${base} highlights`,
    `${base} skills goals`,
    `${p.name} highlights`,
  ]
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .map((s) => encodeURIComponent(s))
}

async function fetchYouTubeId(q: string): Promise<string | null> {
  // Use YouTube no-cookie search via textise dot iitty (lightweight). As a fallback, return null.
  try {
    const url = `https://www.youtube.com/results?search_query=${q}`
    const res = await fetch(url, { cache: 'no-store', redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!res.ok) return null
    const html = await res.text()
    const m = html.match(/\"videoId\":\"([a-zA-Z0-9_-]{6,})\"/)
    return m ? m[1] : null
  } catch {
    return null
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, worker: (item: T, idx: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  async function run(): Promise<void> {
    for (;;) {
      const i = next++
      if (i >= items.length) break
      results[i] = await worker(items[i], i)
    }
  }
  const runners = Array.from({ length: Math.min(limit, items.length) }, () => run())
  await Promise.all(runners)
  return results
}

async function main(): Promise<void> {
  const path = resolve(process.cwd(), '..', 'data', 'app_bundle.json')
  const bundle: AppBundle = JSON.parse(await readFile(path, 'utf8'))

  const updated = { ...bundle }
  const targets = updated.players.filter((p) => !(p.highlight && p.highlight.videoId))
  const concurrency = 5
  let enriched = 0
  await mapWithConcurrency(targets, concurrency, async (p) => {
    const qs = queriesFor(p)
    let id: string | null = null
    for (const q of qs) {
      id = await fetchYouTubeId(q)
      if (id) break
      await delay(200)
    }
    if (id) {
      p.highlight = { source: 'youtube', videoId: id }
      enriched++
    }
  })

  updated.generatedAt = new Date().toISOString()
  await writeFile(path, JSON.stringify(updated, null, 2), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Enriched highlights for ${enriched} players`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


