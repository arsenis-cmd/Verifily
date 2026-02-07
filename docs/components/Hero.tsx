'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#000000] pt-32 pb-16 overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-white/[0.03] via-blue-500/[0.02] to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero text content */}
        <div className="flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center mb-20"
          >
            {/* Main headline */}
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 text-center">
              Make human data{' '}
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                trainable—legally
              </span>{' '}
              and at scale
            </h1>

            {/* Divider line */}
            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-6" />

            {/* Subheadline */}
            <div className="flex justify-center mb-8">
              <p className="text-lg md:text-xl text-[#a1a1a1] max-w-3xl leading-relaxed text-center">
                Under GDPR and the EU AI Act, many teams can't train on raw internal human data.
                Verifily converts it into privacy-safe synthetic datasets—typically expanding it 5–10×—so you can train without exposing raw data.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
              <Link href="/pilot">
                <Button variant="primary" size="lg">
                  Request a pilot
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  const howItWorksSection = document.querySelector('#how-it-works');
                  howItWorksSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                How it works
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 text-sm text-[#666666]">
              <span className="flex items-center gap-2">
                <span className="text-green-500">✓</span> 5–10× Dataset Expansion
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-500">✓</span> GDPR & EU AI Act Ready
              </span>
              <span className="flex items-center gap-2">
                <span className="text-green-500">✓</span> Privacy-Safe Synthetic Data
              </span>
            </div>
          </motion.div>

          {/* Data flow visualization */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mt-16 w-full max-w-4xl"
          >
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Input */}
              <div className="card text-center p-8">
                <div className="text-4xl font-bold text-white mb-3">1M</div>
                <div className="text-sm text-[#888888]">Human examples</div>
                <div className="text-xs text-[#666666] mt-2">(internal data)</div>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center">
                <div className="text-3xl text-[#3b82f6] mb-2">→</div>
                <div className="text-xs text-[#888888] text-center">Verifily transformation</div>
              </div>

              {/* Output */}
              <div className="card text-center p-8 border-[#3b82f6]/30 bg-gradient-to-br from-[#3b82f6]/5 to-transparent">
                <div className="text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent mb-3">5–10M</div>
                <div className="text-sm text-white">Training-ready synthetic</div>
                <div className="text-xs text-[#888888] mt-2">(privacy-safe)</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
