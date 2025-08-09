// Description: Scrape predicted GW1 lineups from Sportsgambler and annotate app_bundle.json with predictedGW1 flags

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' })
  if (!res.ok) throw new Error(`Failed ${res.status} ${res.statusText} for ${url}`)
  return res.text()
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z\s\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

type AppBundle = {
  generatedAt: string
  startEvent: number
  players: Array<{ id: number; name: string; position: string; team: { id: number; name: string; shortName: string }; predictedGW1?: boolean | null }>
}

async function main(): Promise<void> {
  const url = 'https://www.sportsgambler.com/lineups/football/england-premier-league/'
  const html = await fetchHtml(url)

  // Heuristic parse: extract player names within lineup blocks
  // Note: site structure can change; this is a best-effort simple parser using regex text extraction.
  const nameRegex = />([A-Z][A-Za-z'\-]+(?:\s+[A-Z][A-Za-z'\-]+)*)<\/a>/g
  const foundNames = new Set<string>()
  for (const m of html.matchAll(nameRegex)) {
    const raw = m[1]
    if (raw) foundNames.add(normalizeName(raw))
  }

  const abs = resolve(process.cwd(), '..', 'data', 'app_bundle.json')
  const bundle: AppBundle = JSON.parse(await readFile(abs, 'utf8'))

  // Build quick lookup on normalized player display name
  const foundArr = Array.from(foundNames)
  const players = bundle.players.map((p) => {
    const norm = normalizeName(p.name)
    const predicted = foundNames.has(norm) || foundArr.some((n) => n.endsWith(` ${norm}`) || n === norm || norm.endsWith(` ${n}`))
    return { ...p, predictedGW1: predicted }
  })

  const updated = { ...bundle, generatedAt: new Date().toISOString(), players }
  await writeFile(abs, JSON.stringify(updated, null, 2), 'utf8')
  // Build predicted lineups JSON grouped by team using annotated bundle
  const POS_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }
  const groups = new Map<number, { teamId: number; teamName: string; players: { id: number; name: string; position: string }[] }>()
  for (const p of updated.players) {
    if (p.predictedGW1 === true) {
      const g = groups.get(p.team.id) ?? { teamId: p.team.id, teamName: p.team.name, players: [] }
      g.players.push({ id: p.id, name: p.name, position: p.position })
      groups.set(p.team.id, g)
    }
  }
  const lineups = Array.from(groups.values()).map((g) => ({
    teamId: g.teamId,
    teamName: g.teamName,
    players: g.players
      .slice()
      .sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9) || a.name.localeCompare(b.name))
  }))

  const predictedPath = resolve(process.cwd(), '..', 'data', 'predicted_gw1.json')
  await writeFile(
    predictedPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), source: 'sportsgambler.com (parsed HTML)', lineups }, null, 2),
    'utf8'
  )
  // eslint-disable-next-line no-console
  console.log(`Annotated predictedGW1 using ${foundNames.size} scraped names and wrote predicted_gw1.json for ${lineups.length} teams`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


