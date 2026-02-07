'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function CTASection() {
  return (
    <section id="cta" className="bg-[#000000] relative overflow-hidden auto-height">
      {/* Glowing background effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
      />

      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-white mb-8">
            Ready to scale your training data?
          </h2>

          <div className="flex justify-center">
            <p className="text-xl md:text-2xl text-[#888] leading-relaxed mb-14 max-w-3xl text-center">
              Transform blocked internal data into privacy-safe training corpora.
              Join ML teams using Verifily to train legally and at scale.
            </p>
          </div>

          <div className="flex justify-center mb-8">
            <Link href="/pilot">
              <Button variant="primary" size="lg">
                Request a pilot
              </Button>
            </Link>
          </div>

          <p className="text-sm text-[#555] text-center">
            Pilot-based pricing. Designed for ML teams and data platform engineers.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
