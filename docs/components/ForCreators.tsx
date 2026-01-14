'use client';

import { motion } from 'framer-motion';

export default function ForCreators() {
  const benefits = [
    'Prove your work is human-created',
    'Build trust with your audience',
    'Protect your creative reputation',
    'Stand out in the AI era'
  ];

  return (
    <section id="for-creators" style={{ background: '#0f2137' }}>
      <div className="container">
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ marginBottom: '30px' }}>
              Built for <span className="gradient-text">Creators</span>
            </h2>

            <p style={{
              fontSize: '1.25rem',
              marginBottom: '60px',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '700px',
              margin: '0 auto 60px'
            }}>
              Whether you're a writer, developer, or content creator,
              Verifily helps you stand out in an AI-filled world.
            </p>

            {/* Benefits Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '30px'
            }}>
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass"
                  style={{
                    padding: '30px',
                    borderRadius: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                  }}
                >
                  <div style={{
                    width: '50px',
                    height: '50px',
                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    flexShrink: 0
                  }}>
                    ✓
                  </div>
                  <span style={{ fontSize: '1.125rem', textAlign: 'left' }}>
                    {benefit}
                  </span>
                </motion.div>
              ))}
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
