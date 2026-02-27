import { useEffect, useRef, useState, useCallback } from 'react';

// ── Step configuration ──────────────────────────────────────────────
const STEPS = [
  {
    number: '01',
    title: 'Annotate',
    body: 'Score every row across 6 quality axes using a trained DeBERTa-v3-large ensemble. Three models, 105,000 human annotations. Not heuristics — real model inference.',
    highlight: ['DeBERTa-v3-large ensemble', '105,000 human annotations'],
    visualKey: 'annotate',
  },
  {
    number: '02',
    title: 'Select',
    body: 'Pick the best subset for training. Quality-aware selection with automatic deduplication. Quality goes up, diversity stays high.',
    highlight: ['Quality-aware selection', 'diversity stays high'],
    visualKey: 'select',
  },
  {
    number: '03',
    title: 'Predict',
    body: 'Forecast training outcomes before you spend compute. Risk factors with specific fix commands. Tier classification from excellent to unusable.',
    highlight: ['Forecast training outcomes', 'Tier classification'],
    visualKey: 'predict',
  },
  {
    number: '04',
    title: 'Gate',
    body: 'One command. All checks. One decision. SHIP, INVESTIGATE, or DON\'T SHIP — with exit codes your CI already understands.',
    highlight: ['SHIP, INVESTIGATE, or DON\'T SHIP', 'exit codes'],
    visualKey: 'gate',
  },
];

