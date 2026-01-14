'use client';

import { motion } from 'framer-motion';
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
        <div className="max-w-[700px] mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg mb-6">Ready to verify your work?</h2>

            <p className="body-lg mb-12">
              Join thousands of creators building trust in the AI era.
              <br />
              Free forever for individuals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button
                variant="primary"
                size="lg"
                className="animate-pulse-glow"
              >
                Add to Chrome — It's Free
              </Button>
            </div>

            <p className="text-sm text-[#666666]">
              Chrome extension available now. Firefox and Safari coming soon.
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
