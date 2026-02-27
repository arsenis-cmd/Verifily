import { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const bannerRef = useRef<HTMLDivElement>(null);

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

      const cards = cardsRef.current?.querySelectorAll('.feature-card');
      cards?.forEach((card, index) => {
        const directions = [
          { x: -40, y: 50 },
          { x: 0, y: 50 },
          { x: 40, y: 50 },
          { x: -40, y: 30 },
          { x: 40, y: 30 },
        ];
        const dir = directions[index] || { x: 0, y: 50 };

        gsap.fromTo(
          card,
          { opacity: 0, x: dir.x, y: dir.y, scale: 0.95 },
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.8,
            delay: index * 0.15,
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
        bannerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: bannerRef.current,
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
      id="features"
      className="relative bg-white py-24 overflow-hidden"
    >
      {/* Headline */}
      <div ref={headlineRef} className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-semibold text-slate-900">
          Core <span className="gradient-text">capabilities</span>
        </h2>
      </div>

      {/* Feature Cards */}
      <div ref={cardsRef} className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Quality Annotation */}
          <div className="feature-card bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">Quality Annotation</h3>
            <p className="text-white/80 mb-4">
              6 axes. Trained DeBERTa ensemble. Per-row scores.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Score every row across coherence, informativeness, complexity, safety,
              formatting, and uniqueness. Three DeBERTa-v3-large models trained on
              105,000 human annotations — not heuristics.
            </p>
            {/* Mini preview */}
            <div className="space-y-2 mt-6">
              {['coherence', 'informativeness', 'complexity', 'safety', 'formatting', 'uniqueness'].map((axis, i) => (
                <div key={i} className="bg-white/15 backdrop-blur rounded-lg px-3 py-2 flex items-center gap-3">
                  <span className="text-white/90 text-sm font-medium">{axis}</span>
                  <svg className="ml-auto w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ))}
            </div>
          </div>

          {/* Data Selection */}
          <div className="feature-card bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">Data Selection</h3>
            <p className="text-white/80 mb-2">
              Quality-aware subsetting with dedup.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Select the best rows for training with the quality_diverse strategy.
              Automatic deduplication. Budget control. Quality goes up, diversity
              stays high.
            </p>
            <div className="mt-6 bg-white/15 backdrop-blur rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Before</span>
                <span className="text-white font-mono text-sm">200 rows &middot; avg 0.736</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">After</span>
                <span className="text-white font-mono text-sm font-bold">100 rows &middot; avg 0.780</span>
              </div>
            </div>
          </div>

          {/* Quality Prediction */}
          <div className="feature-card bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">Quality Prediction</h3>
            <p className="text-white/80 mb-2">
              Forecast outcomes before training.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Predict training tier, confidence, and risk factors. Loss multiplier
              estimation. Tier classification from excellent to unusable — with
              specific fix commands.
            </p>
            <div className="mt-6 bg-white/15 backdrop-blur rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-xs">Tier</span>
                <span className="text-white font-mono text-sm font-bold">GOOD</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-xs">Confidence</span>
                <span className="text-white font-mono text-sm">82%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Risk factors</span>
                <span className="text-white font-mono text-sm">2</span>
              </div>
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Contamination Gate */}
          <div className="feature-card bg-gradient-to-br from-red-500 to-rose-600 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">Contamination Gate</h3>
            <p className="text-white/80 mb-2">
              Know when your eval set is lying.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              SHA-256 exact matching, n-gram Jaccard similarity, and SQL-aware
              fingerprinting catch verbatim copies and light paraphrases.
              Configurable thresholds. MinHash LSH at scale.
            </p>
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/70 text-xs">Exact overlaps</span>
                <span className="text-white font-mono text-sm font-bold">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-xs">Near duplicates</span>
                <span className="text-white font-mono text-sm font-bold">7</span>
              </div>
            </div>
          </div>

          {/* REST API & Platform */}
          <div className="feature-card bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-3">REST API & Platform</h3>
            <p className="text-white/80 mb-2">
              60+ endpoints. Auth, billing, teams, async jobs.
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Full REST API with bearer auth, rate limiting, usage metering,
              billing enforcement, RBAC, and a Python SDK. Run quality scoring
              as a service in your ML pipeline.
            </p>
            <div className="mt-6 bg-white/10 backdrop-blur rounded-xl p-4 font-mono text-xs">
              <div className="text-slate-400">{`{`}</div>
              <div className="text-slate-400 pl-4">"coherence": <span className="text-blue-400">0.943</span>,</div>
              <div className="text-slate-400 pl-4">"informativeness": <span className="text-blue-400">0.890</span>,</div>
              <div className="text-slate-400 pl-4">"safety": <span className="text-blue-400">0.993</span>,</div>
              <div className="text-slate-400 pl-4">"overall": <span className="text-white">0.812</span></div>
              <div className="text-slate-400">{`}`}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div ref={bannerRef} className="max-w-5xl mx-auto px-4 mt-12">
        <a href="#waitlist" className="block relative overflow-hidden rounded-2xl bg-slate-900 cursor-pointer group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-violet-500/20 group-hover:opacity-80 transition-opacity" />
          <div className="relative flex items-center justify-between px-8 py-6">
            <p className="text-white text-xl font-semibold">
              The quality layer between your data and your models.
            </p>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-2 transition-transform" />
          </div>
        </a>
      </div>
    </section>
  );
};

export default Features;
