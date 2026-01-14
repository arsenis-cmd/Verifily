'use client';

import { motion } from 'framer-motion';

export default function Testimonials() {
  const testimonials = [
    {
      quote: 'Finally, a way to prove my writing is mine. This is what the internet needs.',
      author: 'Sarah K.',
      role: 'Freelance Journalist',
    },
    {
      quote: "I've been looking for something like this since ChatGPT launched. Game changer.",
      author: 'Marcus T.',
      role: 'Content Creator',
    },
    {
      quote: 'The accuracy is impressive. Essential tool for the AI era.',
      author: 'David Chen',
      role: 'Academic Researcher',
    },
  ];

  return (
    <section style={{ background: '#0f2137' }}>
      <div className="container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ marginBottom: '80px' }}>
              What <span className="gradient-text">People Say</span>
            </h2>

            {/* Testimonials Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '30px'
            }}>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass"
                  style={{
                    padding: '35px 30px',
                    borderRadius: '20px',
                    textAlign: 'left'
                  }}
                >
                  <div style={{
                    fontSize: '2rem',
                    color: '#00d4ff',
                    marginBottom: '20px'
                  }}>
                    "
                  </div>
                  <p style={{
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    marginBottom: '25px',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    {testimonial.quote}
                  </p>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                      {testimonial.author}
                    </div>
                    <div style={{
                      fontSize: '0.875rem',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {testimonial.role}
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
