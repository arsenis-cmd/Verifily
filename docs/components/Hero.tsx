'use client';

import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import NeuralNetwork from './NeuralNetwork';

export default function Hero() {
  return (
    <section className="relative bg-[#000000] overflow-hidden">
      <NeuralNetwork />

      <div className="container relative z-10">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-white mb-8">
              Detect AI.
              <br />
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                Verify Human.
              </span>
            </h1>

            <p className="text-2xl text-[#888888] max-w-3xl mx-auto mb-12">
              The browser extension that instantly identifies AI-generated content
              and lets you prove your work is authentically human.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex gap-6 justify-center items-center"
          >
            <Button variant="primary" size="lg" className="text-lg px-12 py-5">
              Add to Chrome
            </Button>
            <Button variant="secondary" size="lg" className="text-lg px-12 py-5">
              See Demo
            </Button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex gap-12 justify-center text-base text-[#555555]"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#3b82f6] rounded-full" />
              <span>95%+ Accuracy</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#3b82f6] rounded-full" />
              <span>Privacy First</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#3b82f6] rounded-full" />
              <span>Instant Results</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
