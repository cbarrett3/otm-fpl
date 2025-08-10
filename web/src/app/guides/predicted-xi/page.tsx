// Description: SEO guide – Predicted GW1 XIs methodology (2025/26)
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Predicted GW1 XIs – methodology (2025/26)',
  description: 'How OTM FPL Draftkit surfaces predicted GW1 starting lineups for 2025/26 and how to read the mini‑formation.',
  alternates: { canonical: '/guides/predicted-xi' },
}

export default function PredictedXiGuide() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 leading-relaxed">
      <h1 className="text-3xl font-semibold mb-4">Predicted GW1 XIs (2025/26)</h1>
      <p className="text-white/80 mb-6">
        OTM blends reputable lineup sources with manual curation to flag likely starters. When a player is tagged <strong>YES</strong>,
        you’ll see a mini‑formation and role (e.g., <em>MID 1/5</em>). Use this as a quick tiebreaker in early rounds.
      </p>
      <p className="text-white/70">View them live on <Link className="underline" href="/compare">Compare players</Link> or the <Link className="underline" href="/predicted">Predicted GW1 XIs</Link> page.</p>
    </div>
  )
}


