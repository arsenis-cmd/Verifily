'use client';

import { motion } from 'framer-motion';

export default function Testimonials() {
  const testimonials = [
    {
      quote:
        'Finally, a way to prove my articles are actually written by me. Essential for any serious writer.',
      author: 'Sarah Chen',
      role: 'Freelance Journalist',
    },
    {
      quote:
        "I use Verifily to check every piece of content before publishing. It's become part of my workflow.",
      author: 'Marcus Webb',
      role: 'Content Director',
    },
    {
      quote:
        'The verification badge gives my portfolio instant credibility. Clients love it.',
      author: 'Priya Sharma',
      role: 'UX Writer',
    },
  ];

  return (
    <section className="bg-[#0a0a0a]">
      <div className="container">
        <div className="max-w-[1000px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg text-center mb-20">
              What creators are saying
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card relative"
                >
                  {/* Large quote mark background */}
                  <div className="absolute top-4 left-4 text-6xl text-[#222222] leading-none">
                    "
                  </div>

                  <div className="relative z-10">
                    <p className="body-md mb-6 leading-relaxed">
                      {testimonial.quote}
                    </p>

                    <div className="border-t border-[#222222] pt-4">
                      <div className="font-semibold text-white mb-1">
                        {testimonial.author}
                      </div>
                      <div className="text-sm text-[#666666]">
                        {testimonial.role}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
