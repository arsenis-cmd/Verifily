'use client';

import { motion } from 'framer-motion';

export default function LiveDemo() {
  return (
    <section id="demo">
      <div className="container">
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 style={{ marginBottom: '30px' }}>
              See It In <span className="gradient-text">Action</span>
            </h2>

            <p style={{
              marginBottom: '50px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              Try our live AI detection demo below
            </p>

            {/* Demo Placeholder */}
            <div className="glass-strong" style={{
              padding: '60px 40px',
              borderRadius: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '3rem',
                marginBottom: '20px'
              }}>
                🎯
              </div>
              <h3 style={{ marginBottom: '15px' }}>Interactive Demo Coming Soon</h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.6)',
                margin: 0
              }}>
                Install the extension to try it on any webpage
              </p>
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
}
