import { useEffect, useRef, useState } from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';

// ── Terminal demo showing Verifily annotate output ──────────────────
const TerminalDemo = () => {
  const bars = [
    { label: 'coherence', value: 0.943, filled: 18 },
    { label: 'informativeness', value: 0.890, filled: 17 },
    { label: 'complexity', value: 0.751, filled: 15 },
    { label: 'safety', value: 0.993, filled: 19 },
    { label: 'formatting', value: 0.717, filled: 14 },
    { label: 'uniqueness', value: 0.294, filled: 5 },
  ];

  return (
    <div className="relative bg-[#0d1117] rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-slate-700/30">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 text-xs text-slate-500 font-mono">terminal — verifily</span>
      </div>

      {/* Terminal body */}
      <div className="p-5 md:p-6 font-mono text-[13px] leading-relaxed">
        <div className="text-slate-500">$ verifily annotate --in data.jsonl</div>

        <div className="mt-4 space-y-2">
          {bars.map((bar) => (
            <div key={bar.label} className="flex items-center gap-3">
              <span className="text-slate-400 w-[140px] text-right text-xs">{bar.label}</span>
              <span className="text-blue-400">
                {'█'.repeat(bar.filled)}
                <span className="text-slate-700">{'░'.repeat(20 - bar.filled)}</span>
              </span>
              <span className="text-white text-xs">{bar.value.toFixed(3)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Hero component ─────────────────────────────────────────────
const Hero = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger || reducedMotion) return;

    const gsap = window.gsap;

    const ctx = gsap.context(() => {
      // Intro fade-in
      const intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
      intro
        .fromTo(
          headlineRef.current?.querySelectorAll('.hero-anim') || [],
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 0.9, stagger: 0.1 }
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7 },
          '-=0.5'
        );

      // Scroll-driven hero reveal
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=120%',
          scrub: 0.5,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      tl
        .to(ctaRef.current, { y: -60, opacity: 0, duration: 0.3, ease: 'none' }, 0)
        .to(headlineRef.current, { y: -120, opacity: 0, duration: 0.4, ease: 'none' }, 0.05)
        .to(glowRef.current, { scale: 1.4, opacity: 0.15, duration: 1, ease: 'none' }, 0)
        .fromTo(
          demoRef.current,
          { y: 400, opacity: 0, scale: 0.96 },
          { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'none' },
          0.2
        );
    }, sectionRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  // Reduced motion: static layout
  if (reducedMotion) {
    return (
      <section className="relative bg-black overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
        <div className="relative z-10 py-24 px-4">
          <div className="max-w-5xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-6">
              ML data quality<br />
              <span className="gradient-text">infrastructure.</span>
            </h1>
            <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Score every row across 6 quality axes with trained DeBERTa models. Select the best subset. Predict training outcomes. Gate your releases.
            </p>
            <div className="flex items-center justify-center gap-4">
              <a href="#waitlist" className="cta-gradient text-white font-medium px-8 py-4 rounded-full inline-flex items-center gap-2">
                Join the waitlist <ChevronRight className="w-5 h-5" />
              </a>
              <a href="#" className="text-white/70 hover:text-white font-medium px-6 py-4 inline-flex items-center gap-2 transition-colors">
                Read the docs <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
          <div className="max-w-3xl mx-auto">
            <TerminalDemo />
          </div>
        </div>
      </section>
    );
  }

  // Animated hero with pinned scroll reveal
  return (
    <section
      ref={sectionRef}
      className="relative h-screen bg-black overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none" />
      <div
        ref={glowRef}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-3xl pointer-events-none will-change-transform"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />

      {/* Headline + bullets + CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
        <div ref={headlineRef} className="text-center max-w-5xl will-change-transform">
          <h1 className="hero-anim text-4xl md:text-6xl lg:text-7xl font-semibold text-white leading-tight mb-6">
            ML data quality
            <br />
            <span className="gradient-text">infrastructure.</span>
          </h1>
          <p className="hero-anim text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Score every row across 6 quality axes with trained DeBERTa models.
            Select the best subset. Predict training outcomes. Gate your releases.
          </p>
          <div className="hero-anim flex flex-col items-start gap-3 max-w-lg mx-auto text-left mb-2">
            <div className="flex items-start gap-3">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">&#10003;</span>
              <span className="text-white/60 text-sm">6-axis quality scoring — coherence, informativeness, complexity, safety, formatting, uniqueness</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">&#10003;</span>
              <span className="text-white/60 text-sm">Quality-aware data selection with deduplication</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">&#10003;</span>
              <span className="text-white/60 text-sm">Training outcome prediction with risk factors</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-400 mt-0.5 flex-shrink-0">&#10003;</span>
              <span className="text-white/60 text-sm">Pipeline gate: SHIP, INVESTIGATE, or DON'T SHIP — exit code 0 means ship</span>
            </div>
          </div>
        </div>

        <div ref={ctaRef} className="mt-8 flex items-center gap-4 will-change-transform">
          <a href="#waitlist" className="cta-gradient text-white font-medium px-8 py-4 rounded-full flex items-center gap-2 hover:opacity-90 transition-opacity">
            Join the waitlist
            <ChevronRight className="w-5 h-5" />
          </a>
          <a href="#" className="text-white/70 hover:text-white font-medium px-4 py-4 flex items-center gap-2 transition-colors">
            Read the docs
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Terminal demo — revealed on scroll */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div
          ref={demoRef}
          className="max-w-3xl w-full px-4 opacity-0 will-change-transform pointer-events-auto"
        >
          <TerminalDemo />
        </div>
      </div>
    </section>
  );
};

export default Hero;
