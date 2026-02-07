'use client';

import { motion } from 'framer-motion';

export default function WhyItMatters() {
  return (
    <section className="bg-[#000000] relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="bg-glow" />

      <div className="container relative z-10">
        <div className="w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg text-center mb-16">
              The regulatory{' '}
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">tailwind</span>
            </h2>

            <div className="grid md:grid-cols-3 gap-12 text-center">
              {/* Problem */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-4">The Problem</h3>
                <p className="body-md leading-relaxed text-[#888888]">
                  Training data is scarce and contaminated. Compliance blocks direct training on internal human data. Manual dataset creation is slow and expensive.
                </p>
              </motion.div>

              {/* Regulation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="card border-[#3b82f6]/30"
              >
                <h3 className="text-xl font-semibold text-white mb-4">Why Now</h3>
                <p className="body-md leading-relaxed text-[#888888]">
                  GDPR purpose limitation and EU AI Act constraints make direct training risky. Internal legal teams block raw data access. Synthetic derivatives become the practical path.
                </p>
              </motion.div>

              {/* Solution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="card"
              >
                <h3 className="text-xl font-semibold text-white mb-4">The Solution</h3>
                <p className="body-md leading-relaxed text-[#888888]">
                  Verifily transforms blocked internal data into privacy-safe synthetic datasets. Teams train on synthetic output—not raw data—reducing compliance risk while scaling.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
