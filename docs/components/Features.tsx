'use client';

import { motion } from 'framer-motion';

export default function Features() {
  const features = [
    {
      title: 'Instant AI detection',
      description:
        'Analyze any text on the web with one click. Our multi-model detection system identifies AI-generated content with 95%+ accuracy using perplexity analysis, burstiness patterns, and stylometric signals.',
      icon: '🔍',
    },
    {
      title: 'Verify your human work',
      description:
        'Created something yourself? Verify it as authentically human with a single click. Get a unique verification badge you can share anywhere — your proof of human authorship.',
      icon: '✓',
    },
    {
      title: 'Build your verified portfolio',
      description:
        'Every verification is stored in your personal dashboard. Track your verified content, share badges on your website or social profiles, and build a reputation for authentic human work.',
      icon: '📊',
    },
  ];

  return (
    <section id="features" className="bg-[#000000]">
      <div className="container">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg text-center mb-20">
              Three ways to take{' '}
              <span className="text-[#3b82f6]">control</span>
            </h2>

            <div className="space-y-24">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className={`grid md:grid-cols-2 gap-12 items-center ${
                    index % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Icon/Mockup */}
                  <div
                    className={`${index % 2 === 1 ? 'md:order-2' : ''} flex items-center justify-center`}
                  >
                    <div className="w-48 h-48 flex items-center justify-center bg-[#111111] border border-[#222222] rounded-2xl">
                      <span className="text-6xl">{feature.icon}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={index % 2 === 1 ? 'md:order-1' : ''}>
                    <h3 className="headline-md mb-4">{feature.title}</h3>
                    <p className="body-lg">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
