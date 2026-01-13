'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function CTA() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would connect to your email service
    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section id="cta" className="py-24 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy-light to-navy" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan/20 to-purple/20 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Card */}
          <div className="glass p-12 md:p-16 rounded-3xl text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-cyan/20 border border-cyan/50 px-4 py-2 rounded-full text-sm"
            >
              <div className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
              <span className="font-semibold">Limited Beta Access</span>
            </motion.div>

            {/* Headline */}
            <div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Ready to Verify the
                <br />
                <span className="gradient-text">Truth?</span>
              </h2>
              <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
                Join thousands of users who trust Verifily to detect AI content.
                Install the free Chrome extension today.
              </p>
            </div>

            {/* Email Form */}
            {!submitted ? (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                onSubmit={handleSubmit}
                className="max-w-md mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-navy-light border border-white/10 rounded-full focus:outline-none focus:border-cyan/50 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-8 py-4 bg-cyan text-navy rounded-full font-semibold hover:bg-cyan-dark transition-all flex items-center gap-2 justify-center group whitespace-nowrap"
                  >
                    Get Extension
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <p className="text-sm text-foreground/50 mt-4">
                  Free forever. No credit card required.
                </p>
              </motion.form>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center justify-center gap-3 text-cyan py-4"
              >
                <CheckCircle className="w-6 h-6" />
                <span className="text-lg font-semibold">Thank you! Check your email.</span>
              </motion.div>
            )}

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/10"
            >
              {[
                'No Account Required',
                'Privacy First',
                'Always Free',
                '50K+ Users',
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-foreground/70"
                >
                  <CheckCircle className="w-5 h-5 text-cyan" />
                  <span>{item}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center mt-12 space-y-4"
          >
            <p className="text-foreground/60">
              Available on Chrome Web Store • Coming soon to Firefox & Safari
            </p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="#"
                className="text-cyan hover:text-cyan-dark transition-colors"
              >
                Privacy Policy
              </a>
              <span className="text-foreground/30">•</span>
              <a
                href="#"
                className="text-cyan hover:text-cyan-dark transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
