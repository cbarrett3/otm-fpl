// Description: Lists predicted GW1 lineups (YES flags) grouped by team using annotated app_bundle.json.
"use client"

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { AppBundle, AppPlayer } from '@/lib/types'
import { getBundle } from '@/lib/bundle-store'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

// Use shared cached bundle loader

const POS_ORDER: Record<string, number> = { GKP: 0, DEF: 1, MID: 2, FWD: 3 }

export default function PredictedPage() {
  const [bundle, setBundle] = React.useState<AppBundle | null>(null)
  const router = useRouter()
  React.useEffect(() => { getBundle().then(setBundle).catch(console.error) }, [])
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
      <div className="mb-6 relative z-20">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-2xl font-semibold italic">
            <Link href="/" prefetch className="text-yellow-400 -skew-x-6 tracking-wider" aria-label="Go to Home" style={{ touchAction: 'manipulation' }}>
              OTM&nbsp;FPL
            </Link>
          </h1>
          <Button
            variant="ghost"
            className="rounded-full h-8 px-3 min-w-[132px] justify-center text-yellow-400"
            aria-label="Back"
            onClick={() => router.push('/compare')}
          >
            BACK
          </Button>
        </div>
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



