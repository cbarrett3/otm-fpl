// Description: Apply Draft Society Top 50 ranks to data/app_bundle.json using a built-in mapping

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

type Entry = { rank: number; name: string; team: string }

const TOP50: Entry[] = [
  { rank: 1, name: 'Cole Palmer', team: 'CHE' },
  { rank: 2, name: 'Bukayo Saka', team: 'ARS' },
  { rank: 3, name: 'Mohamed Salah', team: 'LIV' },
  { rank: 4, name: 'Bruno Fernandes', team: 'MUN' },
  { rank: 5, name: 'Erling Haaland', team: 'MCI' },
  { rank: 6, name: 'Florian Wirtz', team: 'LIV' },
  { rank: 7, name: 'Alexander Isak', team: 'NEW' },
  { rank: 8, name: 'Jarrod Bowen', team: 'WHU' },
  { rank: 9, name: 'Matheus Cunha', team: 'MUN' },
  { rank: 10, name: 'Eberechi Eze', team: 'CRY' },
  { rank: 11, name: 'Viktor Gyokeres', team: 'ARS' },
  { rank: 12, name: 'Antoine Semenyo', team: 'BOU' },
  { rank: 13, name: 'Martin Odegaard', team: 'ARS' },
  { rank: 14, name: 'Bryan Mbeumo', team: 'MUN' },
  { rank: 15, name: 'Ollie Watkins', team: 'AVL' },
  { rank: 16, name: 'Amad Diallo', team: 'MUN' },
  { rank: 17, name: 'Daniel Munoz', team: 'CRY' },
  { rank: 18, name: 'Omar Marmoush', team: 'MCI' },
  { rank: 19, name: 'Hugo Ekitike', team: 'LIV' },
  { rank: 20, name: 'Anthony Gordon', team: 'NEW' },
  { rank: 21, name: 'Joao Pedro', team: 'CHE' },
  { rank: 22, name: 'Morgan Gibbs-White', team: 'NOT' },
  { rank: 23, name: 'Enzo Fernandez', team: 'CHE' },
  { rank: 24, name: 'Phil Foden', team: 'MCI' },
  { rank: 25, name: 'Antonee Robinson', team: 'FUL' },
  { rank: 26, name: 'Kaoru Mitoma', team: 'BHA' },
  { rank: 27, name: 'Dwight McNeil', team: 'EVE' },
  { rank: 28, name: 'Alex Iwobi', team: 'FUL' },
  { rank: 29, name: 'Mohammed Kudus', team: 'TOT' },
  { rank: 30, name: 'Declan Rice', team: 'ARS' },
  { rank: 31, name: 'Pedro Neto', team: 'CHE' },
  { rank: 32, name: 'Dominic Solanke', team: 'TOT' },
  { rank: 33, name: 'Savio', team: 'MCI' },
  { rank: 34, name: 'Mikkel Damsgaard', team: 'BRF' },
  { rank: 35, name: 'Yankuba Minteh', team: 'BHA' },
  { rank: 36, name: 'Pedro Porro', team: 'TOT' },
  { rank: 37, name: 'James Tarkowski', team: 'EVE' },
  { rank: 38, name: 'Cody Gakpo', team: 'LIV' },
  { rank: 39, name: 'Youri Tielemans', team: 'AVL' },
  { rank: 40, name: 'Jeremy Doku', team: 'MCI' },
  { rank: 41, name: 'Kevin Schade', team: 'BRF' },
  { rank: 42, name: 'Anthony Elanga', team: 'NEW' },
  { rank: 43, name: 'Jeremie Frimpong', team: 'LIV' },
  { rank: 44, name: 'Justin Kluivert', team: 'BOU' },
  { rank: 45, name: 'Morgan Rogers', team: 'AVL' },
  { rank: 46, name: 'Kai Havertz', team: 'ARS' },
  { rank: 47, name: 'Dominik Szoboszlai', team: 'LIV' },
  { rank: 48, name: 'Yoane Wissa', team: 'BRF' },
  { rank: 49, name: 'Virgil van Dijk', team: 'LIV' },
  { rank: 50, name: 'Rayan Ait-Nouri', team: 'MCI' },
]

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z\s\-']/g, '').replace(/\s+/g, ' ').trim()
}

type AppBundle = {
  generatedAt: string
  startEvent: number
  players: Array<{
    id: number
    name: string
    team: { shortName: string }
    draftSocietyTop50Rank?: number | null
    firstName?: string
    lastName?: string
  }>
}

async function main(): Promise<void> {
  const path = resolve(process.cwd(), '..', 'data', 'app_bundle.json')
  const bundle: AppBundle = JSON.parse(await readFile(path, 'utf8'))

  const byKey = new Map<string, number>()
  for (const p of bundle.players) {
    const variants = new Set<string>()
    const add = (v?: string) => v && variants.add(norm(v))
    add(p.name)
    add(p.firstName)
    add(p.lastName)
    if (p.firstName && p.lastName) add(`${p.firstName} ${p.lastName}`)
    for (const v of variants) {
      // Name-only matching to maximize coverage regardless of team moves
      byKey.set(v, p.id)
    }
  }

  const idToRank = new Map<number, number>()
  for (const e of TOP50) {
    const key = norm(e.name)
    const id = byKey.get(key)
    if (id) idToRank.set(id, e.rank)
  }

  for (const p of bundle.players) {
    const r = idToRank.get(p.id) ?? null
    p.draftSocietyTop50Rank = r
  }

  bundle.generatedAt = new Date().toISOString()
  await writeFile(path, JSON.stringify(bundle, null, 2), 'utf8')
  // eslint-disable-next-line no-console
  console.log(`Applied DraftSociety Top 50 ranks to ${idToRank.size} players`)
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


