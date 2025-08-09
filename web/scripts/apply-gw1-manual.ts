// Description: Apply manual GW1 predicted XI and injury tags to data/app_bundle.json from a curated JSON

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type ManualInput = {
  generatedAt?: string
  matches: Array<{
    home: string
    away: string
    homeXI: Array<{ name: string }>
    awayXI: Array<{ name: string }>
    injuries: Array<{ name: string; tag: 'OUT' | 'QUES' | 'SUS' }>
  }>
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z\s\-']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function variants(first?: string, last?: string, display?: string): string[] {
  const arr = new Set<string>()
  const add = (v?: string) => v && arr.add(norm(v))
  add(display)
  add(first)
  add(last)
  if (first && last) {
    add(`${first} ${last}`)
    add(`${last} ${first}`)
  }
  // last token from display (common on PL short names)
  if (display) {
    const parts = display.split(/\s+/)
    add(parts[parts.length - 1])
  }
  return Array.from(arr)
}

type AppBundle = {
  generatedAt: string
  startEvent: number
  players: Array<{ id: number; name: string; predictedGW1?: boolean | null; gw1InjuryTag?: 'OUT' | 'QUES' | 'SUS' | null }>
}

async function main(): Promise<void> {
  const dataDir = resolve(process.cwd(), '..', 'data')
  const manual: ManualInput = JSON.parse(await readFile(resolve(dataDir, 'gw1_manual.json'), 'utf8'))
  const bundlePath = resolve(dataDir, 'app_bundle.json')
  const bundle: AppBundle = JSON.parse(await readFile(bundlePath, 'utf8'))

  const startNames = new Set<string>()
  const injuryByName = new Map<string, 'OUT' | 'QUES' | 'SUS'>()
  for (const m of manual.matches) {
    for (const p of m.homeXI) startNames.add(norm(p.name))
    for (const p of m.awayXI) startNames.add(norm(p.name))
    for (const inj of m.injuries) injuryByName.set(norm(inj.name), inj.tag)
  }

  const updatedPlayers = bundle.players.map((p) => {
    const names = variants((p as any).firstName, (p as any).lastName, p.name)
    const predicted = names.some((n) => startNames.has(n))
    let inj: 'OUT' | 'QUES' | 'SUS' | null = null
    for (const n of names) {
      const v = injuryByName.get(n)
      if (v) { inj = v; break }
    }
    const predictedGW1 = predicted ? true : p.predictedGW1 ?? null
    return { ...p, predictedGW1, gw1InjuryTag: inj }
  })

  const updated = { ...bundle, generatedAt: new Date().toISOString(), players: updatedPlayers }
  await writeFile(bundlePath, JSON.stringify(updated, null, 2), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Applied manual GW1 data: starters ${startNames.size}, injuries ${injuryByName.size}`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


