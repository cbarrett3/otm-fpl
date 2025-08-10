// Description: Draft compare UI – show two players, one-click to prefer, update cookie-based ranking.
"use client"

import * as React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
// removed button usage for card click selection
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { Button } from '@/components/ui/button'
import { RestoreLicense } from '@/components/ui/restore-license'
import { CopyLicenseButton } from '@/components/ui/copy-license'
import { PaywallDialog } from '@/components/ui/paywall-dialog'
import { FormationMini } from '@/components/ui/formation-mini'
import type { AppBundle, AppPlayer } from '@/lib/types'
import { getBundle } from '@/lib/bundle-store'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useFeature } from '@/lib/feature-flags'
// brand removed per request – simple wordmark instead
import LZString from 'lz-string'

function readBundleFromWindow(): AppBundle | null {
  // The page will fetch the JSON via fetch() on mount; SSR reads are not allowed in client.
  return null
}

// Shared cached bundle loader lives in bundle-store

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

// initials helper no longer used after header change

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
  // Compact avatar header; full-card background image is handled by the card container
  const src = p.images.avatar ?? p.images.card ?? undefined
  return (
    <div className="relative h-12 w-12">
      <ImageWithFallback src={src} alt="" className="h-12 w-12 rounded-full object-cover" />
    </div>
  )
}

