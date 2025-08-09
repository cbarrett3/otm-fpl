// Description: Thin client-side singleton to cache the app bundle across routes.
import type { AppBundle } from '@/lib/types'

let bundleData: AppBundle | null = null
let inflight: Promise<AppBundle> | null = null

export function primeBundle(data: AppBundle) {
  bundleData = data
}

export async function getBundle(): Promise<AppBundle> {
  if (bundleData) return bundleData
  if (inflight) return inflight
  inflight = fetch('/api/app-bundle', { cache: 'force-cache' })
    .then((r) => {
      if (!r.ok) throw new Error('Failed to load bundle')
      return r.json() as Promise<AppBundle>
    })
    .then((d) => {
      bundleData = d
      return d
    })
    .finally(() => { inflight = null })
  return inflight
}


