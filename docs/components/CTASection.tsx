'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function CTASection() {
  return (
    <section id="cta" className="bg-[#000000] relative overflow-hidden py-32">
      {/* Glowing background effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-5">
            Ready to scale your training data?
          </h2>

          <p className="text-base text-[#888] leading-relaxed mb-10 max-w-xl mx-auto">
            Transform blocked internal data into privacy-safe training corpora.
            Join ML teams using Verifily to train legally and at scale.
          </p>

          <Link href="/pilot">
            <button className="h-12 px-8 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full hover:opacity-90 transition-opacity mb-5">
              Request a pilot
            </button>
          </Link>

          <p className="text-xs text-[#555]">
            Pilot-based pricing. Designed for ML teams and data platform engineers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