export default function ComparePage() {
  const router = useRouter()
  const [bundle, setBundle] = useState<AppBundle | null>(readBundleFromWindow())
  const [rankCookie, setRankCookie] = useCookie('otm_ranking')
  const ranking = useMemo(() => parseRanking(rankCookie), [rankCookie])
  const [pair, setPair] = useState<[AppPlayer, AppPlayer] | null>(null)
  const roundCursorRef = useRef(0) // cycles 0..9 focusing each draft round window
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set())
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())
  const [choosingId, setChoosingId] = useState<number | null>(null)
  const [mobileVideoOpenId, setMobileVideoOpenId] = useState<number | null>(null)
  const [mobileVideoById, setMobileVideoById] = useState<Record<number, string>>({})
  const paidMode = useFeature('PAID_VERSION')
  const [picksCount, setPicksCount] = useState<number>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem('otm_picks_count') : null
    return v ? Number(v) || 0 : 0
  })
  const paidAllowedHost = process.env.NEXT_PUBLIC_PAID_HOST || ''
  function hostMatches(allowed: string, host: string): boolean {
    if (!allowed) return true
    const list = allowed.split(',').map((s) => s.trim()).filter(Boolean)
    const candidates = new Set<string>()
    for (const h of list) {
      candidates.add(h)
      candidates.add(h.replace(/^www\./, ''))
      candidates.add(h.startsWith('www.') ? h.slice(4) : `www.${h}`)
    }
    return candidates.has(host)
  }
  const [isPaid, setIsPaid] = useState<boolean>(false)
  const isPaidEnv = React.useMemo(() => {
    const host = typeof window !== 'undefined' ? window.location.hostname : ''
    const hostOk = paidAllowedHost ? hostMatches(paidAllowedHost, host) : true
    return paidMode && hostOk
  }, [paidMode, paidAllowedHost])

  useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => setIsPaid(Boolean(d?.paid))).catch(() => {})
  }, [])
  const [paywallOpen, setPaywallOpen] = useState(false)

  // Debug logs for paywall state
  useEffect(() => {
    try {
      console.log('[Paywall]', {
        paidMode,
        paidAllowedHost,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'n/a',
        isPaidEnv,
        isPaid,
        picksCount,
      })
    } catch {}
  }, [paidMode, paidAllowedHost, isPaidEnv, isPaid, picksCount])

  useEffect(() => {
    getBundle().then(setBundle).catch(console.error)
  }, [])
  // Warm rankings route so top-right button is instant
  useEffect(() => {
    try { router.prefetch('/rankings'); router.prefetch('/') } catch {}
  }, [router])

  // Inbound share link handling (hash r=...) – offer to replace or merge
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const m = hash.match(/[#&]r=([^&]+)/)
    if (!m) return
    try {
      const json = LZString.decompressFromEncodedURIComponent(m[1])
      const parsed = JSON.parse(json || '{}') as { order?: number[] }
      if (!Array.isArray(parsed.order)) return
      const incoming = parsed.order as number[]
      const current = ranking.order
      if (incoming.length === 0) return
      const proceed = confirm('Import shared ranking?\n\nOK = Replace mine\nCancel = Merge')
      if (proceed) {
        setRankCookie(JSON.stringify({ order: incoming }))
      } else {
        const set = new Set<number>()
        const merged: number[] = []
        for (const id of incoming) { if (!set.has(id)) { set.add(id); merged.push(id) } }
        for (const id of current) { if (!set.has(id)) { set.add(id); merged.push(id) } }
        setRankCookie(JSON.stringify({ order: merged }))
      }
      // cleanup hash so it doesn't re-trigger
      history.replaceState(null, '', window.location.pathname)
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applyFilters = React.useCallback((players: AppPlayer[]): AppPlayer[] => {
    const hasPos = selectedPositions.size > 0
    const hasTeam = selectedTeams.size > 0
    if (!hasPos && !hasTeam) return players
    return players.filter((p) => {
      const posOk = !hasPos || selectedPositions.has(p.position)
      const teamOk = !hasTeam || selectedTeams.has(p.team.shortName)
      return posOk && teamOk
    })
  }, [selectedPositions, selectedTeams])

  useEffect(() => {
    if (!bundle) return
    const focusStart = roundCursorRef.current * 12
    const pool = applyFilters(bundle.players)
    setPair((prev) =>
      pickPairSmart(pool, ranking, prev ? [prev[0].id, prev[1].id] : undefined, 120, focusStart)
    )
  }, [bundle, ranking, selectedPositions, selectedTeams, applyFilters])

  // Formation + slot helpers (must be before any early return)
  const teamIdToPredicted = React.useMemo(() => {
    const map = new Map<number, AppPlayer[]>()
    if (bundle) {
      for (const pl of bundle.players) {
        if (pl.predictedGW1 === true) {
          const arr = map.get(pl.team.id) ?? []
          arr.push(pl)
          map.set(pl.team.id, arr)
        }
      }
    }
    return map
  }, [bundle])

  function getFormationString(teamId: number): string | null {
    const list = teamIdToPredicted.get(teamId)
    if (!list || list.length === 0) return null
    const counts: Record<string, number> = { GKP: 0, DEF: 0, MID: 0, FWD: 0 }
    for (const pl of list) counts[pl.position] = (counts[pl.position] ?? 0) + 1
    if (counts.GKP === 0) return null
    return `${counts.DEF}-${counts.MID}-${counts.FWD}`
  }

  function getRowSlot(p: AppPlayer): string | null {
    const list = teamIdToPredicted.get(p.team.id)
    if (!list) return null
    const row = list.filter((x) => x.position === p.position).sort((a, b) => a.name.localeCompare(b.name))
    const idx = row.findIndex((x) => x.id === p.id)
    if (idx === -1) return null
    return `${p.position} ${idx + 1}/${row.length}`
  }

  const onPick = (winner: AppPlayer, loser: AppPlayer) => {
    // If paid mode is enabled and we are on the designated host, limit free picks to 25
    if (isPaidEnv && !isPaid && picksCount >= 25) {
      console.log('[Paywall] Triggering paywall at picksCount=', picksCount)
      setPaywallOpen(true)
      return
    }
    const nextOrder = updateRanking(ranking.order, winner.id, loser.id)
    setRankCookie(JSON.stringify({ order: nextOrder }))
    // Increment pick counter for paid gating
    if (isPaidEnv && !isPaid) {
      const next = picksCount + 1
      setPicksCount(next)
      try { localStorage.setItem('otm_picks_count', String(next)) } catch {}
      console.log('[Paywall] Increment picksCount →', next)
    }
    // advance pair
    if (bundle) {
      // rotate focus round to ensure coverage across first 10 rounds
      roundCursorRef.current = (roundCursorRef.current + 1) % 10
      const focusStart = roundCursorRef.current * 12
      const pool = applyFilters(bundle.players)
      setPair(pickPairSmart(pool, { order: nextOrder }, [winner.id, loser.id], 120, focusStart))
    }
  }

  const handleSelect = (winner: AppPlayer, loser: AppPlayer) => {
    // longer, more expressive animation before advancing
    setChoosingId(winner.id)
    setTimeout(() => {
      onPick(winner, loser)
      setChoosingId(null)
    }, 700)
  }

  // Build options (must be declared before any early return to satisfy hooks rules)
  const allPositions = useMemo(() => {
    const s = new Set<string>()
    bundle?.players.forEach((p) => s.add(p.position))
    return Array.from(s)
  }, [bundle])
  const allTeams = useMemo(() => {
    const s = new Set<string>()
    bundle?.players.forEach((p) => s.add(p.team.shortName))
    return Array.from(s).sort()
  }, [bundle])

  // reuse team colors from compare page for chips
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
    BRN: '#6C1D45',
    SUN: '#E2231A',
  }

  if (!bundle || !pair) return <div className="p-8">Loading…</div>

  const [a, b] = pair

  const toggleSet = (prev: Set<string>, key: string): Set<string> => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  }

  const clearFilters = () => { setSelectedPositions(new Set()); setSelectedTeams(new Set()) }

  function FilterChip({
    label,
    active,
    onClick,
    color,
  }: { label: string; active: boolean; onClick: () => void; color?: string }) {
    const activeStyles: React.CSSProperties | undefined = color
      ? { backgroundColor: `${color}33`, borderColor: color, color }
      : undefined
    return (
      <motion.button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={`cursor-pointer rounded-full border whitespace-nowrap px-4 py-2 md:px-4 md:py-2 text-base md:text-sm leading-none select-none ${
          active ? '' : 'border-white/20 text-white/80 hover:border-white/40'
        }`}
        style={active ? activeStyles : undefined}
      >
        {label}
      </motion.button>
    )
  }

  function MobileHighlightThumb({ p }: { p: AppPlayer }) {
    const [vid, setVid] = React.useState<string | null>(p.highlight?.videoId ?? mobileVideoById[p.id] ?? null)
    React.useEffect(() => {
      if (vid) return
      const query = `${p.name} ${p.team.name} highlights`
      fetch(`/api/highlights?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.videoId) {
            setVid(d.videoId)
            setMobileVideoById((prev) => ({ ...prev, [p.id]: d.videoId }))
          }
        })
        .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [p.id])
    if (!vid) return null
    return (
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setMobileVideoOpenId(mobileVideoOpenId === p.id ? null : p.id) }}
        className="md:hidden absolute right-3 top-3 z-30 rounded overflow-hidden border border-black/10 dark:border-white/15"
        aria-label="Play highlights"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://img.youtube.com/vi/${vid}/mqdefault.jpg`} alt="" className="h-14 w-20 object-cover" />
      </button>
    )
  }


  return (
    <div className="min-h-screen p-6 sm:p-10">
      <div className="mb-2 flex items-center justify-between gap-2 relative z-30">
        <h1 className="text-2xl font-semibold">
          <Link
            href="/"
            prefetch
            aria-label="Go to Home"
            onClick={(e) => { e.preventDefault(); router.push('/') }}
            className="cursor-pointer inline-block text-yellow-400 -skew-x-6 tracking-wider"
            style={{ touchAction: 'manipulation' }}
          >
            OTM&nbsp;FPL
          </Link>
        </h1>
        <div className="flex items-center gap-2">
          {/* Desktop filters – moved to full-width row below */}
          {/* Mobile filter button */}
          <Button className="md:hidden h-8 px-3" variant="ghost" onClick={() => setFiltersOpen(true)}>Filter</Button>
          <Button variant="ghost" className="h-8 px-3" aria-label="View your rankings" onClick={() => router.push('/rankings')}>
            View Rankings
          </Button>
          {isPaidEnv ? (
            <div className="hidden md:flex items-center gap-3 ml-2">
              <RestoreLicense />
              <span className="text-white/30">·</span>
              <CopyLicenseButton />
            </div>
          ) : null}
        </div>
      </div>
      {/* Desktop filters row (full width, larger chips, not under nav) */}
      <div className="hidden md:flex items-center gap-3 mt-3 relative z-20">
        <div className="flex items-center gap-2">
          {allPositions.map((pos) => (
            <FilterChip
              key={pos}
              label={pos}
              active={selectedPositions.has(pos)}
              onClick={() => setSelectedPositions((s) => toggleSet(s, pos))}
            />
          ))}
        </div>
        <div
          className="flex items-center gap-2 overflow-x-auto scrollbar-thin pr-24 whitespace-nowrap flex-1 py-1"
          style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {allTeams.map((t) => (
            <FilterChip
              key={t}
              label={t}
              active={selectedTeams.has(t)}
              onClick={() => setSelectedTeams((s) => toggleSet(s, t))}
              color={TEAM_COLORS[t] ?? '#22d3ee'}
            />
          ))}
        </div>
        {(selectedPositions.size || selectedTeams.size) ? (
          <button className="text-xs underline text-white/70 shrink-0" onClick={clearFilters}>Clear</button>
        ) : null}
      </div>
      <p className="mb-6 text-sm text-black/70 dark:text-white/70">
        Your ranking is saved locally on this device (cookies). Use <span className="text-yellow-400">Share/Sync</span> from the Rankings page to move it to another device. Avoid clearing cookies if you want to keep your progress.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {[a, b].map((p) => (
          <motion.div
            key={p.id}
            role="button"
            onClick={() => handleSelect(p, p.id === a.id ? b : a)}
            whileHover={{
              y: -4,
              scale: 1.01,
              boxShadow:
                '0 12px 28px rgba(0,0,0,0.35), 0 0 0 1px rgba(250,204,21,0.65), 0 0 14px rgba(250,204,21,0.28)'
            }}
            whileTap={{ scale: 0.98 }}
            animate={choosingId == null
              ? { scale: 1, opacity: 1, filter: 'none' }
              : (choosingId === p.id
                ? { scale: 1.08, y: -12, boxShadow: '0 0 0 4px rgba(255,255,255,0.40), 0 28px 60px rgba(0,0,0,0.55)' }
                : { opacity: 0.25, scale: 0.94, y: 10, filter: 'grayscale(45%) blur(1px)' })}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="group relative rounded-lg border border-black/10 dark:border-white/15 cursor-pointer transition p-4 flex flex-col h-full min-h-[300px] md:min-h-[420px] overflow-hidden"
          >
            {/* Background player image */}
            {p.images.card ? (
              <>
                <ImageWithFallback
                  src={p.images.card}
                  alt=""
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover object-top md:object-center opacity-20 md:opacity-25 blur-[1px] scale-110"
                />
                {/* Team color tint overlay (very subtle) */}
                {(() => {
                  const tint = (TEAM_COLORS as Record<string, string>)[p.team.shortName] ?? '#666666'
                  return (
                    <span
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background: `radial-gradient(120% 140% at 50% 0%, ${tint}26 0%, ${tint}1a 45%, transparent 75%)`,
                        mixBlendMode: 'screen' as React.CSSProperties['mixBlendMode']
                      }}
                    />
                  )
                })()}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
              </>
            ) : null}
            {/* Subtle electric border on hover */}
            <span className="pointer-events-none absolute inset-0 rounded-lg border border-yellow-300 opacity-0 group-hover:opacity-60 transition-opacity" />
            {choosingId === p.id ? (
              <motion.span
                className="pointer-events-none absolute inset-0 rounded-lg"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: [0.0, 0.4, 0], scale: 1.25 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                style={{
                  background:
                    'radial-gradient(closest-side, rgba(255,255,255,0.35), rgba(255,255,255,0.15) 60%, rgba(255,255,255,0) 70%)'
                }}
              />
            ) : null}
            <div className="relative z-10 flex items-center gap-3 mb-4">
              <PlayerHeader p={p} />
              <div>
                <div className="text-lg font-medium flex items-center gap-2">
                  {p.name}
                  {typeof p.draftSocietyTop50Rank === 'number' ? (
                    <span
                      title={`Draft Society consensus (Top 75) – #${p.draftSocietyTop50Rank}`}
                      className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-500 text-black text-[11px] font-semibold"
                    >
                      {p.draftSocietyTop50Rank}
                    </span>
                  ) : null}
                  {/* Removed green Fantrax overall chip near the name to avoid duplication */}
                </div>
                <div className="text-sm text-black/60 dark:text-white/60 flex items-center gap-2">
                  <TeamChip code={p.team.shortName} />
                  <span>• {p.position}</span>
                  <span>• £{p.price.toFixed(1)}m</span>
                </div>
                {/* Mobile quick chips (rank + PP/90) placed near top to avoid bottom crowding */}
                {p.fantraxProjection ? (
                  <div className="mt-2 flex md:hidden items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40" title={`Fantrax overall rank – #${p.fantraxProjection.overallRank}`}>
                      #{p.fantraxProjection.overallRank}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30" title="PP/90">
                      PP/90 {p.fantraxProjection.pp90.toFixed(2)}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            {/* Tiny video thumbnail (mobile) */}
            <MobileHighlightThumb p={p} />
            {/* Desktop core stats in-grid (not absolute) for clean layout */}
            <div className="grid grid-cols-3 gap-3 text-sm hidden md:grid">
              <Stat label="Pts" value={p.lastSeason ? p.lastSeason.totalPoints : p.stats.points} />
              <Stat label="G" value={p.lastSeason ? p.lastSeason.goals : p.stats.goals} />
              <Stat label="A" value={p.lastSeason ? p.lastSeason.assists : p.stats.assists} />
              <Stat label="CS" value={p.lastSeason ? p.lastSeason.cleanSheets : p.stats.cleanSheets} />
              <Stat label="G/90" value={p.lastSeason ? p.lastSeason.per90.points != null ? p.lastSeason.per90.goals : null : p.stats.per90.goals} />
              <Stat label="A/90" value={p.lastSeason ? p.lastSeason.per90.points != null ? p.lastSeason.per90.assists : null : p.stats.per90.assists} />
            </div>
            {/* Mobile quick chips */}
            {/* Moved mobile chips above; this block removed to prevent bottom crowding */}
            {/* Add mini season counters on mobile */}
            {(() => {
              const pts = p.lastSeason ? p.lastSeason.totalPoints : p.stats.points
              const g = p.lastSeason ? p.lastSeason.goals : p.stats.goals
              const aVal = p.lastSeason ? p.lastSeason.assists : p.stats.assists
              const cs = p.lastSeason ? p.lastSeason.cleanSheets : p.stats.cleanSheets
              const StatPill = ({ label, val }: { label: string; val: number }) => (
                <span className="pointer-events-none inline-flex flex-col items-center justify-center h-16 w-20 rounded-md border border-white/20 bg-black/45 backdrop-blur-sm text-white/90 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
                  <span className="text-lg font-semibold leading-5 text-white">{val}</span>
                  <span className="text-xs uppercase tracking-wide text-white/75">{label}</span>
                </span>
              )
              return (
                <div className="mt-2 md:hidden relative z-10 flex items-start justify-between gap-4 px-1">
                  <div className="flex flex-col gap-2">
                    <StatPill label="Pts" val={pts} />
                    <StatPill label="G" val={g} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <StatPill label="A" val={aVal} />
                    <StatPill label="CS" val={cs} />
                  </div>
                </div>
              )
            })()}
            {p.fantraxProjection ? (
              <div className="mt-3 rounded border border-yellow-500/50 bg-yellow-500/10 p-2 hidden md:block">
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
            <div className="mt-2 text-xs text-black/70 dark:text-white/70 hidden md:block">
              {p.lastSeason ? (
                <>
                  Last season: {p.lastSeason.season} • Pts {p.lastSeason.totalPoints}, G {p.lastSeason.goals}, A {p.lastSeason.assists}
                  <div className="mt-1">Per 90: Pts {p.lastSeason.per90.points ?? '–'}, G {p.lastSeason.per90.goals ?? '–'}, A {p.lastSeason.per90.assists ?? '–'}</div>
                </>
              ) : (
                <>No prior season data found • Showing base profile only</>
              )}
            </div>
            {/* Predicted lineup subtext */}
            <div className="mt-1 text-[11px] italic text-white/60">
              {(() => {
                const form = getFormationString(p.team.id)
                const slot = getRowSlot(p)
                if (!form && !slot) return null
                return <span>{form ? `Formation ${form}` : ''}{form && slot ? ' • ' : ''}{slot ? `Role ${slot}` : ''}</span>
              })()}
            </div>
            {/* Formation mini-map */}
            {p.predictedGW1 === true ? (
              <div className="mt-2 hidden md:block">
                {(() => {
                  const form = getFormationString(p.team.id)
                  const role = getRowSlot(p)
                  if (!form || !role) return null
                  return <FormationMini formation={form} playerPosition={p.position as 'GKP'|'DEF'|'MID'|'FWD'} role={role} aspectRatio="5 / 2" />
                })()}
              </div>
            ) : null}
            <div className="mt-1 text-xs relative z-20">
              Predicted GW1 XI: {p.predictedGW1 === true ? (
                <motion.span
                  initial={{ scale: 0.96, opacity: 0.95 }}
                  animate={{
                    scale: [1, 1.06, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(16,185,129,0.55)',
                      '0 0 0 10px rgba(16,185,129,0)',
                      '0 0 0 0 rgba(16,185,129,0)'
                    ],
                    opacity: 1,
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop', ease: 'easeOut' }}
                  className="ml-2 inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-2 py-0.5 border border-emerald-500/50 bg-emerald-500/15 text-emerald-300 font-semibold"
                  title="Predicted to start GW1"
                >
                  <span>🔥</span> YES
                </motion.span>
              ) : p.predictedGW1 === false ? (
                <motion.span
                  initial={{ scale: 0.96, opacity: 0.95 }}
                  animate={{
                    scale: [1, 1.04, 1],
                    boxShadow: [
                      '0 0 0 0 rgba(244,63,94,0.55)',
                      '0 0 0 10px rgba(244,63,94,0)',
                      '0 0 0 0 rgba(244,63,94,0)'
                    ],
                    opacity: 1,
                  }}
                  transition={{ duration: 1.6, repeat: Infinity, repeatType: 'loop', ease: 'easeOut' }}
                  className="ml-2 inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-2 py-0.5 border border-rose-500/50 bg-rose-500/15 text-rose-300 font-semibold"
                  title="Not expected to start GW1"
                >
                  <span>⛔</span> NO
                </motion.span>
              ) : (
                <span className="ml-2 inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-2 py-0.5 border border-white/20 bg-white/5 text-white/70">TBD</span>
              )}
              {p.gw1InjuryTag ? (
                <span className="ml-2 px-1.5 py-0.5 rounded border text-[10px] uppercase tracking-wide
                 border-black/15 dark:border-white/20 text-black/70 dark:text-white/70">
                  {p.gw1InjuryTag}
                </span>
              ) : null}
            </div>
            {/* Mobile compact formation */}
            {p.predictedGW1 === true ? (
              <div className="mt-2 md:hidden">
                {(() => {
                  const form = getFormationString(p.team.id)
                  const role = getRowSlot(p)
                  if (!form || !role) return null
                  return <FormationMini formation={form} playerPosition={p.position as 'GKP'|'DEF'|'MID'|'FWD'} role={role} aspectRatio="7 / 3" />
                })()}
              </div>
            ) : null}
            {/* Hide highlights and fixture details on mobile to fit two cards */}
            {(() => { const vid = p.highlight?.videoId ?? mobileVideoById[p.id]; return vid ? (
              <>
                <div className="mt-3 hidden md:block">
                  <YouTubeEmbed videoId={vid} title={`${p.name} highlights`} />
                </div>
                {/* Expanded video on mobile when tapped */}
                {mobileVideoOpenId === p.id ? (
                  <div className="mt-2 md:hidden">
                    <YouTubeEmbed videoId={vid} title={`${p.name} highlights`} />
                  </div>
                ) : null}
              </>
            ) : (
              <div className="hidden md:block">
                <DynamicHighlight query={`${p.name} ${p.team.name} highlights`} />
              </div>
            )})()}
            <div className="mt-2 md:mt-3 text-xs text-black/60 dark:text-white/60 hidden md:block">
              Next3: {p.upcoming.next3.map((f) => `${f.isHome ? 'H' : 'A'} ${f.opponent}${typeof f.difficulty === 'number' ? `(${f.difficulty})` : ''}`).join(' • ')}
            </div>
            <div className="mt-auto pt-2 md:pt-4 text-xs text-black/50 dark:text-white/50 hidden md:block">Click card to prefer</div>
          </motion.div>
        ))}
      </div>
      <PaywallDialog
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        onUnlock={async () => {
          const res = await fetch('/api/checkout', { method: 'POST' })
          const data = await res.json()
          if (!res.ok || !data?.url) {
            throw new Error(data?.error || 'Checkout unavailable')
          }
          window.location.href = data.url as string
        }}
      />
      {/* Mobile filters modal */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFiltersOpen(false)} />
          <div className="relative w-[min(92vw,560px)] max-h-[80vh] overflow-auto rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-zinc-900 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">Filters</h3>
              <button className="text-sm underline" onClick={clearFilters}>Clear</button>
            </div>
            <div className="mb-3">
              <div className="text-xs uppercase tracking-wide mb-1 text-black/60 dark:text-white/60">Positions</div>
              <div className="flex flex-wrap gap-2">
                {allPositions.map((pos) => (
                  <FilterChip
                    key={pos}
                    label={pos}
                    active={selectedPositions.has(pos)}
                    onClick={() => setSelectedPositions((s) => toggleSet(s, pos))}
                  />
                ))}
              </div>
            </div>
            <div className="mb-1">
              <div className="text-xs uppercase tracking-wide mb-1 text-black/60 dark:text-white/60">Teams</div>
              <div className="flex flex-wrap gap-2">
                {allTeams.map((t) => (
                  <FilterChip
                    key={t}
                    label={t}
                    active={selectedTeams.has(t)}
                    onClick={() => setSelectedTeams((s) => toggleSet(s, t))}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" className="h-8 px-3" onClick={() => setFiltersOpen(false)}>Close</Button>
              <Button className="h-10 px-4" onClick={() => setFiltersOpen(false)}>Apply</Button>
            </div>
          </div>
        </div>
      )}
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


