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
        'Highlight any text and click "Check for AI" — or verify your own work as human-created.',
    },
    {
      number: '03',
      title: 'Get Results',
      description:
        'See detailed analysis in seconds. Share your verification badge anywhere.',
    },
  ];

  return (
    <section id="how-it-works" className="relative bg-[#050505] py-32">
      <div className="w-full max-w-6xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            How it works
          </h2>
          <p className="text-xl text-[#888888] max-w-2xl mx-auto">
            From detection to verification in seconds
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[calc(100%+1.5rem)] w-12 h-px bg-gradient-to-r from-[#333333] to-transparent" />
              )}

              {/* Step Card */}
              <div className="text-center md:text-left">
                {/* Number */}
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#333333] rounded-2xl mb-6">
                  <span className="text-3xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-[#888888] leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
