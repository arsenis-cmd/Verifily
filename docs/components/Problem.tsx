'use client';

import { motion } from 'framer-motion';
import { AlertCircle, TrendingUp, Users, FileText } from 'lucide-react';

export default function Problem() {
  const stats = [
    {
      icon: FileText,
      value: '58%',
      label: 'of online content is AI-generated',
      color: 'text-cyan',
    },
    {
      icon: TrendingUp,
      value: '300%',
      label: 'increase in AI content since 2023',
      color: 'text-purple',
    },
    {
      icon: Users,
      value: '76%',
      label: 'of users can\'t distinguish AI from human',
      color: 'text-cyan',
    },
    {
      icon: AlertCircle,
      value: '0',
      label: 'built-in browser tools to verify',
      color: 'text-purple',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-0 w-64 h-64 bg-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-cyan text-sm font-semibold uppercase tracking-wider">
            The Problem
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            AI is Everywhere.
            <br />
            <span className="gradient-text">Trust is Nowhere.</span>
          </h2>
          <p className="text-xl text-foreground/70">
            The internet is flooded with AI-generated content. Without tools to verify authenticity,
            how can you trust what you read?
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="glass p-8 rounded-2xl hover:border-cyan/50 transition-all cursor-pointer group"
            >
              <div className={`${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon size={40} />
              </div>
              <div className="text-4xl font-bold mb-2 gradient-text">
                {stat.value}
              </div>
              <div className="text-foreground/70">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Problem Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto mt-16 glass p-8 md:p-12 rounded-3xl"
        >
          <div className="space-y-6 text-lg text-foreground/80">
            <p>
              <span className="text-cyan font-semibold">The challenge:</span> AI writing tools have become
              so sophisticated that distinguishing human from machine is nearly impossible.
            </p>
            <p>
              <span className="text-purple font-semibold">The impact:</span> Misinformation spreads faster,
              trust erodes, and authentic voices get drowned out.
            </p>
            <p>
              <span className="gradient-text font-semibold">The solution:</span> Verifily gives you instant,
              accurate AI detection right in your browser—no copy-pasting, no disruption, just truth.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
