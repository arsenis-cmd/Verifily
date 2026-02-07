'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: 'Dataset Transformation',
      description:
        'Convert internal human data into privacy-safe synthetic datasets. Preserve distribution and signal while removing personally identifiable information.',
    },
    {
      title: 'Leakage Controls',
      description:
        'Designed to reduce memorization and leakage risk through deduplication, n-gram overlap filtering, similarity checks, and redaction.',
    },
    {
      title: 'Auditability & Versioning',
      description:
        'Track transformations with audit logs, version datasets for reproducibility, and integrate with existing training pipelines seamlessly.',
    },
  ];

  return (
    <section id="features" className="bg-[#000000] auto-height">
      <div className="container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-24"
        >
          <h2 className="text-white mb-6">
            Infrastructure for{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              privacy-safe training
            </span>
          </h2>
          <div className="flex justify-center">
            <p className="text-2xl text-[#888888] max-w-3xl text-center">
              Plugs into your existing ML stack to transform data and expand training corpora
            </p>
          </div>
        </motion.div>

        {/* Features Grid - Centered */}
        <div className="grid grid-cols-3 gap-16 w-full mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="card h-full text-center">
                {/* Number Badge */}
                <div className="flex justify-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center border border-[#3b82f6]/20">
                    <span className="text-3xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <h3 className="text-white mb-6 text-center">{feature.title}</h3>
                <p className="text-[#888888] text-lg leading-relaxed text-center">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
