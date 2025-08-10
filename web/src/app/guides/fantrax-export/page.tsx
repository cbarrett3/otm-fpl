// Description: SEO guide – How to export OTM rankings to Fantrax (2025/26)
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'How to export OTM FPL Draftkit rankings to Fantrax (2025/26)',
  description:
    'Step‑by‑step guide to exporting your OTM FPL Draftkit board to Fantrax for the 2025/26 season – CSV format, import steps, and tips.',
  alternates: { canonical: '/guides/fantrax-export' },
}

export default function FantraxExportGuide() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 leading-relaxed">
      <h1 className="text-3xl font-semibold mb-4">Export OTM rankings to Fantrax (2025/26)</h1>
      <p className="text-white/80 mb-6">
        OTM FPL Draftkit exports a CSV that Fantrax accepts out of the box. Follow these quick steps on draft day.
      </p>
      <ol className="list-decimal pl-6 space-y-3">
        <li>From <Link className="underline" href="/rankings">Your rankings</Link>, click <strong>Export CSV</strong>.</li>
        <li>In Fantrax, open <strong>Rankings → Import Rankings</strong>.</li>
        <li>Upload the CSV. Each row is <code className="px-1 py-0.5 rounded bg-white/10">First Last,TEAM</code>.</li>
        <li>Confirm and save. Your draft board updates instantly.</li>
      </ol>
      <h2 className="text-2xl font-semibold mt-8 mb-2">Tips</h2>
      <ul className="list-disc pl-6 space-y-2">
        <li>Use OTM on mobile during the draft – the UI is tuned for quick comparisons.</li>
        <li>Share/Sync your board between devices from the Rankings page.</li>
        <li>Predicted XIs and highlights live on the <Link className="underline" href="/compare">Compare</Link> view.</li>
      </ul>
      <p className="mt-8 text-white/70">Need help? Ping Support from the footer.</p>
    </div>
  )
}


