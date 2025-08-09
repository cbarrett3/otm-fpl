// Description: Simple rankings view that reads cookie-based ranking and shows ordered players.
"use client"

import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import type { AppBundle, AppPlayer } from '@/lib/types'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { Button } from '@/components/ui/button'

async function fetchBundle(): Promise<AppBundle> {
  const res = await fetch('/api/app-bundle', { cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load bundle')
  return res.json()
}

function useCookie(name: string) {
  const [value, setValue] = useState<string | null>(null)
  useEffect(() => {
    const cookies = document.cookie.split(';').map((c) => c.trim())
    const entry = cookies.find((c) => c.startsWith(`${encodeURIComponent(name)}=`))
    setValue(entry ? decodeURIComponent(entry.split('=')[1]) : null)
  }, [name])
  return value
}

type RankingState = { order: number[] }
function parseRanking(json: string | null): RankingState {
  try { return json ? JSON.parse(json) as RankingState : { order: [] } } catch { return { order: [] } }
}

function fantraxKey(p: AppPlayer): number {
  return p.fantraxProjection?.overallRank ?? 9999
}

function draftSocietyKey(p: AppPlayer): number {
  return typeof p.draftSocietyTop50Rank === 'number' ? p.draftSocietyTop50Rank : 9999
}

function lastSeasonKey(p: AppPlayer): number {
  // Lower is better; invert points so more points → smaller number
  const pts = p.lastSeason?.totalPoints
  return pts != null ? 1000 - Math.max(0, Math.min(pts, 1000)) : 9999
}

function computeConsensusOrder(players: AppPlayer[]): number[] {
  return players
    .slice()
    .sort((a, b) => {
      const fa = fantraxKey(a), fb = fantraxKey(b)
      if (fa !== fb) return fa - fb
      const da = draftSocietyKey(a), db = draftSocietyKey(b)
      if (da !== db) return da - db
      const la = lastSeasonKey(a), lb = lastSeasonKey(b)
      if (la !== lb) return la - lb
      return a.name.localeCompare(b.name)
    })
    .map((p) => p.id)
}

export default function RankingsPage() {
  const [bundle, setBundle] = useState<AppBundle | null>(null)
  const rankCookie = useCookie('otm_ranking')
  const initialOrder = useMemo(() => parseRanking(rankCookie).order, [rankCookie])
  const [order, setOrder] = useState<number[]>([])
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOverId, setDragOverId] = useState<number | null>(null)
  // drag state removed; we will use simple up/down controls

  useEffect(() => { fetchBundle().then(setBundle).catch(console.error) }, [])
  useEffect(() => { setOrder(initialOrder) }, [initialOrder])
  // Seed a default order (Fantrax → DraftSociety → last-season) if user has no ranking yet
  useEffect(() => {
    if (!bundle) return
    if (order.length === 0) {
      const seeded = computeConsensusOrder(bundle.players)
      commitOrder(seeded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bundle])
  if (!bundle) return <div className="p-8">Loading…</div>

  const byId = new Map<number, AppPlayer>(Array.isArray(bundle.players) ? bundle.players.map((p) => [p.id, p]) : [])
  const ranked = order.map((id) => byId.get(id)).filter(Boolean) as AppPlayer[]
  const unranked = (Array.isArray(bundle.players) ? bundle.players : []).filter((p) => !order.includes(p.id)).slice(0, 50)

  function toCsv(rows: string[][]): string {
    return rows.map((r) => r.map((c) => `"${(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  }

  function handleExportCsv() {
    if (!bundle) return
    const all = [...ranked, ...bundle.players.filter((p) => !order.includes(p.id))]
    const rows: string[][] = all.map((p: AppPlayer) => {
      const fullName = p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.name
      return [fullName, p.team.shortName]
    })
    const csv = toCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'fantrax_rankings.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function writeCookie(name: string, value: string) {
    const d = new Date(); d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000)
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
  }

  function deleteCookie(name: string) {
    document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`
  }

  function commitOrder(next: number[]) {
    setOrder(next)
    writeCookie('otm_ranking', JSON.stringify({ order: next }))
  }

  // no-op: previous DnD helper removed

  function moveUp(id: number) {
    const idx = order.indexOf(id)
    if (idx <= 0) return
    const next = order.slice()
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    commitOrder(next)
  }

  function moveDown(id: number) {
    const idx = order.indexOf(id)
    if (idx === -1 || idx >= order.length - 1) return
    const next = order.slice()
    ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
    commitOrder(next)
  }

  function roundIndex(position1Based: number): number {
    return Math.floor((position1Based - 1) / 12) // 0-based round
  }

  const ROUND_COLORS = ['#22c55e', '#06b6d4', '#f59e0b', '#ef4444', '#a855f7', '#10b981', '#3b82f6', '#eab308', '#f97316', '#14b8a6']

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <h1 className="hidden sm:block text-2xl font-semibold">Your Rankings</h1>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Button
                className="rounded-full h-10 sm:h-8 px-4 sm:px-3 min-w-[112px] justify-center"
                variant="ghost"
                onClick={handleExportCsv}
                title="Export a CSV formatted for Fantrax → Rankings → Import Rankings (First Last,TEAM)"
              >
                Export CSV
              </Button>
              <div className="pointer-events-none absolute left-0 top-[110%] hidden w-[240px] rounded border border-black/10 dark:border-white/15 bg-white/95 dark:bg-zinc-900/95 p-2 text-[11px] text-black/70 dark:text-white/70 shadow-lg group-hover:block">
                CSV is formatted for Fantrax: use Rankings → Import Rankings. Each row is &quot;First Last,TEAM&quot;.
              </div>
            </div>
            <Button
              variant="danger"
              className="rounded-full h-10 sm:h-8 px-4 sm:px-3 min-w-[112px] justify-center"
              onClick={() => setConfirmResetOpen(true)}
              title="Clear saved rankings and start over"
            >
              Start over
            </Button>
          </div>
        </div>
        <Button asChild variant="ghost" className="rounded-full h-10 sm:h-8 px-4 sm:px-3 min-w-[112px] justify-center ml-auto mt-1 sm:mt-0">
          <a href="/compare" aria-label="Back to compare" className="flex items-center gap-2">
            <span className="sm:hidden text-lg">←</span>
            <span className="hidden sm:inline">Back to Compare</span>
          </a>
        </Button>
      </div>
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmResetOpen(false)} />
          <div className="relative w-[min(92vw,520px)] rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 p-4 shadow-xl">
            <h3 className="text-lg font-medium mb-2">Reset rankings?</h3>
            <p className="text-sm text-black/70 dark:text-white/70 mb-4">This will clear your saved ranking cookie and restore the default consensus order.</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded border border-black/10 dark:border-white/15" onClick={() => setConfirmResetOpen(false)}>Cancel</button>
              <button
                className="px-3 py-1 rounded bg-red-600 text-white"
                onClick={() => {
                  if (!bundle) { setConfirmResetOpen(false); return }
                  deleteCookie('otm_ranking')
                  const seeded = computeConsensusOrder(bundle.players)
                  commitOrder(seeded)
                  setConfirmResetOpen(false)
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
      <ol className="mb-10 columns-1 sm:columns-2 lg:columns-3 gap-6 [column-fill:balance]">
        {ranked.map((p, idx) => (
          <li
            key={p.id}
            className={`mb-2 break-inside-avoid flex items-center gap-4 sm:gap-3 rounded p-3 sm:p-2 select-none w-full overflow-hidden`}
            style={{
              borderWidth: 1,
              borderStyle: 'solid',
              borderColor: 'var(--tw-border-color)',
              // colored left bar per round (slightly stronger)
              boxShadow: `inset 6px 0 0 0 ${ROUND_COLORS[roundIndex(idx + 1)]}66`,
              // normal border
              // use CSS variable inlined via casting to string index signature
              ...({ ['--tw-border-color']: 'rgba(255,255,255,0.15)' } as Record<string, string>)
            }}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'move'
              setDragId(p.id)
              setDragOverId(null)
            }}
            onDragOver={(e) => {
              e.preventDefault()
              if (dragOverId !== p.id) setDragOverId(p.id)
            }}
            onDragLeave={() => {
              if (dragOverId === p.id) setDragOverId(null)
            }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragId == null || dragId === p.id) { setDragId(null); setDragOverId(null); return }
              const a = dragId
              const b = p.id
              const next = order.slice()
              const ai = next.indexOf(a)
              const bi = next.indexOf(b)
              if (ai !== -1 && bi !== -1) {
                ;[next[ai], next[bi]] = [next[bi], next[ai]]
                commitOrder(next)
              }
              setDragId(null)
              setDragOverId(null)
            }}
            onDragEnd={() => { setDragId(null); setDragOverId(null) }}
          >
            <span className="w-8 sm:w-6 text-right text-base sm:text-sm text-black/60 dark:text-white/60">{idx + 1}</span>
            {idx % 12 === 0 ? (
              <span
                className="ml-1 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${ROUND_COLORS[roundIndex(idx + 1)]}33`, color: '#ccc' }}
                title={`Round ${roundIndex(idx + 1) + 1}`}
              >
                R{roundIndex(idx + 1) + 1}
              </span>
            ) : null}
            <ImageWithFallback src={p.images.avatar ?? undefined} alt="" className="h-8 w-8 sm:h-6 sm:w-6 rounded-full" />
            <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
              <span className={`truncate text-base sm:text-sm ${dragId === p.id ? 'opacity-70' : ''}`}>{p.name}</span>
              <span className="text-xs text-black/60 dark:text-white/60 whitespace-nowrap">{p.team.shortName} • {p.position}</span>
              {p.fantraxProjection?.pp90 != null ? (() => {
              const v = p.fantraxProjection!.pp90
              let cls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              if (v >= 12) cls = 'border-green-500/40 bg-green-500/10 text-green-400'
              else if (v >= 10) cls = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              else if (v >= 8) cls = 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              else cls = 'border-rose-500/40 bg-rose-500/10 text-rose-300'
              return (
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] sm:text-[11px] whitespace-nowrap ${cls}`}
                  title="Projected points per 90"
                >
                  PP/90 {v.toFixed(2)}
                </span>
              )
            })() : null}
            </div>
            <span className={`ml-auto shrink-0 flex items-center gap-2 sm:gap-1 ${dragOverId === p.id && dragId != null ? 'ring-2 ring-emerald-500/40 rounded' : ''}`}> 
              <button
                className="h-10 w-10 sm:h-7 sm:w-7 rounded-md border border-black/10 dark:border-white/15 hover:bg-green-500/10 text-green-600 dark:text-green-400 cursor-pointer flex items-center justify-center text-lg sm:text-base"
                aria-label="Move up"
                onClick={() => moveUp(p.id)}
              >
                ↑
              </button>
              <button
                className="h-10 w-10 sm:h-7 sm:w-7 rounded-md border border-black/10 dark:border-white/15 hover:bg-red-500/10 text-red-600 dark:text-red-400 cursor-pointer flex items-center justify-center text-lg sm:text-base"
                aria-label="Move down"
                onClick={() => moveDown(p.id)}
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>

      <h2 className="text-lg font-medium mb-3">Unranked suggestions</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {unranked.map((p) => (
          <li key={p.id} className="text-sm">
            {p.name} <span className="text-black/50 dark:text-white/50">({p.team.shortName})</span>
          </li>
        ))}
      </ul>
    </div>
  )
}


