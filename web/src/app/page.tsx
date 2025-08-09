// Description: Home page – minimal OTM FPL landing with branded wordmark and sleek action list.
"use client"

import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen p-8 sm:p-12">
      <main className="mx-auto max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <motion.img
            src="/otm-ball.svg"
            alt="OTM mark"
            className="h-12 w-12 cursor-pointer drop-shadow-[0_10px_20px_rgba(0,0,0,0.55)]"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
          />
          <h1 className="text-4xl sm:text-5xl font-semibold text-yellow-400 -skew-x-6 tracking-wider">OTM&nbsp;FPL&nbsp;Draftkit</h1>
        </div>
        <p className="text-black/70 dark:text-white/70 mb-10 max-w-2xl">A stripped‑back draft‑kit. Compare players, craft your board, export when you’re ready.</p>

        <ul className="divide-y divide-white/10 border border-white/10 rounded-xl overflow-hidden">
          <li>
            <a href="/compare" className="group flex items-center justify-between px-5 py-4 hover:bg-white/5 transition">
              <span className="text-lg">Compare players</span>
              <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          </li>
          <li>
            <a href="/rankings" className="group flex items-center justify-between px-5 py-4 hover:bg-white/5 transition">
              <span className="text-lg">Your rankings</span>
              <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          </li>
          <li>
            <a href="/predicted" className="group flex items-center justify-between px-5 py-4 hover:bg-white/5 transition">
              <span className="text-lg">Predicted GW1 XIs</span>
              <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition">→</span>
            </a>
          </li>
        </ul>
      </main>
    </div>
  );
}
