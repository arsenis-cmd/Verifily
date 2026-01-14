'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: 'Instant AI Detection',
      description:
        'Analyze any text with one click. Our multi-model system identifies AI-generated content with 95%+ accuracy using advanced perplexity analysis and stylometric signals.',
    },
    {
      title: 'Human Verification',
      description:
        'Prove your work is authentic. Get a unique verification badge you can share anywhere—your cryptographic proof of human authorship that builds trust.',
    },
    {
      title: 'Verified Portfolio',
      description:
        'Track all your verified content in one dashboard. Share badges on your website or social profiles and build a reputation for authentic human work.',
    },
  ];

  return (
    <section id="features" className="relative bg-[#000000] py-32">
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
            Three ways to{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
              take control
            </span>
          </h2>
          <p className="text-xl text-[#888888] max-w-2xl mx-auto">
            Everything you need to verify authenticity in the AI era
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Card */}
              <div className="h-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-8 hover:border-[#333333] transition-all duration-300 hover:-translate-y-2">
                {/* Number Badge */}
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[#3b82f6]/20 to-[#8b5cf6]/20 rounded-xl mb-6 border border-[#3b82f6]/20">
                  <span className="text-2xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-[#888888] leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
