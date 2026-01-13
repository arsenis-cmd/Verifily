'use client';

import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Pen, Users, TrendingUp, Award } from 'lucide-react';

export default function ForCreators() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Parallax values
  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [150, -150]);
  const y3 = useTransform(scrollYProgress, [0, 1], [80, -80]);

  const creators = [
    {
      icon: Pen,
      title: 'Writers & Journalists',
      description: 'Finally prove your articles are original. Build trust with editors and readers.',
      emoji: '✍️',
      gradient: 'from-accent-500 to-accent-300',
      parallaxY: y1,
    },
    {
      icon: Award,
      title: 'Artists & Designers',
      description: 'Protect your creative work. Verify your human artistry in an AI world.',
      emoji: '🎨',
      gradient: 'from-purple-500 to-purple-400',
      parallaxY: y2,
    },
    {
      icon: Users,
      title: 'Developers & Builders',
      description: 'Document your original code. Prove your contributions are authentic.',
      emoji: '💻',
      gradient: 'from-success-500 to-success-400',
      parallaxY: y3,
    },
  ];

  return (
    <section id="for-creators" ref={ref} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-10" />
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

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
            <span className="text-purple-400 font-semibold text-sm uppercase tracking-wider">For Creators</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
            Built for People Who{' '}
            <span className="gradient-text">Create</span>
          </h2>
        </motion.div>

        {/* Creators Grid */}
        <div className="max-w-6xl mx-auto space-y-12">
          {creators.map((creator, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 + index * 0.2 }}
              className="group"
            >
              <div className="glass-strong p-10 md:p-16 rounded-3xl relative overflow-hidden hover:scale-[1.02] transition-all duration-500">
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${creator.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                  {/* Content */}
                  <div className={`space-y-6 ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${creator.gradient} bg-opacity-10 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <creator.icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                    </div>

                    <h3 className="text-3xl md:text-4xl font-bold font-heading text-white">
                      {creator.title}
                    </h3>

                    <p className="text-xl text-white/70 leading-relaxed">
                      {creator.description}
                    </p>

                    <div className={`h-1 w-24 bg-gradient-to-r ${creator.gradient} rounded-full opacity-50 group-hover:w-full group-hover:opacity-100 transition-all duration-500`} />
                  </div>

                  {/* Visual with Parallax */}
                  <motion.div
                    style={{ y: creator.parallaxY }}
                    className={`${index % 2 === 1 ? 'md:order-1' : ''}`}
                  >
                    <div className="relative">
                      <div className={`aspect-square rounded-3xl bg-gradient-to-br ${creator.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-500 flex items-center justify-center`}>
                        <div className="text-9xl">{creator.emoji}</div>
                      </div>

                      {/* Floating badge */}
                      <motion.div
                        animate={{
                          y: [0, -10, 0],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="absolute -top-6 -right-6 glass px-4 py-2 rounded-full flex items-center gap-2"
                      >
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${creator.gradient} animate-pulse`} />
                        <span className="text-sm font-semibold">Verified</span>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-20"
        >
          <p className="text-xl text-white/60 mb-8">
            Join <span className="gradient-text font-bold">10,000+ creators</span> on the waitlist
          </p>
          <a
            href="#cta"
            className="btn btn-ghost text-lg hover:glow-hover-cyan"
          >
            Get Early Access
          </a>
        </motion.div>
      </div>
    </section>
  );
}
