'use client';

import { motion } from 'framer-motion';

export default function WhyItMatters() {
  return (
    <section className="bg-[#000000] relative overflow-hidden">
      {/* Subtle background animation */}
      <div className="bg-glow" />

      <div className="container relative z-10">
        <div className="max-w-[900px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg text-center mb-16">
              The internet has a{' '}
              <span className="text-[#ff4444]">trust problem</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-12 text-left">
              {/* The Problem */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <p className="body-lg leading-relaxed">
                  By 2027, 90% of online content will be AI-generated. Model
                  collapse is degrading AI quality. Creators can't prove their
                  work is original. And AI companies are running out of
                  authentic human data.
                </p>
              </motion.div>

              {/* The Solution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <p className="body-lg leading-relaxed">
                  Verifily is building the trust layer for the AI era. We help
                  you identify what's real, verify what's yours, and contribute
                  to a future where human creativity remains valuable.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
