'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Search, Shield, Lock } from 'lucide-react';

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const steps = [
    {
      number: '01',
      title: 'Detect',
      icon: Search,
      description: 'Instantly analyze any text on the web. Our AI detection identifies machine-generated content with 95%+ accuracy.',
      features: ['Real-time scanning', 'Works on any webpage', 'Perplexity analysis', 'Pattern detection'],
      gradient: 'from-accent-500 to-accent-300',
    },
    {
      number: '02',
      title: 'Verify',
      icon: Shield,
      description: 'Wrote something yourself? Verify it as human-created with one click. Your content gets a unique cryptographic proof.',
      features: ['One-click verification', 'Crypto proof', 'Shareable badges', 'Timestamped'],
      gradient: 'from-success-500 to-success-400',
    },
    {
      number: '03',
      title: 'Protect',
      icon: Lock,
      description: 'Your verified content joins a growing repository of authenticated human work—protected, attributed, and ready for the future of AI.',
      features: ['Content registry', 'Attribution locked', 'Future-proof', 'AI-resistant'],
      gradient: 'from-purple-500 to-purple-400',
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-24"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block px-6 py-2 glass rounded-full mb-6"
          >
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">How It Works</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
            Authenticity in{' '}
            <span className="gradient-text">3 Simple Steps</span>
          </h2>
          <p className="text-xl text-white/60">
            Verifily integrates seamlessly into your browsing experience
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto space-y-32">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 + index * 0.3 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
            >
              {/* Content Side */}
              <div className="flex-1 space-y-6">
                {/* Step Number */}
                <div className="text-8xl md:text-9xl font-bold font-heading text-white/5">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="text-4xl md:text-5xl font-bold font-heading -mt-16">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-xl text-white/70 leading-relaxed">
                  {step.description}
                </p>

                {/* Features List */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  {step.features.map((feature, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.3 + i * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${step.gradient}`} />
                      <span className="text-white/60 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Visual Side */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: index % 2 === 0 ? -15 : 15 }}
                animate={isInView ? { opacity: 1, scale: 1, rotateY: 0 } : {}}
                transition={{ duration: 1, delay: 0.5 + index * 0.3 }}
                className="flex-1 relative group"
              >
                <div className={`glass-strong p-16 rounded-3xl relative overflow-hidden hover:scale-105 transition-all duration-500`}>
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />

                  {/* Icon */}
                  <div className="relative z-10 flex items-center justify-center">
                    <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${step.gradient} bg-opacity-10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <step.icon className="w-16 h-16 text-white" strokeWidth={1.5} />
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className={`absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br ${step.gradient} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />
                  <div className={`absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br ${step.gradient} opacity-20 rounded-full blur-2xl group-hover:opacity-30 transition-opacity`} />

                  {/* Scan lines effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(transparent_90%,rgba(255,255,255,0.03)_100%)] bg-[length:100%_4px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                {/* Connecting line to next step */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -bottom-24 left-1/2 w-0.5 h-24 bg-gradient-to-b from-white/20 to-transparent" />
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="text-center mt-24"
        >
          <a
            href="#demo"
            className="btn btn-ghost text-lg hover:glow-hover-cyan group"
          >
            <span>See it in action</span>
            <Search className="w-5 h-5 text-accent-500 group-hover:rotate-12 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
