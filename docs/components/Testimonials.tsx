'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function Testimonials() {
  const outcomes = [
    {
      title: 'Expand Datasets 5–10×',
      description:
        'Transform limited internal human data into larger, privacy-safe training corpora.',
    },
    {
      title: 'Reduce Compliance Risk',
      description:
        'Train on synthetic output instead of raw data—designed for GDPR and EU AI Act compliance.',
    },
    {
      title: 'Improve Training Signal',
      description:
        'Use clean, controlled synthetic data vs. contaminated web-scraped datasets.',
    },
  ];

  return (
    <section className="bg-[#0a0a0a]" style={{ padding: '240px 80px' }}>
      <div className="container">
        <div className="w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg text-center mb-8">
              Design partners wanted
            </h2>

            <p className="text-center text-lg text-[#888888] mb-16 max-w-2xl mx-auto">
              We're working with ML teams to refine our pipeline. If you're training models and blocked by compliance or data scarcity, let's talk.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {outcomes.map((outcome, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card relative text-center"
                >
                  <div className="mb-4">
                    <span className="text-3xl">✓</span>
                  </div>

                  <div className="font-semibold text-white mb-3 text-lg">
                    {outcome.title}
                  </div>
                  <p className="text-sm text-[#888888] leading-relaxed">
                    {outcome.description}
                  </p>
                </motion.div>
              ))}
            </div>

            <div className="flex justify-center">
              <Link href="/pilot">
                <Button variant="primary" size="lg">
                  Apply for pilot program
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
