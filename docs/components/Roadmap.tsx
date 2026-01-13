'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { CheckCircle, Clock, Sparkles } from 'lucide-react';

export default function Roadmap() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const milestones = [
    {
      quarter: 'Q1 2026',
      title: 'Chrome Extension Launch',
      description: 'Public release of browser extension with core detection features',
      status: 'current',
    },
    {
      quarter: 'Q2 2026',
      title: 'Platform APIs & Badges',
      description: 'Developer API access and embeddable verification badges',
      status: 'upcoming',
    },
    {
      quarter: 'Q3 2026',
      title: 'Enterprise Solutions',
      description: 'Team dashboards, bulk verification, and custom integrations',
      status: 'upcoming',
    },
    {
      quarter: 'Q4 2026',
      title: 'Regulatory Certification',
      description: 'Third-party audits and compliance certifications',
      status: 'upcoming',
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'current':
        return Sparkles;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success-500';
      case 'current':
        return 'text-accent-500';
      default:
        return 'text-white/40';
    }
  };

  return (
    <section id="roadmap" ref={ref} className="py-32 relative overflow-hidden bg-primary-800/30">
      {/* Background */}
      <div className="absolute inset-0 grid-pattern opacity-10" />
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

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
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">Roadmap</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
            The Future of{' '}
            <span className="gradient-text">Digital Trust</span>
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="max-w-5xl mx-auto relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent-500/50 via-purple-500/50 to-transparent" />

          {/* Milestones */}
          <div className="space-y-16">
            {milestones.map((milestone, index) => {
              const StatusIcon = getStatusIcon(milestone.status);
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
                  className={`relative flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Content */}
                  <div className={`flex-1 ${isLeft ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'} ml-20 md:ml-0`}>
                    <div className="glass-strong p-8 rounded-3xl hover:scale-105 transition-all duration-500 group cursor-pointer">
                      <div className="flex items-center gap-3 mb-4 md:justify-end">
                        <span className="text-sm font-semibold text-accent-500">{milestone.quarter}</span>
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(milestone.status)}`} />
                      </div>

                      <h3 className="text-2xl font-bold font-heading mb-3 text-white">
                        {milestone.title}
                      </h3>

                      <p className="text-white/70 leading-relaxed">
                        {milestone.description}
                      </p>

                      {milestone.status === 'current' && (
                        <div className="mt-4 inline-flex items-center gap-2 text-sm text-accent-500">
                          <div className="w-2 h-2 rounded-full bg-accent-500 animate-pulse" />
                          <span className="font-semibold">In Progress</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary-900 border-4 border-accent-500 z-10 flex items-center justify-center">
                    <div className={`w-3 h-3 rounded-full ${milestone.status === 'current' ? 'bg-accent-500 animate-pulse' : 'bg-white/40'}`} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Vision Statement */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, delay: 1 }}
          className="max-w-4xl mx-auto mt-32 text-center"
        >
          <h3 className="text-4xl md:text-5xl font-bold font-heading leading-tight mb-8">
            We're not just building a tool.{' '}
            <span className="block mt-4 gradient-text">
              We're building the trust infrastructure for the AI era.
            </span>
          </h3>
          <p className="text-xl text-white/60 leading-relaxed">
            The verification layer that platforms, creators, and regulators will rely on.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
