'use client';

import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Ingest Internal Data',
      description:
        'Connect your internal human data under a data-processing agreement. No scraping—only authorized access to your proprietary data.',
    },
    {
      number: '02',
      title: 'Transform to Synthetic',
      description:
        'Process data in a controlled environment with privacy-safe transformations: de-identification, leakage controls, and distribution preservation.',
    },
    {
      number: '03',
      title: 'Export Training Corpora',
      description:
        'Receive versioned, training-ready synthetic datasets. Teams train on synthetic output—not raw data. Typically expands datasets 5–10×.',
    },
  ];

  return (
    <section id="how-it-works" className="bg-[#050505] auto-height">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-white mb-6">How it works</h2>
          <div className="flex justify-center">
            <p className="text-2xl text-[#888888] max-w-3xl text-center">
              Three steps from raw human data to training-ready synthetic datasets
            </p>
          </div>
        </motion.div>

        {/* Steps - Centered Grid */}
        <div className="grid grid-cols-3 gap-20 w-full mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {/* Number Badge */}
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-3xl flex items-center justify-center">
                  <span className="text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
              </div>

              <h3 className="text-white mb-6 text-center">{step.title}</h3>
              <p className="text-[#888888] text-lg leading-relaxed text-center">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
