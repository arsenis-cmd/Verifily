'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function Hero() {
  return (
    <section className="relative bg-[#000000] overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-br from-white/[0.03] via-blue-500/[0.02] to-transparent blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        >
          {/* Main headline — uses global h1: 96px desktop, 48px mobile */}
          <h1 className="text-white">
            Make human data{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              trainable
            </span>
            <br />
            —legally and at scale
          </h1>

          {/* Divider */}
          <div className="w-16 h-px bg-white/20 mx-auto mb-10" />

          {/* Subheadline — uses global p: 20px */}
          <div className="flex justify-center">
            <p className="text-[#a1a1a1] max-w-3xl text-center text-xl md:text-2xl leading-relaxed mb-16">
              Under GDPR and the EU AI Act, many teams can&apos;t train on raw internal data.
              Verifily converts it into privacy-safe synthetic datasets—typically expanding
              it 5–10×—so you can train without exposing the original.
            </p>
          </div>

          {/* CTA Buttons — using the Button component */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-16">
            <Link href="/pilot">
              <Button variant="primary" size="md">
                Request a pilot
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              How it works
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-base text-[#666]">
            <span className="flex items-center gap-2">
              <span className="text-emerald-500 text-lg">&#10003;</span> 5–10× Dataset Expansion
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-500 text-lg">&#10003;</span> GDPR & EU AI Act Ready
            </span>
            <span className="flex items-center gap-2">
              <span className="text-emerald-500 text-lg">&#10003;</span> Privacy-Safe Synthetic Data
            </span>
          </div>
        </motion.div>

        {/* Data flow visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-24 w-full max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-3 gap-8 items-center">
            {/* Input */}
            <div className="card text-center">
              <div className="text-4xl md:text-5xl font-bold text-white mb-3">1M</div>
              <div className="text-base text-[#888]">Human examples</div>
              <div className="text-sm text-[#555] mt-2">(internal data)</div>
            </div>

            {/* Arrow */}
            <div className="flex flex-col items-center gap-2">
              <div className="text-4xl text-[#3b82f6]">&rarr;</div>
              <div className="text-sm text-[#666] text-center">Verifily pipeline</div>
            </div>

            {/* Output */}
            <div className="card text-center border-[#3b82f6]/30 bg-gradient-to-br from-[#3b82f6]/5 to-transparent">
              <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent mb-3">5–10M</div>
              <div className="text-base text-white">Synthetic output</div>
              <div className="text-sm text-[#888] mt-2">(privacy-safe)</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
