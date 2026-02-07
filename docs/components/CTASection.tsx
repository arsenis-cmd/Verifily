'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function CTASection() {
  return (
    <section id="cta" className="bg-[#000000] relative overflow-hidden">
      {/* Glowing background effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
        }}
      />

      <div className="container relative z-10">
        <div className="w-full mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg mb-6">Ready to scale your training data?</h2>

            <p className="body-lg mb-12">
              Transform blocked internal data into privacy-safe training corpora.
              <br />
              Join ML teams using Verifily to train legally and at scale.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/pilot">
                <Button
                  variant="primary"
                  size="lg"
                  className="animate-pulse-glow px-24"
                >
                  Request a pilot
                </Button>
              </Link>
            </div>

            <p className="text-sm text-[#666666]">
              Pilot-based pricing. Designed for ML teams and data platform engineers.
            </p>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 255, 255, 0.4);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}
