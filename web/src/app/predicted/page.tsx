// Description: Lists predicted GW1 lineups (YES flags) grouped by team using annotated app_bundle.json.
"use client"

import * as React from 'react'
import type { AppBundle, AppPlayer } from '@/lib/types'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

async function fetchBundle(): Promise<AppBundle> {
  const res = await fetch('/api/app-bundle', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load bundle')
  return res.json()
}

const POS_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }

export default function PredictedPage() {
  const [bundle, setBundle] = React.useState<AppBundle | null>(null)
  React.useEffect(() => { fetchBundle().then(setBundle).catch(console.error) }, [])
  if (!bundle) return <div className="p-8">Loading…</div>

  const grouped = new Map<number, AppPlayer[]>()
  for (const p of bundle.players) {
    if (p.predictedGW1 === true) {
      const arr = grouped.get(p.team.id) ?? []
      arr.push(p)
      grouped.set(p.team.id, arr)
    }
  }

  // Sort teams by name for stable output
  const teams = Array.from(grouped.entries())
    .map(([teamId, players]) => ({ teamId, teamName: players[0]?.team.name ?? String(teamId), players }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName))

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Predicted GW1 Lineups</h1>
        <a className="text-sm underline" href="/compare">Back to Compare</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {teams.map(({ teamId, teamName, players }) => {
          const ordered = players
            .slice()
            .sort((a, b) => (POS_ORDER[a.position] ?? 9) - (POS_ORDER[b.position] ?? 9) || a.name.localeCompare(b.name))
            .slice(0, 11)
          return (
            <section key={teamId} className="rounded border border-black/10 dark:border-white/15 p-3">
              <div className="mb-2 font-medium">{teamName} <span className="text-xs text-black/60 dark:text-white/60">({ordered.length} of 11)</span></div>
              <ol className="space-y-2">
                {ordered.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <ImageWithFallback src={p.images.avatar ?? undefined} alt="" className="h-5 w-5 rounded-full" />
                    <span>{p.name}</span>
                    <span className="text-xs text-black/60 dark:text-white/60">{p.position}</span>
                  </li>
                ))}
              </ol>
            </section>
          )
        })}
      </div>
    </div>
  )
}



