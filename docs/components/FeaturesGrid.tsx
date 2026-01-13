'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Shield, Zap, Globe, Lock, Award, BarChart3 } from 'lucide-react';

export default function FeaturesGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const features = [
    {
      icon: Shield,
      title: 'AI Detection',
      description: 'Ensemble detection using perplexity analysis, burstiness patterns, watermark detection, and stylometric analysis. Works on any webpage.',
      size: 'large', // col-span-2
      gradient: 'from-accent-500 to-accent-300',
    },
    {
      icon: Award,
      title: 'Verification Badges',
      description: 'Get a shareable "Verified Human" badge for your content. Embed it on your blog, portfolio, or social profiles.',
      size: 'large', // col-span-2
      gradient: 'from-success-500 to-success-400',
    },
    {
      icon: Lock,
      title: 'Privacy-First',
      description: 'Your content is encrypted client-side. We can\'t read it. Nobody can.',
      size: 'small',
      gradient: 'from-purple-500 to-purple-400',
    },
    {
      icon: Globe,
      title: 'Works Everywhere',
      description: 'Chrome today. Firefox, Safari, and Edge coming soon.',
      size: 'small',
      gradient: 'from-accent-500 to-purple-500',
    },
    {
      icon: BarChart3,
      title: 'Creator Dashboard',
      description: 'Track your verifications, see who\'s viewed them, manage your verified portfolio.',
      size: 'medium', // col-span-2
      gradient: 'from-purple-500 to-accent-500',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: '<100ms detection. Real-time analysis as you browse.',
      size: 'small',
      gradient: 'from-accent-500 to-accent-400',
    },
  ];

  const getGridClass = (size: string) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2 md:row-span-2';
      case 'medium':
        return 'md:col-span-2';
      default:
        return 'md:col-span-1';
    }
  };

  return (
    <section id="features" ref={ref} className="py-32 relative overflow-hidden bg-primary-800/30">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 grid-pattern opacity-10" />
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-block px-6 py-2 glass rounded-full mb-6"
          >
            <span className="text-accent-500 font-semibold text-sm uppercase tracking-wider">Features</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
            Built for the{' '}
            <span className="gradient-text">AI Era</span>
          </h2>
          <p className="text-xl text-white/60">
            Powerful features designed for speed, accuracy, and ease of use
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`${getGridClass(feature.size)} glass-strong p-8 rounded-3xl hover:scale-[1.02] transition-all duration-500 group cursor-pointer relative overflow-hidden`}
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

              {/* Content */}
              <div className="relative z-10 h-full flex flex-col">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <feature.icon className="w-7 h-7 text-white" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold font-heading mb-4 text-white">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-white/70 leading-relaxed flex-1">
                  {feature.description}
                </p>

                {/* Decorative gradient line */}
                <div className={`mt-6 h-1 w-16 bg-gradient-to-r ${feature.gradient} rounded-full opacity-0 group-hover:opacity-100 group-hover:w-full transition-all duration-500`} />
              </div>

              {/* Scan lines effect */}
              <div className="absolute inset-0 bg-[linear-gradient(transparent_90%,rgba(255,255,255,0.02)_100%)] bg-[length:100%_4px] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-white/40 mb-6 text-lg">
            And many more features coming soon...
          </p>
          <a
            href="#cta"
            className="btn btn-primary glow-hover-cyan"
          >
            Get Started for Free
          </a>
        </motion.div>
      </div>
    </section>
  );
}
