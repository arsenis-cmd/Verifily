'use client';

import { motion } from 'framer-motion';
import { Search, Shield, Lock } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Detect',
      icon: Search,
      description: 'Instantly analyze any text on the web. Our AI detection identifies machine-generated content with 95%+ accuracy.',
    },
    {
      number: '02',
      title: 'Verify',
      icon: Shield,
      description: 'Wrote something yourself? Verify it as human-created with one click. Your content gets a unique cryptographic proof.',
    },
    {
      number: '03',
      title: 'Protect',
      icon: Lock,
      description: 'Your verified content joins a growing repository of authenticated human work—protected, attributed, and ready for the future of AI.',
    },
  ];

  return (
    <section id="how-it-works">
      <div className="container">
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ marginBottom: '80px' }}
          >
            <div style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50px',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              How It Works
            </div>
            <h2>Three Simple Steps</h2>
          </motion.div>

          {/* Steps Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '40px'
          }}>
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="glass"
                style={{
                  padding: '40px 30px',
                  borderRadius: '20px',
                  textAlign: 'center'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 30px',
                  background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <step.icon size={40} color="#0a1628" strokeWidth={2} />
                </div>

                {/* Number */}
                <div style={{
                  fontSize: '1rem',
                  color: '#00d4ff',
                  fontWeight: 'bold',
                  marginBottom: '15px'
                }}>
                  {step.number}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '1.75rem',
                  marginBottom: '15px',
                  fontWeight: 'bold'
                }}>
                  {step.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: 'rgba(255, 255, 255, 0.7)',
                  margin: 0
                }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
