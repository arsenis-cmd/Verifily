'use client';

import { motion } from 'framer-motion';
import { Quote, Star } from 'lucide-react';

export default function Testimonials() {
  const testimonials = [
    {
      name: 'Alex Rivera',
      role: 'Tech Journalist',
      company: 'TechDaily',
      avatar: 'AR',
      quote: "Verifily has become essential for my research. I can instantly verify sources and detect AI-written content. It's saved me from publishing misleading information multiple times.",
      rating: 5,
    },
    {
      name: 'Maya Patel',
      role: 'Content Creator',
      company: '@MayaWrites',
      avatar: 'MP',
      quote: "As a writer, proving my work is human-written sets me apart. Verifily gave my audience confidence and my engagement went up 40%.",
      rating: 5,
    },
    {
      name: 'David Kim',
      role: 'Academic Researcher',
      company: 'Stanford University',
      avatar: 'DK',
      quote: "The accuracy is impressive. We use Verifily to screen student submissions and research papers. It's faster and more reliable than any tool we've tried.",
      rating: 5,
    },
    {
      name: 'Sophie Chen',
      role: 'Marketing Director',
      company: 'BrandFlow',
      avatar: 'SC',
      quote: "Our team reviews hundreds of content pieces weekly. Verifily helps us maintain authenticity in our campaigns and catch AI-generated spam.",
      rating: 5,
    },
    {
      name: 'James Wilson',
      role: 'Developer',
      company: 'OpenSource',
      avatar: 'JW',
      quote: "Clean UI, fast detection, privacy-focused. Exactly what I needed. The API integration was seamless for our project.",
      rating: 5,
    },
    {
      name: 'Priya Sharma',
      role: 'Social Media Manager',
      company: 'Digital Hub',
      avatar: 'PS',
      quote: "Managing multiple client accounts means dealing with tons of content. Verifily helps me spot fake reviews and AI-generated comments instantly.",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-cyan/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-purple/10 rounded-full blur-3xl" />

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
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Trusted by Thousands
            <br />
            <span className="gradient-text">Across the Globe</span>
          </h2>
          <p className="text-xl text-foreground/70">
            See what our users have to say about Verifily
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="glass p-8 rounded-2xl hover:border-cyan/50 transition-all cursor-pointer relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-cyan/20">
                <Quote size={40} />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className="fill-cyan text-cyan"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground/80 leading-relaxed mb-6 relative z-10">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan to-purple flex items-center justify-center font-bold text-navy">
                  {testimonial.avatar}
                </div>

                {/* Info */}
                <div>
                  <div className="font-bold">{testimonial.name}</div>
                  <div className="text-sm text-foreground/60">
                    {testimonial.role} • {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Social Proof Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="max-w-4xl mx-auto mt-20 glass p-12 rounded-3xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              { value: '50,000+', label: 'Active Users' },
              { value: '4.9/5', label: 'Average Rating' },
              { value: '2M+', label: 'Texts Verified' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
              >
                <div className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                  {stat.value}
                </div>
                <div className="text-foreground/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
