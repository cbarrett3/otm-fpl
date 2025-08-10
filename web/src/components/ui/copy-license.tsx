// Description: Button to copy the stored license token from localStorage, with modal fallback and feedback
"use client"

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export function CopyLicenseButton(): React.ReactElement {
  const [copied, setCopied] = React.useState(false)
  const [paid, setPaid] = React.useState<boolean | null>(null)
  const [exp, setExp] = React.useState<string | null>(null)
  const [showToken, setShowToken] = React.useState(false)
  const [tokenText, setTokenText] = React.useState('')

  React.useEffect(() => {
    fetch('/api/me').then((r) => r.json()).then((d) => setPaid(Boolean(d?.paid))).catch(() => setPaid(null))
    try {
      const token = localStorage.getItem('otm_license') || ''
      if (token) {
        const parts = token.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1])) as { exp?: number }
          if (payload?.exp) {
            const dt = new Date(payload.exp * 1000)
            setExp(dt.toLocaleDateString())
          }
        }
        setTokenText(token)
      }
    } catch {}
  }, [])
  const onCopy = async () => {
    const token = localStorage.getItem('otm_license') || ''
    if (!token) { setCopied(false); setShowToken(true); return }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(token)
        setCopied(true); setTimeout(() => setCopied(false), 1500)
      } else {
        const ta = document.createElement('textarea')
        ta.value = token
        ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.focus(); ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1500) }
        else { setShowToken(true) }
      }
    } catch { setShowToken(true) }
  }
  return (
    <div className="flex items-center gap-2 text-xs text-white/70">
      <span className={paid ? 'text-emerald-300' : 'text-white/50'}>{paid ? 'Paid' : 'Free'}</span>
      {exp ? <span className="text-white/50">• Expires {exp}</span> : null}
      <button className="underline cursor-pointer hover:text-yellow-300 active:opacity-80 transition-colors" onClick={onCopy} title="Copy your license token">
        {copied ? 'Copied' : 'Copy token'}
      </button>
      <AnimatePresence>
        {showToken ? (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="absolute inset-0 bg-black/60" onClick={() => setShowToken(false)} />
            <motion.div
              className="relative w-[min(92vw,560px)] rounded-xl border border-yellow-400/50 bg-neutral-950 text-white p-4 shadow-[0_30px_80px_rgba(0,0,0,0.5)]"
              initial={{ y: 20, scale: 0.95, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 10, scale: 0.98, opacity: 0 }}
            >
              <div className="mb-2 text-lg font-medium text-yellow-400">Your license token</div>
              {tokenText ? (
                <textarea readOnly value={tokenText} className="w-full h-28 p-2 rounded bg-black/30 border border-white/15 text-sm" />
              ) : (
                <div className="text-sm text-white/70 mb-2">
                  No token found on this device. Tokens are saved after a successful checkout. If you purchased on another device, use “Restore purchase” to activate with your token, then return here to copy it.
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button className="h-9 px-4 rounded bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 cursor-pointer disabled:opacity-50" disabled={!tokenText} onClick={async () => { await onCopy(); if (navigator.clipboard) setShowToken(false) }}>Copy</button>
                <button className="h-9 px-3 rounded border border-white/20 cursor-pointer" onClick={() => setShowToken(false)}>Close</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}


