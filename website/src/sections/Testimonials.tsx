import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

const Testimonials = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;

    const gsap = window.gsap;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headlineRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headlineRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: contentRef.current,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const criteria = [
    'You need to measure data quality before training — not guess',
    'You want quality-aware data selection, not random sampling',
    'You\'ve been burned by contamination, silent regression, or bad training data',
    'You need a REST API for quality scoring in your ML pipeline',
    'You want one tool for annotation, selection, prediction, and gating',
  ];

  return (
    <section
      ref={sectionRef}
      id="waitlist"
      className="relative bg-black py-24 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute top-0 right-0 w-[600px] h-[400px] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
      />

      {/* Headline */}
      <div ref={headlineRef} className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4">
          Built for teams that
          <br />
          <span className="gradient-text">ship models weekly.</span>
        </h2>
        <p className="text-white/50 text-lg max-w-2xl mx-auto">
          Verifily is designed for ML engineers and platform teams who need a repeatable,
          auditable release process — not another monitoring dashboard.
        </p>
      </div>

      {/* Content */}
      <div ref={contentRef} className="max-w-3xl mx-auto px-4">
        <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-8 border border-slate-800">
          <p className="text-white/70 text-lg mb-8">You should talk to us if:</p>

          <div className="space-y-5">
            {criteria.map((item, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white/80 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-8 border-t border-slate-700/50">
            <p className="text-white/50 text-sm mb-6">
              Join the waitlist. We'll reach out when it's your turn.
            </p>
            {submitted ? (
              <p className="text-green-400 font-medium text-lg">You're on the list!</p>
            ) : (
              <form
                onSubmit={(e: FormEvent) => { e.preventDefault(); if (email.trim()) setSubmitted(true); }}
                className="flex items-center gap-3"
              >
                <input
                  type="email"
                  required
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white placeholder-white/30 rounded-full px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <button
                  type="submit"
                  className="cta-gradient text-white font-medium px-8 py-4 rounded-full hover:opacity-90 transition-opacity"
                >
                  Join the waitlist
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
