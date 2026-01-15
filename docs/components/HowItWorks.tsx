'use client';

import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Install Extension',
      description:
        'Add Verifily to Chrome in one click. No account required to start detecting AI content.',
    },
    {
      number: '02',
      title: 'Detect or Verify',
      description:
        'Highlight any text and click "Check for AI"—or verify your own work as human-created.',
    },
    {
      number: '03',
      title: 'Get Results',
      description:
        'See detailed analysis in seconds. Share your verification badge anywhere.',
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
          <p className="text-2xl text-[#888888] max-w-3xl mx-auto text-center">
            From detection to verification in seconds
          </p>
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
