import { useEffect, useRef } from 'react';

const Stats = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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

      const cards = cardsRef.current?.querySelectorAll('.stat-card');
      cards?.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 60, scale: 0.95 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            delay: index * 0.2,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: cardsRef.current,
              start: 'top 75%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      });

      gsap.fromTo(
        bottomRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          delay: 0.3,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: bottomRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="proof"
      className="relative bg-white py-24 overflow-hidden"
    >
      {/* Headline */}
      <div ref={headlineRef} className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 mb-4">
          Measured, not claimed.
        </h2>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Trained on 105,000 human annotations. Tested with 1,725 automated checks.
          Built for production ML pipelines.
        </p>
      </div>

      {/* Stats Cards */}
      <div ref={cardsRef} className="max-w-4xl mx-auto px-4 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="stat-card bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white text-center">
            <div className="text-5xl md:text-6xl font-bold mb-2">6</div>
            <p className="text-sm font-medium mb-1">Quality axes</p>
            <p className="text-white/60 text-xs">Scored by trained DeBERTa ensemble</p>
          </div>

          <div className="stat-card bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white text-center">
            <div className="text-5xl md:text-6xl font-bold mb-2">1,725</div>
            <p className="text-sm font-medium mb-1">Tests passing</p>
            <p className="text-white/60 text-xs">1 skipped</p>
          </div>

          <div className="stat-card bg-gradient-to-br from-slate-700 to-slate-900 rounded-3xl p-6 text-white text-center">
            <div className="text-5xl md:text-6xl font-bold mb-2">60+</div>
            <p className="text-sm font-medium mb-1">API endpoints</p>
            <p className="text-white/60 text-xs">Auth, billing, teams</p>
          </div>

          <div className="stat-card bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white text-center">
            <div className="text-5xl md:text-6xl font-bold mb-2">105k</div>
            <p className="text-sm font-medium mb-1">Human annotations</p>
            <p className="text-white/60 text-xs">Used to train quality models</p>
          </div>
        </div>
      </div>

      {/* Bottom line */}
      <div ref={bottomRef} className="max-w-4xl mx-auto px-4">
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
          <p className="text-slate-600 font-mono text-sm">
            1,725 tests &middot; 6 quality axes &middot; 60+ API endpoints &middot; Trained DeBERTa-v3-large ensemble
          </p>
        </div>
      </div>
    </section>
  );
};

export default Stats;
