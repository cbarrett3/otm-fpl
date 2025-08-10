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
  const [selectedTeams, setSelectedTeams] = React.useState<Set<string>>(new Set())
  const router = useRouter()
  React.useEffect(() => { getBundle().then(setBundle).catch(console.error) }, [])

  const grouped = React.useMemo(() => {
    const map = new Map<number, AppPlayer[]>()
    if (!bundle) return map
    for (const p of bundle.players) {
      if (p.predictedGW1 === true) {
        const arr = map.get(p.team.id) ?? []
        arr.push(p)
        map.set(p.team.id, arr)
      }
    }
    return map
  }, [bundle])

  const allTeams = React.useMemo(() => {
    const s = new Set<string>()
    bundle?.players.forEach((p) => s.add(p.team.shortName))
    return Array.from(s).sort()
  }, [bundle])

  const toggleTeam = (code: string) => {
    setSelectedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  // Sort teams by name for stable output and apply filter
  const teams = React.useMemo(() => Array.from(grouped.entries())
    .map(([teamId, players]) => ({ teamId, teamName: players[0]?.team.name ?? String(teamId), players }))
    .sort((a, b) => a.teamName.localeCompare(b.teamName))
    .filter((t) => {
      if (selectedTeams.size === 0) return true
      const code = t.players[0]?.team.shortName
      return code ? selectedTeams.has(code) : true
    }), [grouped, selectedTeams])

  return (
    <div className="min-h-screen p-6 sm:p-10">
      {!bundle ? <div className="p-8">Loading…</div> : null}
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
        {/* Team filter chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {allTeams.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => toggleTeam(code)}
              className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${selectedTeams.has(code) ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10' : 'border-white/20 text-white/80 hover:border-white/40'}`}
              aria-pressed={selectedTeams.has(code)}
            >
              {code}
            </button>
          ))}
          {selectedTeams.size > 0 && (
            <button className="text-xs underline ml-1 text-white/70" onClick={() => setSelectedTeams(new Set())}>Clear</button>
          )}
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



