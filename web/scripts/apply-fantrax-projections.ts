// Description: Apply Fantrax-like projections (overall rank, pos rank, points, pp90) from a built-in table

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Row = { name: string; team?: string; overall: number; posRank: number; points: number; pp90: number }

async function loadRows(): Promise<Row[]> {
  const tablePath = resolve(process.cwd(), 'scripts', 'data', 'fantrax_table.txt')
  const raw = await readFile(tablePath, 'utf8')
  const rows: Row[] = []
  const lineRegex = /^(\d+)\s+(\d+)\s+\d+\s+\d+\s+(.+?)\s+[A-Z]{3}\s+[A-Z]\s+([0-9]+\.[0-9]+)\s+[0-9]+\.[0-9]+\s+([0-9]+\.[0-9]+)/
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const m = trimmed.match(lineRegex)
    if (!m) continue
    const overall = Number(m[1])
    const posRank = Number(m[2])
    const name = m[3].trim()
    const points = Number(m[4])
    const pp90 = Number(m[5])
    if (Number.isFinite(overall) && Number.isFinite(posRank) && Number.isFinite(points) && Number.isFinite(pp90)) {
      rows.push({ name, overall, posRank, points, pp90 })
    }
  }
  return rows
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z\s\-']/g, '').replace(/\s+/g, ' ').trim()
}

type AppBundle = {
  generatedAt: string
  startEvent: number
  players: Array<{
    id: number
    name: string
    fantraxProjection?: { overallRank: number; posRank: number; points: number; pp90: number } | null
    firstName?: string
    lastName?: string
  }>
}

async function main(): Promise<void> {
  const path = resolve(process.cwd(), '..', 'data', 'app_bundle.json')
  const bundle: AppBundle = JSON.parse(await readFile(path, 'utf8'))

  const DATA = await loadRows()

  const byKey = new Map<string, number>()
  for (const p of bundle.players) {
    const variants = new Set<string>()
    const add = (v?: string) => v && variants.add(norm(v))
    add(p.name)
    add(p.firstName)
    add(p.lastName)
    if (p.firstName && p.lastName) add(`${p.firstName} ${p.lastName}`)
    for (const v of variants) byKey.set(v, p.id)
  }

  let applied = 0
  for (const r of DATA) {
    const id = byKey.get(norm(r.name))
    if (!id) continue
    const p = bundle.players.find((pl) => pl.id === id)!
    p.fantraxProjection = { overallRank: r.overall, posRank: r.posRank, points: r.points, pp90: r.pp90 }
    applied++
  }

  bundle.generatedAt = new Date().toISOString()
  await writeFile(path, JSON.stringify(bundle, null, 2), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Applied Fantrax projections to ${applied} players`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


