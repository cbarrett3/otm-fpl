// Description: Minimal street-cool brand mark with abstract Fantrax/EPL-inspired icons and an OTM FPL wordmark.
"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import * as React from 'react'

export function BrandMark({ className }: { className?: string }) {
  return (
    <Link href="/compare" prefetch aria-label="OTM FPL – go to home" className={className} style={{ touchAction: 'manipulation' }}>
      <motion.div
        whileHover={{ rotate: -1, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="inline-flex items-center gap-3"
      >
        {/* Abstract Fantrax-like hex mark */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-cyan-400">
          <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M12 5 L17 8 L12 11 L7 8 Z" fill="currentColor" opacity="0.25" />
        </svg>
        {/* Abstract EPL-like crown mark */}
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden className="text-purple-400">
          <path d="M3 16 L6 9 L9 12 L12 7 L15 12 L18 9 L21 16 Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          <rect x="5" y="16" width="14" height="3" rx="1.5" fill="currentColor" opacity="0.2" />
        </svg>
        <span className="select-none inline-block font-semibold uppercase tracking-wider text-yellow-400 -skew-x-6">
          OTM&nbsp;FPL
        </span>
      </motion.div>
    </Link>
  )
}


