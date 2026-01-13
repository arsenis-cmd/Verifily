'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, Chrome } from 'lucide-react';

export default function CTASection() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setSubmitted(true);
    setTimeout(() => {
      setEmail('');
      setSubmitted(false);
    }, 3000);
  };

  return (
    <section id="cta" className="py-32 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900 via-primary-800 to-primary-900" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-accent-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Card */}
          <div className="glass-strong p-12 md:p-20 rounded-3xl text-center space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-accent-500/20 border border-accent-500/50 px-6 py-3 rounded-full"
            >
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse" />
              <span className="font-semibold text-accent-500">Limited Beta Access</span>
            </motion.div>

            {/* Headline */}
            <div>
              <h2 className="text-5xl md:text-7xl font-bold font-heading mb-6">
                Ready to Verify the{' '}
                <span className="gradient-text">Truth?</span>
              </h2>
              <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
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
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full pl-12 pr-4 py-4 bg-primary-900 border border-white/10 rounded-full focus:outline-none focus:border-accent-500/50 focus:ring-2 focus:ring-accent-500/20 transition-all text-white placeholder-white/30"
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary whitespace-nowrap group px-8"
                  >
                    Get Extension
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <p className="text-sm text-white/40 mt-4">
                  Free forever. No credit card required.
                </p>
              </motion.form>
            ) : (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-3 py-6"
              >
                <CheckCircle className="w-16 h-16 text-success-500" />
                <p className="text-xl font-semibold text-success-500">Thank you!</p>
                <p className="text-white/60">Check your email for next steps.</p>
              </motion.div>
            )}

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-8 pt-8 border-t border-white/10"
            >
              {[
                'No Account Required',
                'Privacy First',
                'Always Free',
                '10K+ Waitlist',
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-white/60"
                >
                  <CheckCircle className="w-5 h-5 text-accent-500" />
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
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center mt-12 space-y-4"
          >
            <p className="text-white/40">
              <Chrome className="w-4 h-4 inline mr-2" />
              Available on Chrome Web Store • Coming soon to Firefox & Safari
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
