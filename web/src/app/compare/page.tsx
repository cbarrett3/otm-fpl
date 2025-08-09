// Description: Draft compare UI – show two players, one-click to prefer, update cookie-based ranking.
"use client"

import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
// removed button usage for card click selection
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { Button } from '@/components/ui/button'
import type { AppBundle, AppPlayer } from '@/lib/types'

function readBundleFromWindow(): AppBundle | null {
  // The page will fetch the JSON via fetch() on mount; SSR reads are not allowed in client.
  return null
}

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
  const write = React.useCallback((val: string) => {
    const d = new Date()
    d.setTime(d.getTime() + 365 * 24 * 60 * 60 * 1000)
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(val)}; expires=${d.toUTCString()}; path=/; SameSite=Lax`
    setValue(val)
  }, [name])
  return [value, write] as const
}

type RankingState = { order: number[] }

function parseRanking(json: string | null): RankingState {
  try { return json ? JSON.parse(json) as RankingState : { order: [] } } catch { return { order: [] } }
}

function computeQualityScore(player: AppPlayer): number {
  // Lower is better. Prefer Fantrax overall rank, then Draft Society rank, then last season points proxy.
  let score = Number.POSITIVE_INFINITY
  if (player.fantraxProjection?.overallRank != null) {
    score = Math.min(score, player.fantraxProjection.overallRank)
  }
  if (typeof player.draftSocietyTop50Rank === 'number') {
    score = Math.min(score, 50 + player.draftSocietyTop50Rank)
  }
  if (player.lastSeason?.totalPoints != null) {
    // Convert points (higher is better) into a rough rankish score in the ~100-500 range
    const bounded = Math.min(400, Math.max(0, player.lastSeason.totalPoints))
    score = Math.min(score, 500 - bounded)
  }
  return score
}

function pickPairSmart(
  players: AppPlayer[],
  ranking: RankingState,
  lastPair?: [number, number],
  topLimit: number = 120,
  focusStartIndex?: number | null
): [AppPlayer, AppPlayer] | null {
  if (players.length < 2) return null
  const byId = new Map<number, AppPlayer>()
  for (const p of players) byId.set(p.id, p)

  // 1) Focus on the top candidates by composite quality
  const sorted = players
    .map((p) => ({ p, q: computeQualityScore(p) }))
    .sort((a, b) => a.q - b.q)
    .slice(0, Math.min(topLimit, players.length))
    .map((x) => x.p)

  if (sorted.length < 2) return null

  const idToIndex = new Map<number, number>()
  sorted.forEach((p, i) => idToIndex.set(p.id, i))

  // Helper to filter a subset window (optionally current draft round focus)
  const inFocusWindow = (p: AppPlayer): boolean => {
    if (focusStartIndex == null) return true
    const idx = idToIndex.get(p.id)!
    return idx >= focusStartIndex && idx < focusStartIndex + 12
  }

  const focusSubset = sorted.filter(inFocusWindow)

  // 2) Try to refine adjacent items that the user already has in their ranking within the focus window
  const rankedInWindow = ranking.order.filter((id) => idToIndex.has(id))
  const chooseAdjacent = (candidates: AppPlayer[]): [AppPlayer, AppPlayer] | null => {
    const candidateIds = new Set(candidates.map((p) => p.id))
    const rankedSeq = rankedInWindow.filter((id) => candidateIds.has(id))
    if (rankedSeq.length < 2) return null
    // pick a random adjacent pair
    for (let tries = 0; tries < 20; tries++) {
      const i = Math.floor(Math.random() * (rankedSeq.length - 1))
      const aId = rankedSeq[i]
      const bId = rankedSeq[i + 1]
      if (aId === bId) continue
      if (lastPair && ((aId === lastPair[0] && bId === lastPair[1]) || (aId === lastPair[1] && bId === lastPair[0]))) continue
      const a = byId.get(aId)!
      const b = byId.get(bId)!
      return [a, b]
    }
    return null
  }

  // First try adjacent within focus round, then anywhere within top window
  let adjacent = focusSubset.length >= 2 ? chooseAdjacent(focusSubset) : null
  if (!adjacent) adjacent = chooseAdjacent(sorted)
  if (adjacent) return adjacent

  // 3) Mix one ranked with one unranked of similar quality to place newcomers
  const rankedSet = new Set(ranking.order)
  const unranked = sorted.filter((p) => !rankedSet.has(p.id))
  if (rankedInWindow.length >= 1 && unranked.length >= 1) {
    for (let tries = 0; tries < 30; tries++) {
      // Prefer a ranked id from the focus window if present
      const rankedPool = focusSubset.length ? focusSubset.filter((p) => rankedSet.has(p.id)) : sorted.filter((p) => rankedSet.has(p.id))
      const rId = (rankedPool.length ? rankedPool : sorted.filter((p) => rankedSet.has(p.id)))[Math.floor(Math.random() * (rankedPool.length ? rankedPool.length : rankedInWindow.length))]?.id ?? rankedInWindow[Math.floor(Math.random() * rankedInWindow.length)]
      const rIdx = idToIndex.get(rId)!
      // pick an unranked near the ranked player's index (within a small window)
      const window = 6
      const lo = Math.max(0, rIdx - window)
      const hi = Math.min(sorted.length - 1, rIdx + window)
      const unrankedPool = (focusSubset.length ? unranked.filter((p) => focusSubset.some((fp) => fp.id === p.id)) : unranked)
      const candidates = unrankedPool.filter((p) => {
        const idx = idToIndex.get(p.id)!
        return idx >= lo && idx <= hi
      })
      const other = (candidates.length ? candidates : unrankedPool)[Math.floor(Math.random() * (candidates.length ? candidates.length : unrankedPool.length))]
      const aId = rId
      const bId = other.id
      if (aId === bId) continue
      if (lastPair && ((aId === lastPair[0] && bId === lastPair[1]) || (aId === lastPair[1] && bId === lastPair[0]))) continue
      return [byId.get(aId)!, byId.get(bId)!]
    }
  }

  // 4) Fallback: pick two random from the top window, avoiding repeats
  const fallbackPool = focusSubset.length >= 2 ? focusSubset : sorted
  for (let tries = 0; tries < 30; tries++) {
    const a = fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
    const b = fallbackPool[Math.floor(Math.random() * fallbackPool.length)]
    if (a.id === b.id) continue
    if (lastPair && ((a.id === lastPair[0] && b.id === lastPair[1]) || (a.id === lastPair[1] && b.id === lastPair[0]))) continue
    return [a, b]
  }
  // Final fallback
  return [fallbackPool[0], fallbackPool[1]]
}

function updateRanking(current: number[], winner: number, loser: number): number[] {
  // Simple rule: ensure winner appears before loser; if absent, insert near top/bottom
  const arr = current.slice()
  const wi = arr.indexOf(winner)
  const li = arr.indexOf(loser)
  if (wi === -1 && li === -1) {
    arr.unshift(winner)
    arr.push(loser)
    return arr
  }
  if (wi === -1) {
    const pos = Math.max(0, li - 1)
    arr.splice(pos, 0, winner)
    return arr
  }
  if (li === -1) {
    arr.push(loser)
    return arr
  }
  if (wi > li) {
    arr.splice(wi, 1)
    const newLi = arr.indexOf(loser)
    arr.splice(newLi, 0, winner)
  }
  return arr
}

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  const chars = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '')
  return chars.join('') || 'PL'
}

// Approximate primary colors for clubs. Keyed by team.shortName.
const TEAM_COLORS: Record<string, string> = {
  ARS: '#EF0107',
  MUN: '#DA020E',
  CHE: '#034694',
  LIV: '#C8102E',
  MCI: '#6CABDD',
  NEW: '#241F20',
  CRY: '#1B458F',
  AVL: '#670E36',
  BOU: '#DA291C',
  BRE: '#E30613',
  WHU: '#7A263A',
  BHA: '#0057B8',
  EVE: '#003399',
  NFO: '#DD0000',
  TOT: '#132257',
  FUL: '#000000',
  WOL: '#FDB913',
  LEE: '#FFCD00',
  BRN: '#6C1D45', // Burnley
  SUN: '#E2231A',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const bigint = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function getReadableTextColor(bgHex: string): 'black' | 'white' {
  const { r, g, b } = hexToRgb(bgHex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? 'black' : 'white'
}

function TeamChip({ code }: { code: string }) {
  const bg = TEAM_COLORS[code] ?? '#666'
  const fg = getReadableTextColor(bg)
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-black/10"
      style={{ backgroundColor: bg, color: fg === 'white' ? 'white' : 'black' }}
      title={code}
    >
      {code}
    </span>
  )
}

function PlayerHeader({ p }: { p: AppPlayer }) {
  const hasImg = Boolean(p.images.card)
  if (hasImg) {
    return (
      <ImageWithFallback src={p.images.card!} alt={p.name} className="h-24 w-auto rounded bg-black/5 dark:bg-white/10" />
    )
  }
  // Fallback: branded SVG silhouette with team badge overlay and initials caption
  return (
    <div className="relative h-24 w-20">
      <ImageWithFallback src={undefined} alt="" className="h-24 w-20 rounded" />
      {p.team.badges?.badge50 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.team.badges.badge50}
          alt=""
          className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full ring-2 ring-black/10 dark:ring-white/10"
        />
      ) : null}
      <div className="absolute inset-0 flex items-end justify-center pb-1">
        <span className="text-[10px] font-semibold text-white/90 drop-shadow">{initials(p.name)}</span>
      </div>
    </div>
  )
}

export default function ComparePage() {
  const [bundle, setBundle] = useState<AppBundle | null>(readBundleFromWindow())
  const [rankCookie, setRankCookie] = useCookie('otm_ranking')
  const ranking = useMemo(() => parseRanking(rankCookie), [rankCookie])
  const [pair, setPair] = useState<[AppPlayer, AppPlayer] | null>(null)
  const roundCursorRef = useRef(0) // cycles 0..9 focusing each draft round window

  useEffect(() => {
    fetchBundle().then(setBundle).catch(console.error)
  }, [])

  useEffect(() => {
    if (!bundle) return
    const focusStart = roundCursorRef.current * 12
    setPair((prev) => pickPairSmart(bundle.players, ranking, prev ? [prev[0].id, prev[1].id] : undefined, 120, focusStart))
  }, [bundle, ranking])

  const onPick = (winner: AppPlayer, loser: AppPlayer) => {
    const nextOrder = updateRanking(ranking.order, winner.id, loser.id)
    setRankCookie(JSON.stringify({ order: nextOrder }))
    // advance pair
    if (bundle) {
      // rotate focus round to ensure coverage across first 10 rounds
      roundCursorRef.current = (roundCursorRef.current + 1) % 10
      const focusStart = roundCursorRef.current * 12
      setPair(pickPairSmart(bundle.players, { order: nextOrder }, [winner.id, loser.id], 120, focusStart))
    }
  }

  const handleSelect = (winner: AppPlayer, loser: AppPlayer) => {
    onPick(winner, loser)
  }

  if (!bundle || !pair) return <div className="p-8">Loading…</div>

  const [a, b] = pair

  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">FPL Draft Wizard</h1>
        <Button asChild variant="ghost" className="h-8 px-3">
          <a href="/rankings" aria-label="View your rankings">View Rankings</a>
        </Button>
      </div>
      <p className="mb-6 text-sm text-black/70 dark:text-white/70">
        Your picks and rankings are stored in browser cookies on this device. Do not clear cookies if you want to keep progress, and note rankings do not sync across devices.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {[a, b].map((p) => (
          <div
            key={p.id}
            role="button"
            onClick={() => handleSelect(p, p.id === a.id ? b : a)}
            className="rounded-lg border border-black/10 dark:border-white/15 hover:border-green-500/70 hover:ring-2 hover:ring-green-600/20 cursor-pointer transition p-4 flex flex-col h-full min-h-[420px]"
          >
            <div className="flex items-center gap-3 mb-4">
              <PlayerHeader p={p} />
              <div>
                <div className="text-lg font-medium flex items-center gap-2">
                  {p.name}
                  {typeof p.draftSocietyTop50Rank === 'number' ? (
                    <span
                      title={`Draft Society Top 50 #${p.draftSocietyTop50Rank}`}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-500 text-black text-[11px] font-semibold"
                    >
                      {p.draftSocietyTop50Rank}
                    </span>
                  ) : null}
                  {p.fantraxProjection ? (
                    <span
                      title={`Fantrax Overall #${p.fantraxProjection.overallRank}`}
                      className="ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 text-[11px] font-medium"
                    >
                      Fantrax #{p.fantraxProjection.overallRank}
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-black/60 dark:text-white/60 flex items-center gap-2">
                  <TeamChip code={p.team.shortName} />
                  <span>• {p.position}</span>
                  <span>• £{p.price.toFixed(1)}m</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <Stat label="Pts" value={p.lastSeason ? p.lastSeason.totalPoints : p.stats.points} />
              <Stat label="G" value={p.lastSeason ? p.lastSeason.goals : p.stats.goals} />
              <Stat label="A" value={p.lastSeason ? p.lastSeason.assists : p.stats.assists} />
              <Stat label="CS" value={p.lastSeason ? p.lastSeason.cleanSheets : p.stats.cleanSheets} />
              <Stat label="G/90" value={p.lastSeason ? p.lastSeason.per90.points != null ? p.lastSeason.per90.goals : null : p.stats.per90.goals} />
              <Stat label="A/90" value={p.lastSeason ? p.lastSeason.per90.points != null ? p.lastSeason.per90.assists : null : p.stats.per90.assists} />
            </div>
            {p.fantraxProjection ? (
              <div className="mt-3 rounded border border-yellow-500/50 bg-yellow-500/10 p-2">
                <div className="text-[10px] uppercase tracking-wide text-yellow-600 dark:text-yellow-400 mb-1">Fantrax projection</div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 bg-yellow-500 text-black px-2 py-0.5 rounded-full font-medium" title="Overall ranking among all players">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-black/20 text-[10px] font-semibold">{p.fantraxProjection.overallRank}</span>
                    Overall
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-500/40" title="Ranking at the player's position">
                    Pos #{p.fantraxProjection.posRank}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-500/40" title="Projected total points">
                    Pts {p.fantraxProjection.points.toFixed(0)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 border border-yellow-500/40" title="Projected points per 90 minutes">
                    PP/90 {p.fantraxProjection.pp90.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="mt-2 text-xs text-black/70 dark:text-white/70">
              {p.lastSeason ? (
                <>
                  Last season: {p.lastSeason.season} • Pts {p.lastSeason.totalPoints}, G {p.lastSeason.goals}, A {p.lastSeason.assists}
                  <div className="mt-1">Per 90: Pts {p.lastSeason.per90.points ?? '–'}, G {p.lastSeason.per90.goals ?? '–'}, A {p.lastSeason.per90.assists ?? '–'}</div>
                </>
              ) : (
                <>No prior season data found • Showing base profile only</>
              )}
            </div>
            <div className="mt-1 text-xs">
              Predicted GW1 XI: {p.predictedGW1 === true ? (
                <span className="text-green-600 dark:text-green-400">YES</span>
              ) : p.predictedGW1 === false ? (
                <span className="text-red-600 dark:text-red-400">NO</span>
              ) : (
                <span className="text-black/60 dark:text-white/60">Unknown</span>
              )}
              {p.gw1InjuryTag ? (
                <span className="ml-2 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide
                 border-black/15 dark:border-white/20 text-black/70 dark:text-white/70">
                  {p.gw1InjuryTag}
                </span>
              ) : null}
            </div>
            {p.highlight?.source === 'youtube' ? (
              <div className="mt-3">
                <YouTubeEmbed videoId={p.highlight.videoId} title={`${p.name} highlights`} />
              </div>
            ) : (
              <DynamicHighlight query={`${p.name} ${p.team.name} highlights`} />
            )}
            <div className="mt-3 text-xs text-black/60 dark:text-white/60">
              Next3: {p.upcoming.next3.map((f) => `${f.isHome ? 'H' : 'A'} ${f.opponent}${typeof f.difficulty === 'number' ? `(${f.difficulty})` : ''}`).join(' • ')}
            </div>
            <div className="mt-auto pt-4 text-xs text-black/50 dark:text-white/50">Click card to prefer</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded bg-black/5 dark:bg-white/10 p-2 text-center">
      <div className="text-[10px] uppercase tracking-wide text-black/60 dark:text-white/60">{label}</div>
      <div className="text-base font-medium">{value ?? '–'}</div>
    </div>
  )
}

function DynamicHighlight({ query }: { query: string }) {
  const [videoId, setVideoId] = React.useState<string | null>(null)
  const [queried, setQueried] = React.useState(false)
  React.useEffect(() => {
    let cancelled = false
    setQueried(false)
    fetch(`/api/highlights?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return
        if (d?.videoId) setVideoId(d.videoId)
        setQueried(true)
      })
      .catch(() => setQueried(true))
    return () => {
      cancelled = true
    }
  }, [query])

  if (videoId) {
    return (
      <div className="mt-3">
        <YouTubeEmbed videoId={videoId} title={`Highlights`} />
      </div>
    )
  }
  if (!queried) {
    return <VideoSkeleton />
  }
  return (
    <div className="mt-3 text-xs">
      <a
        className="underline"
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
        target="_blank"
        rel="noreferrer"
      >
        Search highlights on YouTube
      </a>
    </div>
  )
}

function VideoSkeleton() {
  return (
    <div className="mt-3 w-full aspect-video rounded border border-black/10 dark:border-white/15 bg-black/10 dark:bg-white/10 animate-pulse" />
  )
}

function YouTubeEmbed({ videoId, title }: { videoId: string; title: string }) {
  const [loaded, setLoaded] = React.useState(false)
  return (
    <div className="relative">
      {!loaded && <VideoSkeleton />}
      <iframe
        className={`w-full aspect-video rounded border border-black/10 dark:border-white/15 ${loaded ? '' : 'invisible absolute inset-0'}`}
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        onLoad={() => setLoaded(true)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
    </div>
  )
}


