'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import NeuralNetwork from './NeuralNetwork';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center bg-[#000000] overflow-hidden px-4">
      {/* Neural Network Animation */}
      <NeuralNetwork />

      {/* Content - Perfectly Centered */}
      <div className="relative z-10 w-full max-w-4xl mx-auto text-center space-y-12">
        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-6"
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[1.1] tracking-tight">
            Detect AI.
            <br />
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              Verify Human.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-[#888888] max-w-2xl mx-auto leading-relaxed font-light">
            The browser extension that instantly identifies AI-generated content
            and lets you prove your work is authentically human.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button variant="primary" size="lg" className="min-w-[200px]">
            Add to Chrome
          </Button>
          <Button variant="secondary" size="lg" className="min-w-[200px]">
            See Demo
          </Button>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-[#555555] pt-8"
        >
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
            <span>95%+ Accuracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
            <span>Privacy First</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#3b82f6] rounded-full" />
            <span>Instant Results</span>
          </div>
        </motion.div>

        {/* Product Preview */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="pt-12"
        >
          <div className="relative max-w-md mx-auto">
            {/* Glow effect behind card */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6]/20 to-[#8b5cf6]/20 blur-3xl" />

            {/* Extension UI */}
            <div className="relative bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-lg">Verifily</h3>
                <div className="text-[#555555]">✕</div>
              </div>

              {/* Analysis Progress */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#888888]">Analyzing content...</span>
                  <span className="text-white font-semibold">87%</span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '87%' }}
                    transition={{ duration: 2, delay: 1.5 }}
                    className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] rounded-full"
                  />
                </div>
              </div>

              {/* Result */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#00ff88]/10 rounded-full flex items-center justify-center">
                    <span className="text-[#00ff88] text-lg">✓</span>
                  </div>
                  <div>
                    <div className="text-white font-semibold">Likely Human</div>
                    <div className="text-[#666666] text-sm">High confidence</div>
                  </div>
                </div>

                <div className="text-sm text-[#666666] space-y-1 bg-[#0a0a0a] rounded-lg p-3 border border-[#1a1a1a]">
                  <div>Words analyzed: 847</div>
                  <div>Detection time: 1.2s</div>
                </div>

                <button className="w-full bg-white text-black font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors">
                  Verify as Human
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2 text-[#333333]">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-px h-12 bg-gradient-to-b from-[#333333] to-transparent"
          />
        </div>
      </motion.div>
    </section>
  );
}
