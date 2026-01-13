'use client';

import { motion } from 'framer-motion';
import { Download, Scan, CheckCircle, Zap } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Download,
      title: 'Install Extension',
      description: 'Add Verifily to Chrome in one click. No account required, completely free.',
      color: 'from-cyan to-cyan-dark',
    },
    {
      number: '02',
      icon: Scan,
      title: 'Browse Normally',
      description: 'Read articles, social media, emails—anywhere. Verifily works silently in the background.',
      color: 'from-purple to-purple-light',
    },
    {
      number: '03',
      icon: CheckCircle,
      title: 'Get Instant Results',
      description: 'Select any text and see AI probability scores in real-time. Visual badges show verification status.',
      color: 'from-cyan to-purple',
    },
    {
      number: '04',
      icon: Zap,
      title: 'Trust What You Read',
      description: 'Make informed decisions with confidence. Know what\'s authentic and what\'s generated.',
      color: 'from-purple to-cyan',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1f3a_1px,transparent_1px),linear-gradient(to_bottom,#1a1f3a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-purple text-sm font-semibold uppercase tracking-wider">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Authenticity in
            <br />
            <span className="gradient-text">4 Simple Steps</span>
          </h2>
          <p className="text-xl text-foreground/70">
            Verifily integrates seamlessly into your browsing experience
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="max-w-6xl mx-auto space-y-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex flex-col ${
                index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              } gap-8 items-center`}
            >
              {/* Step Content */}
              <div className="flex-1 space-y-4">
                <div className="text-6xl font-bold text-foreground/10">
                  {step.number}
                </div>
                <h3 className="text-3xl font-bold">{step.title}</h3>
                <p className="text-lg text-foreground/70">
                  {step.description}
                </p>
              </div>

              {/* Step Visual */}
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="flex-1 relative"
              >
                <div className={`glass p-12 rounded-3xl bg-gradient-to-br ${step.color} bg-opacity-10 relative overflow-hidden group`}>
                  {/* Icon */}
                  <div className="relative z-10">
                    <step.icon
                      size={80}
                      className="text-cyan group-hover:text-purple transition-colors duration-300"
                    />
                  </div>

                  {/* Decorative Elements */}
                  <div className="absolute -top-8 -right-8 w-32 h-32 bg-cyan/20 rounded-full blur-2xl group-hover:bg-purple/20 transition-colors" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple/20 rounded-full blur-2xl group-hover:bg-cyan/20 transition-colors" />
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-16"
        >
          <a
            href="#demo"
            className="inline-flex items-center gap-2 px-8 py-4 glass rounded-full hover:bg-white/5 transition-all group"
          >
            <span className="text-lg font-semibold">See it in action</span>
            <Zap className="w-5 h-5 text-cyan group-hover:text-purple transition-colors" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
