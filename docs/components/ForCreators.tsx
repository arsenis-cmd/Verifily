'use client';

import { motion } from 'framer-motion';
import { Pencil, Users, TrendingUp, Award } from 'lucide-react';

export default function ForCreators() {
  const benefits = [
    {
      icon: Pencil,
      title: 'Prove Your Authenticity',
      description: 'Show readers your work is genuinely human-written. Stand out in an AI-flooded world.',
    },
    {
      icon: Users,
      title: 'Build Trust',
      description: 'Verified human content builds stronger connections with your audience.',
    },
    {
      icon: TrendingUp,
      title: 'Boost Credibility',
      description: 'Higher trust = more engagement, shares, and loyal followers.',
    },
    {
      icon: Award,
      title: 'Own Your Voice',
      description: 'Protect your unique perspective in the age of machine-generated content.',
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <span className="text-purple text-sm font-semibold uppercase tracking-wider">
                  For Content Creators
                </span>
                <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
                  Your Words,
                  <br />
                  <span className="gradient-text">Your Proof</span>
                </h2>
                <p className="text-xl text-foreground/70">
                  In a world where AI can write anything, proving you're human is your competitive advantage.
                </p>
              </div>

              {/* Benefits Grid */}
              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="flex gap-4 items-start group"
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple to-cyan p-2.5 group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <benefit.icon className="w-full h-full text-navy" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                      <p className="text-foreground/70">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <a
                  href="#cta"
                  className="inline-block px-8 py-4 glass rounded-full font-semibold hover:bg-white/5 transition-all"
                >
                  Start Verifying Your Content
                </a>
              </motion.div>
            </motion.div>

            {/* Right Visual */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              {/* Mockup Card */}
              <div className="glass p-8 rounded-3xl relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple/20 rounded-full blur-3xl" />

                {/* Content */}
                <div className="relative z-10 space-y-6">
                  {/* Profile */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan to-purple" />
                    <div>
                      <div className="font-bold text-lg">Sarah Chen</div>
                      <div className="text-foreground/60">Tech Writer</div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="space-y-4">
                    <p className="text-foreground/80 leading-relaxed">
                      "After years of building my voice online, I wanted to make sure my readers knew my work was authentically mine. Verifily gives me that proof."
                    </p>

                    {/* Verification Badge */}
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                      className="inline-flex items-center gap-2 bg-cyan/20 border border-cyan/50 px-4 py-2 rounded-full"
                    >
                      <Award className="w-5 h-5 text-cyan" />
                      <span className="font-semibold text-cyan">Verified Human Content</span>
                    </motion.div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                    {[
                      { label: 'Engagement', value: '+47%' },
                      { label: 'Trust Score', value: '98%' },
                      { label: 'Followers', value: '+2.3K' },
                    ].map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold gradient-text">
                          {stat.value}
                        </div>
                        <div className="text-xs text-foreground/60 mt-1">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                animate={{ y: [0, -10, 0] }}
                className="absolute -top-8 -right-8 glass p-4 rounded-2xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-cyan rounded-full animate-pulse" />
                  <span className="font-semibold text-sm">Live Verified</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
