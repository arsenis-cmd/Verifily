'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('error');
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center bg-[#000000] border-t border-[#111111]">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center text-center">
          {/* Heading */}
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Join the <span className="text-[#3b82f6]">conversation</span>
          </h2>

          {/* Divider */}
          <div className="w-16 h-[2px] bg-white/20 mx-auto mb-6" />

          {/* Description */}
          <p className="text-lg text-[#a1a1a1] max-w-2xl mb-12">
            Stay updated on the latest developments in AI detection and content verification.
            Get early access to new features and exclusive insights.
          </p>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full sm:flex-1 px-8 py-6 bg-[#111111] border border-[#222222] rounded-full text-white text-lg placeholder:text-[#666666] focus:outline-none focus:border-[#3b82f6] transition-colors"
              />
              <Button variant="primary" size="lg" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
              </Button>
            </div>

            {/* Status messages */}
            {status === 'success' && (
              <p className="mt-4 text-green-500 text-sm">
                Thanks for subscribing! Check your inbox.
              </p>
            )}
            {status === 'error' && (
              <p className="mt-4 text-red-500 text-sm">
                Something went wrong. Please try again.
              </p>
            )}
          </form>

          {/* Trust indicators */}
          <div className="flex items-center gap-6 mt-8 text-sm text-[#666666]">
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span> No spam
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Unsubscribe anytime
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">✓</span> Privacy first
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
