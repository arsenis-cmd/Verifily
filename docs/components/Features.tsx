'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  Shield,
  Eye,
  Lock,
  Sparkles,
  BarChart3,
  Users,
  Globe,
} from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Detection in <100ms. No lag, no waiting. Instant verification as you browse.',
      gradient: 'from-cyan to-cyan-dark',
    },
    {
      icon: Shield,
      title: '99.7% Accurate',
      description: 'Powered by state-of-the-art AI models trained on millions of text samples.',
      gradient: 'from-purple to-purple-light',
    },
    {
      icon: Eye,
      title: 'Non-Intrusive',
      description: 'Works silently in the background. Only shows up when you need it.',
      gradient: 'from-cyan to-purple',
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'All analysis happens locally. Your data never leaves your browser.',
      gradient: 'from-purple to-cyan',
    },
    {
      icon: Sparkles,
      title: 'Visual Badges',
      description: 'Clear verification badges show authenticity at a glance.',
      gradient: 'from-cyan to-cyan-dark',
    },
    {
      icon: BarChart3,
      title: 'Detailed Reports',
      description: 'See confidence scores, classification breakdown, and analysis details.',
      gradient: 'from-purple to-purple-light',
    },
    {
      icon: Users,
      title: 'Universal Compatibility',
      description: 'Works on Twitter, Reddit, Medium, blogs, emails—everywhere you browse.',
      gradient: 'from-cyan to-purple',
    },
    {
      icon: Globe,
      title: 'Always Improving',
      description: 'Regular updates with better models and new features based on user feedback.',
      gradient: 'from-purple to-cyan',
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-navy-light/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan/5 via-transparent to-purple/5" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <span className="text-cyan text-sm font-semibold uppercase tracking-wider">
            Features
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Everything You Need to
            <br />
            <span className="gradient-text">Verify the Web</span>
          </h2>
          <p className="text-xl text-foreground/70">
            Powerful features designed for speed, accuracy, and ease of use
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className={`glass p-8 rounded-2xl hover:border-cyan/50 transition-all cursor-pointer group ${
                index === 0 || index === 5 ? 'lg:col-span-2' : ''
              }`}
            >
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} p-3 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all`}
              >
                <feature.icon className="w-full h-full text-navy" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-foreground/70 leading-relaxed">
                {feature.description}
              </p>
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
          <p className="text-foreground/60 mb-6">
            And many more features coming soon...
          </p>
          <a
            href="#cta"
            className="inline-block px-8 py-4 bg-cyan text-navy rounded-full font-semibold hover:bg-cyan-dark transition-all"
          >
            Get Started for Free
          </a>
        </motion.div>
      </div>
    </section>
  );
}
