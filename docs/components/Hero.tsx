'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#000000] flex items-center justify-center overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-br from-white/[0.03] via-blue-500/[0.02] to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center"
        >
          {/* Main headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-8">
            Make human data{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              trainable
            </span>
            —legally and at scale
          </h1>

          {/* Divider */}
          <div className="w-12 h-px bg-white/20 mx-auto mb-8" />

          {/* Subheadline */}
          <p className="text-base md:text-lg text-[#a1a1a1] max-w-2xl mx-auto leading-relaxed mb-10">
            Under GDPR and the EU AI Act, many teams can&apos;t train on raw internal data.
            Verifily converts it into privacy-safe synthetic datasets—typically expanding
            it 5–10×—so you can train without exposing the original.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-10">
            <Link href="/pilot">
              <button className="h-12 px-8 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full hover:opacity-90 transition-opacity">
                Request a pilot
              </button>
            </Link>
            <button
              onClick={() => {
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="h-12 px-8 text-sm font-medium text-white border border-[#333] rounded-full hover:border-[#555] hover:bg-white/[0.03] transition-all"
            >
              How it works
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#666]">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">&#10003;</span> 5–10× Dataset Expansion
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">&#10003;</span> GDPR & EU AI Act Ready
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500">&#10003;</span> Privacy-Safe Synthetic Data
            </span>
          </div>
        </motion.div>

        {/* Data flow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-20 w-full max-w-3xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-4 md:gap-6 items-center">
            {/* Input */}
            <div className="bg-[#0a0a0a] border border-[#222] rounded-xl text-center p-6 md:p-8">
              <div className="text-2xl md:text-3xl font-bold text-white mb-2">1M</div>
              <div className="text-xs text-[#888]">Human examples</div>
              <div className="text-[10px] text-[#555] mt-1">(internal data)</div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl text-[#3b82f6]">&rarr;</div>
              <div className="text-[10px] text-[#666] text-center">Verifily pipeline</div>
            </div>

            {/* Output */}
            <div className="bg-[#0a0a0a] border border-[#3b82f6]/30 rounded-xl text-center p-6 md:p-8 bg-gradient-to-br from-[#3b82f6]/5 to-transparent">
              <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent mb-2">5–10M</div>
              <div className="text-xs text-white">Synthetic output</div>
              <div className="text-[10px] text-[#888] mt-1">(privacy-safe)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
