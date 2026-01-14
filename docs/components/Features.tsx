'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: 'Instant AI Detection',
      description:
        'Analyze any text with one click. Our multi-model system identifies AI-generated content with 95%+ accuracy.',
    },
    {
      title: 'Human Verification',
      description:
        'Prove your work is authentic. Get a verification badge you can share—your proof of human authorship.',
    },
    {
      title: 'Verified Portfolio',
      description:
        'Track all verified content in one dashboard. Build a reputation for authentic human work.',
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
            Three ways to{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              take control
            </span>
          </h2>
          <p className="text-2xl text-[#888888] max-w-3xl mx-auto">
            Everything you need to verify authenticity in the AI era
          </p>
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
              <div className="card h-full">
                {/* Number Badge */}
                <div className="flex justify-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-2xl flex items-center justify-center border border-[#3b82f6]/20">
                    <span className="text-3xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <h3 className="text-white mb-6">{feature.title}</h3>
                <p className="text-[#888888] text-lg leading-relaxed">
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
