// Description: Cookie helpers for ranking and drafted state.

export const RANKING_COOKIE = 'otm_ranking'
export const DRAFTED_COOKIE = 'otm_drafted'

export type RankingState = {
  // Array of player ids ordered best to worst (index = rank)
  order: number[]
}

export type DraftedState = {
  picked: number[] // set semantics
}

export function parseCookie(input: string | undefined): Record<string, string> {
  if (!input) return {}
  return input
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, pair) => {
      const idx = pair.indexOf('=')
      if (idx > -1) {
        const k = decodeURIComponent(pair.slice(0, idx))
        const val = decodeURIComponent(pair.slice(idx + 1))
        acc[k] = val
      }
      return acc
    }, {})
}

export function serializeCookie(name: string, value: string, days = 365): string {
  const d = new Date()
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${d.toUTCString()}`
  return `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${expires}; path=/; SameSite=Lax`
}




