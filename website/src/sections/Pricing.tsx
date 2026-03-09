import { useEffect, useRef } from 'react';
import { Check, ArrowRight, Lock } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: 'For exploration and small projects.',
    cta: 'Join the waitlist',
    ctaHref: '#waitlist',
    ctaStyle: 'border border-slate-700 text-white hover:bg-slate-800',
    highlight: false,
    badge: null,
    rows: '50k rows/month',
    features: [
      'quickstart, check, init',
      'doctor, diff, fingerprint',
      'badge, history',
      'Community support',
    ],
  },
  {
    name: 'Pro',
    price: '$0',
    period: ' during early access',
    description: 'For teams shipping models weekly.',
    cta: 'Request early access',
    ctaHref: '#waitlist',
    ctaStyle: 'cta-gradient text-white hover:opacity-90',
    highlight: true,
    badge: 'Early Access — Limited Spots',
    rows: '5M rows/month',
    features: [
      'Everything in Free',
      'annotate, select, predict',
      'contamination, pipeline, report',
      'classify, NL2SQL, monitor',
      'HuggingFace, W&B, MLflow',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For platform teams and compliance.',
    cta: 'Contact us',
    ctaHref: 'mailto:team@verifily.io?subject=Enterprise%20inquiry',
    ctaStyle: 'border border-slate-700 text-white hover:bg-slate-800',
    highlight: false,
    badge: null,
    rows: 'Unlimited rows',
    features: [
      'Everything in Pro',
      'REST API server (serve)',
      'Teams & RBAC',
      'Billing & usage metering',
      'Audit logs & enterprise tokens',
      'Dedicated support & SLA',
    ],
  },
];

const Pricing = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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

      const cards = cardsRef.current?.querySelectorAll('.pricing-card');
      cards?.forEach((card, index) => {
        gsap.fromTo(
          card,
          { opacity: 0, y: 50, scale: 0.95 },
          {
            opacity: 1,
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
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="pricing"
      className="relative bg-black py-24 overflow-hidden"
    >
      {/* Background gradients */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
      />

      {/* Headline */}
      <div ref={headlineRef} className="max-w-4xl mx-auto px-4 text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-semibold text-white mb-4">
          Early access <span className="gradient-text">controlled launch</span>
        </h2>
        <p className="text-white/50 text-lg max-w-2xl mx-auto">
          We're onboarding a limited number of teams to ensure quality and incorporate feedback.
          All plans are free during early access.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2">
          <Lock className="w-4 h-4 text-blue-400" />
          <span className="text-blue-300 text-sm font-medium">Limited spots available</span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div ref={cardsRef} className="max-w-5xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`pricing-card relative rounded-2xl p-8 flex flex-col ${
                plan.highlight
                  ? 'bg-slate-900/90 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-slate-900/60 border border-slate-800'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="cta-gradient text-white text-xs font-medium px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-white text-xl font-semibold mb-1">{plan.name}</h3>
                <p className="text-white/40 text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-white text-4xl font-bold">{plan.price}</span>
                <span className="text-white/40 text-lg">{plan.period}</span>
              </div>

              <div className="mb-6">
                <span className="text-blue-400 text-sm font-medium">{plan.rows}</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                    <span className="text-white/70 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.ctaHref}
                className={`w-full py-3 rounded-full text-sm font-medium text-center flex items-center justify-center gap-2 transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>

        {/* Install hint */}
        <div className="mt-12 text-center">
          <p className="text-white/30 text-sm">
            All plans: <code className="bg-slate-800 px-2 py-1 rounded text-white/50 font-mono text-xs">pip install verifily</code>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
