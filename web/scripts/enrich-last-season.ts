// Description: Read data/app_bundle.json and enrich each player with last-season totals via FPL element-summary

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { z } from 'zod'

const ElementSummarySchema = z.object({
  history_past: z
    .array(
      z.object({
        season_name: z.string(),
        total_points: z.number(),
        minutes: z.number(),
        goals_scored: z.number(),
        assists: z.number(),
        clean_sheets: z.number(),
      })
    )
    .default([]),
})

type AppBundle = {
  generatedAt: string
  startEvent: number
  players: Array<{
    id: number
    lastSeason?: unknown
  }>
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-store', redirect: 'follow' })
  if (!res.ok) throw new Error(`Failed ${res.status} ${res.statusText} for ${url}`)
  return res.json()
}

async function main(): Promise<void> {
  const abs = resolve(process.cwd(), '..', 'data', 'app_bundle.json')
  const bundle: AppBundle = JSON.parse(await readFile(abs, 'utf8'))

  const concurrency = 16
  let index = 0
  const outPlayers = bundle.players.slice()

  async function worker() {
    while (index < outPlayers.length) {
      const i = index++
      const p = outPlayers[i]
      try {
        const raw = await fetchJson(`https://fantasy.premierleague.com/api/element-summary/${p.id}/`)
        const sum = ElementSummarySchema.parse(raw)
        const last = sum.history_past.at(-1) ?? null
        if (last) {
          const per90 = (value: number, minutes: number) => (minutes > 0 ? Number(((value / minutes) * 90).toFixed(3)) : null)
          ;(p as any).lastSeason = {
            season: last.season_name,
            totalPoints: last.total_points,
            minutes: last.minutes,
            goals: last.goals_scored,
            assists: last.assists,
            cleanSheets: last.clean_sheets,
            per90: {
              points: per90(last.total_points, last.minutes),
              goals: per90(last.goals_scored, last.minutes),
              assists: per90(last.assists, last.minutes),
            },
          }
        } else {
          ;(p as any).lastSeason = null
        }
      } catch (e) {
        // On failure, leave existing lastSeason untouched
        // eslint-disable-next-line no-console
        console.warn('summary failed for', p.id, e)
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()))

  const updated = { ...bundle, generatedAt: new Date().toISOString(), players: outPlayers }
  await writeFile(abs, JSON.stringify(updated, null, 2), 'utf8')
  // eslint-disable-next-line no-console
  console.log('Enriched lastSeason for players and updated app_bundle.json')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exitCode = 1
})


