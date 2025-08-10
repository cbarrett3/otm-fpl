// Description: Home page – minimal OTM FPL landing with branded wordmark and sleek action list.
"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ArcText } from '@/components/ui/arc-text'

export default function Home() {
  return (
    <div className="min-h-screen px-6 pt-20 pb-14 sm:px-10 sm:pt-24 sm:pb-16">
      <main className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="relative h-48 sm:h-72 w-48 sm:w-72 flex items-center justify-center overflow-visible">
            <ArcText text="OVER THE MOON" radius={122} className="text-yellow-400/90 absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-8 z-10 pointer-events-none" />
            <motion.div
              className="rounded-full ring-2 ring-yellow-400/40 p-3 sm:p-4 bg-black/30 backdrop-blur-sm z-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
            >
              <Image
                src="/otm-ball.svg"
                alt="OTM mark"
                width={176}
                height={176}
                priority
                className="h-32 w-32 sm:h-44 sm:w-44 drop-shadow-[0_30px_60px_rgba(0,0,0,0.45)]"
              />
            </motion.div>
          </div>
          <h1 className="mt-3 font-semibold text-yellow-400 -skew-x-6 tracking-wider leading-tight"
              style={{ wordBreak: 'break-word' }}>
            <span className="block text-[11vw] sm:text-6xl md:text-7xl">FPL Draftkit</span>
          </h1>
          <p className="text-black/70 dark:text-white/70 mt-3 max-w-xl sm:max-w-2xl">A stripped‑back draft‑kit. Compare players, craft your board, export when you’re ready.</p>
        </div>

        <ul className="mx-auto max-w-2xl divide-y divide-yellow-400/10 border border-yellow-400/20 rounded-xl overflow-hidden">
          <li>
            <Link prefetch href="/compare" className="group flex items-center justify-between px-6 py-5 hover:bg-yellow-400/5 transition">
              <span className="text-lg italic text-yellow-300 -skew-x-6">Compare players</span>
              <span className="text-yellow-400 opacity-70 group-hover:opacity-100 transition">→</span>
            </Link>
          </li>
          <li>
            <Link prefetch href="/rankings" className="group flex items-center justify-between px-6 py-5 hover:bg-yellow-400/5 transition">
              <span className="text-lg italic text-yellow-300 -skew-x-6">Your rankings</span>
              <span className="text-yellow-400 opacity-70 group-hover:opacity-100 transition">→</span>
            </Link>
          </li>
          <li>
            <Link prefetch href="/predicted" className="group flex items-center justify-between px-6 py-5 hover:bg-yellow-400/5 transition">
              <span className="text-lg italic text-yellow-300 -skew-x-6">Predicted GW1 XIs</span>
              <span className="text-yellow-400 opacity-70 group-hover:opacity-100 transition">→</span>
            </Link>
          </li>
        </ul>
      </main>
    </div>
  );
}
