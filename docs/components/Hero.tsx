'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import NeuralNetwork from './NeuralNetwork';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-[#000000] overflow-hidden">
      {/* Neural Network Animation */}
      <NeuralNetwork />

      {/* Subtle background glow */}
      <div className="bg-glow" />

      {/* Content */}
      <div className="container relative z-10">
        <div className="max-w-[900px] mx-auto text-center">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="headline-xl mb-6"
          >
            Detect AI. Verify Human.
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="body-lg max-w-[700px] mx-auto mb-10"
          >
            The browser extension that instantly identifies AI-generated content
            and lets you prove your work is authentically human.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button variant="primary" size="lg">
              Add to Chrome — It's Free
            </Button>
            <Button variant="secondary" size="lg">
              See how it works ↓
            </Button>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="flex flex-wrap justify-center gap-8 mb-20 text-sm text-[#666666]"
          >
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-[#666666] rounded-full" />
              <span>Privacy-first</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-[#666666] rounded-full" />
              <span>Instant results</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-[#666666] rounded-full" />
              <span>95%+ accuracy</span>
            </div>
          </motion.div>

          {/* Product UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 15 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="max-w-[400px] mx-auto"
            style={{ perspective: '1000px' }}
          >
            <div
              className="bg-[#111111] border border-[#222222] rounded-2xl p-6 shadow-2xl"
              style={{
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              }}
            >
              {/* Extension Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold text-lg">Verifily</h3>
                <button className="text-[#666666] hover:text-white transition-colors">
                  ✕
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-2 flex-1 bg-[#222222] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] rounded-full"
                      style={{ width: '87%' }}
                    />
                  </div>
                  <span className="ml-4 text-white font-semibold">87%</span>
                </div>
              </div>

              {/* Result */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[#00ff88] text-xl">✓</span>
                  <span className="text-white font-semibold">Likely Human</span>
                </div>
                <div className="text-sm text-[#a1a1a1] space-y-1">
                  <div>Confidence: High</div>
                  <div>Words analyzed: 847</div>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full bg-white text-black font-medium py-3 px-4 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                Verify as Human
                <span>→</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
