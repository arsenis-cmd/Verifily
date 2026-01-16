'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import DesktopMockup from './DesktopMockup';

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-[#000000] pt-32 pb-16 overflow-hidden">
      {/* Background gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-white/[0.03] via-blue-500/[0.02] to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        {/* Hero text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center mb-8"
        >
          {/* Main headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6">
            Detect AI.{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              Verify Human.
            </span>
          </h1>

          {/* Divider line */}
          <div className="w-16 h-[2px] bg-white/20 mx-auto mb-6" />

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#a1a1a1] max-w-2xl mx-auto mb-8 leading-relaxed">
            The browser extension that instantly identifies AI-generated content and lets you prove your work is authentically human.
          </p>

          {/* CTA Button */}
          <Button variant="primary" size="lg" className="mb-8">
            Add to Chrome — It's Free
          </Button>

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 text-sm text-[#666666]">
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span> 95%+ Accuracy
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Privacy First
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Instant Results
            </span>
          </div>
        </motion.div>

        {/* Desktop mockup with video */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <DesktopMockup />
        </motion.div>
      </div>
    </section>
  );
}
