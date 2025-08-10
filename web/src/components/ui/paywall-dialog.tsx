// Description: Minimal, branded paywall dialog with yellow accents and Framer Motion animations.
"use client"

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { RestoreLicense } from '@/components/ui/restore-license'

type Props = {
  open: boolean
  onClose: () => void
  onUnlock: () => Promise<void>
}

export function PaywallDialog({ open, onClose, onUnlock }: Props): React.ReactElement {
  const [showRestore, setShowRestore] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleUnlock() {
    setError(null)
    setLoading(true)
    try {
      await onUnlock()
    } catch (e) {
      const msg = (e as { message?: string })?.message || 'Unable to start checkout. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-[min(92vw,560px)] rounded-xl border border-yellow-400/50 bg-neutral-950 text-white shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
            initial={{ y: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
          >
            <div className="p-4 sm:p-5">
              {error ? (
                <motion.div className="mb-3 rounded border border-rose-500/40 bg-rose-500/10 text-rose-200 text-sm px-3 py-2"
                  initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  {error}
                </motion.div>
              ) : null}
              <div className="mb-3 text-lg font-medium">
                <span className="text-yellow-400">Unlock Draftkit</span>
              </div>
              <p className="text-sm text-white/75 mb-4">
                Free preview reached (25 picks). Unlock the full Draftkit for <span className="text-yellow-300 font-semibold">$4.99</span> to continue.
              </p>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <Button className="h-9 px-4" onClick={handleUnlock} disabled={loading}>{loading ? 'Loading…' : 'Unlock $4.99'}</Button>
                <Button className="h-9 px-3" variant="ghost" onClick={() => setShowRestore((v) => !v)}>
                  {showRestore ? 'Hide restore' : 'Restore purchase'}
                </Button>
                <Button className="h-9 px-3" variant="ghost" onClick={onClose}>Not now</Button>
              </div>
              {showRestore ? (
                <div className="mt-2 border-t border-white/10 pt-3">
                  <RestoreLicense />
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}


