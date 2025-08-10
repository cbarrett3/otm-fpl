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
        <motion.div
          className="flex flex-col items-center text-center mb-12"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <div className="relative h-48 sm:h-72 w-48 sm:w-72 flex items-center justify-center overflow-visible">
            <ArcText text="OVER THE MOON" radius={122} className="text-yellow-400/90 absolute left-1/2 -translate-x-1/2 -top-6 sm:-top-8 z-10 pointer-events-none" />
            <motion.div className="relative rounded-full ring-2 ring-yellow-400/40 p-3 sm:p-4 bg-black/30 backdrop-blur-sm z-0"
              animate={{ rotate: 360 }} transition={{ duration: 22, ease: 'linear', repeat: Infinity }}>
              <Image
                src="/otm-ball.svg"
                alt="OTM mark"
                width={176}
                height={176}
                priority
                className="h-32 w-32 sm:h-44 sm:w-44 object-contain opacity-95 drop-shadow-[0_10px_30px_rgba(255,255,255,0.18)]"
              />
            </motion.div>
          </div>
          <div className="relative mt-3">
            <motion.h1
              className="font-semibold text-yellow-400 -skew-x-6 tracking-wider leading-tight font-[var(--font-display)]"
              style={{ wordBreak: 'break-word' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
            >
              <span className="block text-[11vw] sm:text-6xl md:text-7xl bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_6px_20px_rgba(250,204,21,0.25)]">
                FPL Draftkit
              </span>
            </motion.h1>
          </div>
          <motion.p
            className="text-black/70 dark:text-white/70 mt-3 max-w-xl sm:max-w-2xl"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.45 }}
          >
            Built for draft day 2025/26. The only stripped‑back FPL draft kit: compare positions side‑by‑side, tap into live highlights and predicted XIs, shape a laser‑clean board, then export straight to Fantrax when you’re ready.
          </motion.p>
        </motion.div>

        <ul className="mx-auto max-w-2xl space-y-3">
          <li>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
              <Link prefetch href="/compare" className="group flex items-center justify-between px-6 py-5 rounded-xl bg-black/30 backdrop-blur-md hover:bg-black/40 ring-1 ring-white/15 transition">
                <span className="text-lg italic text-yellow-300 -skew-x-6 relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-yellow-400/80 after:w-0 group-hover:after:w-full after:transition-all">Compare players</span>
                <span className="text-yellow-400 opacity-70 group-hover:opacity-100 transition">→</span>
              </Link>
            </motion.div>
          </li>
          <li>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
              <Link prefetch href="/rankings" className="group flex items-center justify-between px-6 py-5 rounded-xl bg-black/30 backdrop-blur-md hover:bg-black/40 ring-1 ring-white/15 transition">
                <span className="text-lg italic text-yellow-300 -skew-x-6 relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-yellow-400/80 after:w-0 group-hover:after:w-full after:transition-all">Your rankings</span>
                <span className="text-yellow-400 opacity-70 group-hover:opacity-100 transition">→</span>
              </Link>
            </motion.div>
          </li>
          <li>
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55, duration: 0.4 }} whileHover={{ y: -2, scale: 1.01 }}>
              <Link prefetch href="/predicted" className="group flex items-center justify-between px-6 py-5 rounded-xl bg-black/30 backdrop-blur-md hover:bg-black/40 ring-1 ring-white/15 transition">
                <span className="text-lg italic text-yellow-300 -skew-x-6 relative after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:bg-yellow-400/80 after:w-0 group-hover:after:w-full after:transition-all">Predicted GW1 XIs</span>
                <span className="text-yellow-400 opacity-70 group-hover:opacity-100 transition">→</span>
              </Link>
            </motion.div>
          </li>
        </ul>
        {/* Minimal spec strip – street style */}
        <section className="mx-auto mt-10 max-w-5xl">
          <motion.div className="border-y border-white/10 py-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] uppercase tracking-wide text-white/70">
              {[
                ['Smart pairs', '/compare'],
                ['Predicted GW1', '/predicted'],
                ['Fantrax CSV', '/guides/fantrax-export'],
                ['Share/Sync', '/rankings'],
                ['No Accounts', '/privacy'],
                ['Fast on mobile', '/'],
              ].map(([t, href], i) => (
                <motion.a href={href}
                  key={i}
                  whileHover={{ y: -1 }}
                  className="relative cursor-pointer hover:text-yellow-300 after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-[1px] after:bg-yellow-400/70 after:scale-x-0 hover:after:scale-x-100 after:origin-left after:transition-transform"
                >
                  {t}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