// ── Visual card for each step ───────────────────────────────────────
const StepVisual = ({ activeStep }: { activeStep: number }) => {
  const visuals: Record<string, React.ReactNode> = {
    annotate: (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800">Quality Profile</span>
          <span className="ml-auto text-xs text-slate-400 font-mono">6 axes</span>
        </div>
        {[
          { axis: 'coherence', score: 0.943, pct: 94 },
          { axis: 'informativeness', score: 0.890, pct: 89 },
          { axis: 'complexity', score: 0.751, pct: 75 },
          { axis: 'safety', score: 0.993, pct: 99 },
          { axis: 'formatting', score: 0.717, pct: 72 },
          { axis: 'uniqueness', score: 0.294, pct: 29 },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 py-2 border-t border-slate-100">
            <span className="text-xs text-slate-500 w-28">{item.axis}</span>
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.pct}%` }} />
            </div>
            <span className="text-xs text-slate-700 font-mono w-12 text-right">{item.score.toFixed(3)}</span>
          </div>
        ))}
      </div>
    ),

    select: (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800">Data Selection</span>
          <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">DONE</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">Before</p>
            <p className="text-2xl font-bold text-slate-800">200</p>
            <p className="text-xs text-slate-400">rows</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-1">After</p>
            <p className="text-2xl font-bold text-emerald-600">100</p>
            <p className="text-xs text-slate-400">rows</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm py-1.5 border-t border-slate-100">
            <span className="text-slate-500">Avg quality</span>
            <span className="font-mono text-slate-700">0.736 &rarr; <span className="text-emerald-600 font-semibold">0.780</span></span>
          </div>
          <div className="flex justify-between text-sm py-1.5 border-t border-slate-100">
            <span className="text-slate-500">Diversity</span>
            <span className="font-mono text-slate-700">1.000</span>
          </div>
          <div className="flex justify-between text-sm py-1.5 border-t border-slate-100">
            <span className="text-slate-500">Strategy</span>
            <span className="font-mono text-slate-700">quality_diverse</span>
          </div>
        </div>
      </div>
    ),

    predict: (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800">Training Prediction</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-slate-600">Predicted tier</span>
            <span className="text-sm font-bold text-emerald-700">GOOD</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Confidence</span>
            <span className="text-sm font-semibold text-slate-800 font-mono">82%</span>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-slate-500 font-medium mb-1">Risk factors</p>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">!</span>
            <span className="text-slate-600">Low uniqueness — run <span className="font-mono text-xs bg-slate-100 px-1 rounded">verifily select --dedup</span></span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <span className="text-amber-500 mt-0.5 flex-shrink-0">!</span>
            <span className="text-slate-600">Complexity below threshold on 12% of rows</span>
          </div>
        </div>
      </div>
    ),

    gate: (
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-lg">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-slate-800">Decision Summary</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-600">Recommendation</span>
            <span className="text-sm font-bold text-red-600">DON'T SHIP</span>
          </div>
          <p className="text-xs text-red-600">Contamination gate FAIL: dataset leakage detected</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Quality score</span>
            <span className="text-slate-800 font-mono">0.780</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Contamination</span>
            <span className="text-red-600 font-mono font-semibold">FAIL</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Exit code</span>
            <span className="text-red-600 font-mono font-bold">1</span>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div className="relative w-full">
      {STEPS.map((step, i) => (
        <div
          key={step.visualKey}
          className="absolute inset-0 transition-all duration-500 ease-out"
          style={{
            opacity: activeStep === i ? 1 : 0,
            transform: `translateY(${activeStep === i ? 0 : 20}px)`,
            pointerEvents: activeStep === i ? 'auto' : 'none',
          }}
        >
          {visuals[step.visualKey]}
        </div>
      ))}
      <div className="invisible">{visuals[STEPS[0].visualKey]}</div>
    </div>
  );
};

// ── Highlighted text renderer ───────────────────────────────────────
const renderHighlightedText = (text: string, highlights: string[]) => {
  let result = text;
  highlights.forEach((h) => {
    result = result.replace(h, `<span class="font-semibold text-slate-900">${h}</span>`);
  });
  return <span dangerouslySetInnerHTML={{ __html: result }} />;
};

// ── Main component ──────────────────────────────────────────────────
const HowItWorks = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinContainerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);

    return () => {
      window.removeEventListener('resize', checkMobile);
      mq.removeEventListener('change', handler);
    };
  }, []);

  const setStep = useCallback((progress: number) => {
    const step = Math.min(Math.round(progress * (STEPS.length - 1)), STEPS.length - 1);
    setActiveStep(step);
  }, []);

  useEffect(() => {
    if (!window.gsap || !window.ScrollTrigger) return;
    if (isMobile || prefersReducedMotion) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: pinContainerRef.current,
          start: 'top top',
          end: `+=${STEPS.length * window.innerHeight * 0.8}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: 1 / (STEPS.length - 1),
            duration: { min: 0.15, max: 0.3 },
            delay: 0,
            ease: 'power1.inOut',
          },
          onUpdate: (self: { progress: number }) => {
            setStep(self.progress);
          },
        });
      }, sectionRef);

      (sectionRef.current as any)?.__gsapCtx?.push?.(ctx) || ((sectionRef.current as any).__gsapCtx = ctx);
    }, 150);

    return () => {
      clearTimeout(timer);
      const ctx = (sectionRef.current as any)?.__gsapCtx;
      if (ctx && typeof ctx.revert === 'function') ctx.revert();
    };
  }, [isMobile, prefersReducedMotion, setStep]);

  // Mobile / reduced-motion: stacked layout
  if (isMobile || prefersReducedMotion) {
    return (
      <section ref={sectionRef} className="relative bg-white py-24 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 text-center mb-16">
            How <span className="gradient-text">Verifily</span> works
          </h2>
          <div className="space-y-12">
            {STEPS.map((step) => (
              <div key={step.number} className="grid gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl font-bold text-blue-500">{step.number}</span>
                    <h3 className="text-xl font-semibold text-slate-900">{step.title}</h3>
                  </div>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {renderHighlightedText(step.body, step.highlight)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Desktop: pinned scrollytelling
  return (
    <section ref={sectionRef} className="relative bg-white">
      <div
        ref={pinContainerRef}
        className="relative min-h-screen flex items-center will-change-transform"
      >
        <div className="max-w-6xl mx-auto px-4 w-full">
          <h2 className="text-3xl md:text-5xl font-semibold text-slate-900 text-center mb-16">
            How <span className="gradient-text">Verifily</span> works
          </h2>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
            {/* Left: step text */}
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-slate-200 rounded-full">
                <div
                  className="w-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                  style={{ height: `${((activeStep + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              <div className="pl-8 space-y-10">
                {STEPS.map((step, i) => {
                  const isActive = activeStep === i;
                  const isPast = activeStep > i;
                  return (
                    <div
                      key={step.number}
                      className={`relative transition-all duration-500 ease-out ${
                        isActive ? 'opacity-100' : isPast ? 'opacity-40' : 'opacity-30'
                      }`}
                    >
                      <div
                        className={`absolute -left-8 top-1 w-4 h-4 rounded-full border-2 transition-all duration-500 ${
                          isActive
                            ? 'bg-blue-500 border-blue-500 scale-125 shadow-lg shadow-blue-500/40'
                            : isPast
                              ? 'bg-blue-500 border-blue-500'
                              : 'bg-white border-slate-300'
                        }`}
                        style={{ transform: `translateX(-6px) ${isActive ? 'scale(1.25)' : ''}` }}
                      />

                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`text-5xl font-bold transition-colors duration-500 ${
                            isActive ? 'text-blue-500' : 'text-slate-300'
                          }`}
                        >
                          {step.number}
                        </span>
                        <h3
                          className={`text-xl font-semibold transition-colors duration-500 ${
                            isActive ? 'text-slate-900' : 'text-slate-400'
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>

                      <p
                        className={`text-lg leading-relaxed transition-colors duration-500 ${
                          isActive ? 'text-slate-600' : 'text-slate-400'
                        }`}
                      >
                        {isActive
                          ? renderHighlightedText(step.body, step.highlight)
                          : step.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: visual */}
            <div className="sticky top-1/3">
              <StepVisual activeStep={activeStep} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
