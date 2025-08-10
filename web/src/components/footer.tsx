// Description: Minimal global footer with electric yellow top border and a rotating ticker.
"use client"

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'

export function Footer(): React.ReactElement {
  const [idx, setIdx] = React.useState(0)
  const [items, setItems] = React.useState<string[]>([])
  const showLive = true
  React.useEffect(() => {
    if (showLive) {
      fetch('/api/headlines')
        .then((r) => r.json())
        .then((d: { headlines?: Array<{ title?: string }> }) => {
          const list = Array.isArray(d?.headlines) ? d.headlines.map((h) => String(h.title ?? '')) : []
          if (list.length) setItems(list)
        })
        .catch(() => {})
    } else {
      setItems([
        'Preseason watch: minutes matter more than goals',
        'Training camp notes: emerging set-piece takers to monitor',
        'Injury updates: verify status closer to GW1 deadline',
        'Draft tip: stack upside late; thin positions early',
        'Fixture focus: first 6 GWs drive early value',
      ])
    }
    const id = setInterval(() => setIdx((i) => (i + 1) % Math.max(items.length, 1)), 4200)
    return () => clearInterval(id)
  }, [items.length, showLive])

  return (
    <footer className="mt-10 border-t border-yellow-400/60 bg-gradient-to-b from-yellow-400/5 to-transparent">
      <div className="mx-auto max-w-5xl px-6 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[13px] text-white/70">
            <span className="text-yellow-400">⚡</span>
            <div className="relative h-5 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={idx + '-' + (items[idx] ?? '')}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="whitespace-nowrap"
                >
                  {items[idx] ?? 'Loading latest headlines…'}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <nav className="flex items-center gap-4 text-[13px]">
            <Link prefetch href="/compare" className="text-yellow-400/90 hover:text-yellow-300 -skew-x-6 cursor-pointer">Compare</Link>
            <Link prefetch href="/rankings" className="text-yellow-400/90 hover:text-yellow-300 -skew-x-6 cursor-pointer">Rankings</Link>
            <Link prefetch href="/predicted" className="text-yellow-400/90 hover:text-yellow-300 -skew-x-6 cursor-pointer">Predicted</Link>
            <Link prefetch href="/terms" className="text-yellow-400/90 hover:text-yellow-300 -skew-x-6 cursor-pointer">
              Terms
            </Link>
            <Link prefetch href="/privacy" className="text-yellow-400/90 hover:text-yellow-300 -skew-x-6 cursor-pointer">
              Privacy
            </Link>
            <a href="mailto:support@example.com" className="text-yellow-400/90 hover:text-yellow-300 -skew-x-6 cursor-pointer">Support</a>
            <span className="text-white/30">v1</span>
          </nav>
        </div>
      </div>
    </footer>
  )
}


