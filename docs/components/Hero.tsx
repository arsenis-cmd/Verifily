'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';

export default function Hero() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center"
      style={{ paddingTop: '100px', paddingBottom: '100px' }}
    >
      {/* Simple gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(135deg, #0a1628 0%, #1a365d 50%, #0f2137 100%)',
          zIndex: 0
        }}
      />

      {/* Content */}
      <div className="container" style={{ zIndex: 10, position: 'relative' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50px',
              marginBottom: '40px'
            }}
          >
            <span style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)' }}>
              ⚡ Powered by Advanced AI Detection
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ marginBottom: '30px' }}
          >
            Know what's AI.
            <br />
            <span className="gradient-text">Prove what's human.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            style={{
              maxWidth: '700px',
              margin: '0 auto 50px auto',
              fontSize: '1.25rem',
              lineHeight: '1.8',
              color: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            The browser extension that detects AI-generated content and lets you verify your authentic human work.
            <span style={{ color: '#00d4ff' }}> Join the trust layer for the AI era.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}
          >
            <a href="#cta" className="btn btn-primary">
              Add to Chrome - It's Free
              <ArrowRight size={20} />
            </a>
            <a href="#how-it-works" className="btn btn-ghost">
              See How It Works
              <Shield size={20} />
            </a>
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            style={{
              display: 'flex',
              gap: '40px',
              justifyContent: 'center',
              marginTop: '60px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔒 Privacy-first
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Works instantly
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              🛡️ 95%+ accuracy
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
