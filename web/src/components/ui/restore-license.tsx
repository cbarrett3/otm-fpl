// Description: Small modal to paste a license token and activate it (sets paid cookie)
"use client"

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function RestoreLicense() {
  const [open, setOpen] = React.useState(false)
  const [token, setToken] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [msg, setMsg] = React.useState<string | null>(null)

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/license/activate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token: token.trim() })
      })
      const data = await res.json()
      if (data?.ok) {
        try { localStorage.setItem('otm_license', token.trim()) } catch {}
        setMsg('Activated. You can now continue making unlimited picks.')
      } else {
        setMsg(data?.error === 'rate_limited' ? 'Too many attempts. Please wait a minute and try again.' : 'Invalid token. Please check and try again.')
      }
    } catch {
      setMsg('Failed to activate. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="inline-block">
      <button className="text-xs underline text-white/70 cursor-pointer hover:text-yellow-300" onClick={() => setOpen(true)} title="Activate your license on this device">Restore purchase</button>
      <AnimatePresence>
        {open ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
            <motion.div
              className="relative w-[min(92vw,560px)] rounded-xl border border-yellow-400/50 bg-neutral-950 text-white shadow-[0_30px_80px_rgba(0,0,0,0.5)] p-4 sm:p-5"
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            >
              <div className="mb-3 text-lg font-medium">
                <span className="text-yellow-400">Restore purchase</span>
              </div>
              {msg ? (
                <div className="mb-3 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-200 text-sm px-3 py-2">{msg}</div>
              ) : null}
              <div className="mb-2 text-sm text-white/70">Paste your license token:</div>
              <textarea value={token} onChange={(e) => setToken(e.target.value)} className="w-full h-28 p-2 rounded bg-black/30 border border-white/15 text-sm" />
              <div className="mt-3 flex items-center gap-2">
                <Button className="h-9 px-4 cursor-pointer" onClick={submit} disabled={busy}>{busy ? 'Activating…' : 'Activate'}</Button>
                <Button className="h-9 px-3 cursor-pointer" variant="ghost" onClick={() => setOpen(false)}>Close</Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}


