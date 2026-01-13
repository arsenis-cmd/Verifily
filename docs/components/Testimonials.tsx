'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Quote, Star } from 'lucide-react';

export default function Testimonials() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const testimonials = [
    {
      quote: 'Finally, a way to prove my writing is mine. This is what the internet needs.',
      author: 'Sarah K.',
      role: 'Freelance Journalist',
      avatar: 'SK',
    },
    {
      quote: "I've been looking for something like this since ChatGPT launched. Game changer.",
      author: 'Marcus T.',
      role: 'Content Creator',
      avatar: 'MT',
    },
    {
      quote: 'The accuracy is impressive. Essential tool for the AI era.',
      author: 'David Chen',
      role: 'Academic Researcher',
      avatar: 'DC',
    },
  ];

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-10" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-accent-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />

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
            <span className="text-accent-500 font-semibold text-sm uppercase tracking-wider">Testimonials</span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold font-heading mb-6">
            What Creators{' '}
            <span className="gradient-text">Are Saying</span>
          </h2>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              className="glass-strong p-8 rounded-3xl hover:scale-105 transition-all duration-500 group cursor-pointer relative"
            >
              {/* Quote icon */}
              <Quote className="w-12 h-12 text-accent-500/20 absolute top-6 right-6" />

              {/* Rating */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-accent-500 text-accent-500"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-white/80 leading-relaxed mb-6 text-lg relative z-10">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-500 to-purple-500 flex items-center justify-center font-bold text-sm">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-bold text-white">{testimonial.author}</div>
                  <div className="text-sm text-white/60">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
