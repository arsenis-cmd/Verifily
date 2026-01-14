'use client';

import { motion } from 'framer-motion';
import { Shield, Award, Lock, Globe, BarChart3, Zap } from 'lucide-react';

export default function FeaturesGrid() {
  const features = [
    {
      icon: Shield,
      title: 'AI Detection',
      description: 'Ensemble detection using perplexity analysis, burstiness patterns, and stylometric analysis.',
    },
    {
      icon: Award,
      title: 'Verification Badges',
      description: 'Get a shareable "Verified Human" badge for your content.',
    },
    {
      icon: Lock,
      title: 'Privacy-First',
      description: 'Your content is encrypted client-side. We can\'t read it.',
    },
    {
      icon: Globe,
      title: 'Works Everywhere',
      description: 'Chrome today. Firefox, Safari, and Edge coming soon.',
    },
    {
      icon: BarChart3,
      title: 'Creator Dashboard',
      description: 'Track your verifications and manage your verified portfolio.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: '<100ms detection. Real-time analysis as you browse.',
    },
  ];

  return (
    <section id="features" style={{ background: '#0f2137' }}>
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
            <h2>Powerful Features</h2>
            <p style={{ maxWidth: '600px', margin: '0 auto', color: 'rgba(255, 255, 255, 0.7)' }}>
              Everything you need to detect AI content and verify human authenticity
            </p>
          </motion.div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '30px'
          }}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass"
                style={{
                  padding: '35px 25px',
                  borderRadius: '20px',
                  textAlign: 'center'
                }}
              >
                {/* Icon */}
                <div style={{
                  width: '60px',
                  height: '60px',
                  margin: '0 auto 20px',
                  background: 'rgba(0, 212, 255, 0.1)',
                  borderRadius: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <feature.icon size={30} color="#00d4ff" strokeWidth={2} />
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '1.25rem',
                  marginBottom: '10px',
                  fontWeight: '600'
                }}>
                  {feature.title}
                </h3>

                {/* Description */}
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.6',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0
                }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
