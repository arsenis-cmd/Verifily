'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function Roadmap() {
  const phases = [
    {
      status: 'completed',
      quarter: 'Q4 2024',
      title: 'Foundation',
      items: [
        'Chrome Extension Launch',
        'Real-time AI Detection',
        'Visual Verification Badges',
        'Privacy-First Architecture',
      ],
    },
    {
      status: 'current',
      quarter: 'Q1 2025',
      title: 'Expansion',
      items: [
        'Firefox & Safari Support',
        'Advanced Analytics Dashboard',
        'Content Creator Verification',
        'API for Developers',
      ],
    },
    {
      status: 'upcoming',
      quarter: 'Q2 2025',
      title: 'Intelligence',
      items: [
        'Multi-Language Support',
        'Image & Video Detection',
        'Platform Integrations',
        'Enterprise Solutions',
      ],
    },
    {
      status: 'future',
      quarter: 'Q3 2025',
      title: 'Ecosystem',
      items: [
        'Blockchain Verification',
        'Community Moderation',
        'Creator Marketplace',
        'Educational Resources',
      ],
    },
  ];

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: 'text-cyan',
          bgColor: 'bg-cyan/20',
          borderColor: 'border-cyan/50',
        };
      case 'current':
        return {
          icon: Sparkles,
          color: 'text-purple',
          bgColor: 'bg-purple/20',
          borderColor: 'border-purple/50',
        };
      default:
        return {
          icon: Clock,
          color: 'text-foreground/40',
          bgColor: 'bg-foreground/10',
          borderColor: 'border-foreground/20',
        };
    }
  };

  return (
    <section id="roadmap" className="py-24 relative overflow-hidden bg-navy-light/30">
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
            Roadmap
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Building the Future of
            <br />
            <span className="gradient-text">Content Verification</span>
          </h2>
          <p className="text-xl text-foreground/70">
            Our journey to make the internet more trustworthy
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {phases.map((phase, index) => {
              const config = getStatusConfig(phase.status);
              const Icon = config.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Connector Line */}
                  {index < phases.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-cyan/50 to-purple/50" />
                  )}

                  {/* Card */}
                  <div
                    className={`glass p-6 rounded-2xl border-2 ${config.borderColor} hover:border-cyan/50 transition-all group`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-semibold text-foreground/60">
                        {phase.quarter}
                      </span>
                      <div className={`p-2 rounded-lg ${config.bgColor}`}>
                        <Icon className={`w-5 h-5 ${config.color}`} />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-4 group-hover:gradient-text transition-all">
                      {phase.title}
                    </h3>

                    {/* Items */}
                    <ul className="space-y-3">
                      {phase.items.map((item, itemIndex) => (
                        <motion.li
                          key={itemIndex}
                          initial={{ opacity: 0, x: -10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.4,
                            delay: index * 0.1 + itemIndex * 0.05,
                          }}
                          className="flex items-start gap-2 text-foreground/70"
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${
                              phase.status === 'completed'
                                ? 'bg-cyan'
                                : phase.status === 'current'
                                ? 'bg-purple'
                                : 'bg-foreground/30'
                            }`}
                          />
                          <span className="text-sm leading-relaxed">{item}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Note */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16 space-y-4"
          >
            <p className="text-foreground/60">
              Want to influence our roadmap? Join our community and share your feedback.
            </p>
            <a
              href="#cta"
              className="inline-block px-8 py-4 bg-cyan text-navy rounded-full font-semibold hover:bg-cyan-dark transition-all"
            >
              Get Early Access
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
