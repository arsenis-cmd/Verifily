'use client';

import { motion } from 'framer-motion';

export default function Roadmap() {
  const milestones = [
    { quarter: 'Q1 2026', title: 'Chrome Extension Launch', status: '✓ Live Now' },
    { quarter: 'Q2 2026', title: 'Platform APIs & Badges', status: 'Coming Soon' },
    { quarter: 'Q3 2026', title: 'Enterprise Solutions', status: 'Planned' },
    { quarter: 'Q4 2026', title: 'Regulatory Certification', status: 'Planned' },
  ];

  return (
    <section id="roadmap">
      <div className="container">
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ marginBottom: '80px' }}>
              Product <span className="gradient-text">Roadmap</span>
            </h2>

            {/* Timeline */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '30px'
            }}>
              {milestones.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="glass"
                  style={{
                    padding: '30px 20px',
                    borderRadius: '15px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{
                    color: '#00d4ff',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    marginBottom: '15px'
                  }}>
                    {milestone.quarter}
                  </div>
                  <h3 style={{
                    fontSize: '1.125rem',
                    marginBottom: '10px',
                    fontWeight: '600'
                  }}>
                    {milestone.title}
                  </h3>
                  <div style={{
                    fontSize: '0.875rem',
                    color: 'rgba(255, 255, 255, 0.6)'
                  }}>
                    {milestone.status}
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
