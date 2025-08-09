// Description: Minimal global footer with electric yellow top border and a rotating ticker.
"use client"

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function Footer(): React.ReactElement {
  const [idx, setIdx] = React.useState(0)
  const [items, setItems] = React.useState<string[]>([])
  React.useEffect(() => {
    fetch('/api/headlines')
      .then((r) => r.json())
      .then((d: { headlines?: Array<{ title?: string }> }) => {
        const list = Array.isArray(d?.headlines) ? d.headlines.map((h) => String(h.title ?? '')) : []
        if (list.length) setItems(list)
      })
      .catch(() => {})
    const id = setInterval(() => setIdx((i) => (i + 1) % Math.max(items.length, 1)), 4200)
    return () => clearInterval(id)
  }, [items.length])

  return (
    <footer className="mt-10 border-t border-yellow-400/60 bg-gradient-to-b from-yellow-400/5 to-transparent">
      <div className="mx-auto max-w-5xl px-6 py-4">
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
      </div>
    </footer>
  )
}


