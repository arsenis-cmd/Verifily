'use client';

import { motion } from 'framer-motion';
import { Chrome, ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section id="cta" style={{ background: 'linear-gradient(135deg, #1a365d 0%, #0a1628 100%)' }}>
      <div className="container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Title */}
            <h2 style={{ marginBottom: '30px' }}>
              Ready to <span className="gradient-text">Join the Movement</span>?
            </h2>

            {/* Description */}
            <p style={{
              fontSize: '1.25rem',
              marginBottom: '50px',
              color: 'rgba(255, 255, 255, 0.7)',
              maxWidth: '600px',
              margin: '0 auto 50px'
            }}>
              Install Verifily today and start verifying authenticity across the web.
              Free forever. No credit card required.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              gap: '20px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <a
                href="https://chrome.google.com/webstore"
                className="btn btn-primary"
                style={{ fontSize: '1.125rem', padding: '1.125rem 2.5rem' }}
              >
                <Chrome size={24} />
                Add to Chrome - It's Free
                <ArrowRight size={20} />
              </a>
            </div>

            {/* Trust Info */}
            <div style={{
              marginTop: '40px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)'
            }}>
              ✓ No signup required  •  ✓ Works instantly  •  ✓ Privacy-first
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
