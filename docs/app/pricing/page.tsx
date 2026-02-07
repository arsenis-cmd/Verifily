'use client';

import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function PricingPage() {
  const tiers = [
    {
      title: 'Starter Pilot',
      price: 'Custom',
      description: 'For teams exploring synthetic data transformation',
      features: [
        'Up to 100K input examples',
        '5–10× expansion to synthetic',
        'Standard leakage controls',
        'Email support',
        'Basic audit logging',
        'JSONL/Parquet export'
      ]
    },
    {
      title: 'Production',
      price: 'Custom',
      description: 'For ongoing production training pipelines',
      features: [
        'Unlimited input examples',
        '5–10× expansion to synthetic',
        'Advanced leakage controls',
        'Priority support + Slack channel',
        'Full audit logs + versioning',
        'Custom export formats',
        'Integration support',
        'SLA guarantees'
      ],
      highlighted: true
    },
    {
      title: 'Enterprise',
      price: 'Custom',
      description: 'For organizations with specialized needs',
      features: [
        'Everything in Production',
        'Dedicated account manager',
        'On-premise deployment options',
        'Custom data processing agreements',
        'White-glove onboarding',
        'Advanced security + compliance review',
        'Custom contract terms'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      <Navigation />

      <main className="flex-grow pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Pilot-based{' '}
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                pricing
              </span>
            </h1>

            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-8" />

            <p className="text-lg text-[#a1a1a1] max-w-2xl mx-auto">
              Priced per dataset size. Start with a pilot to validate fit. No long-term contracts required.
            </p>
          </motion.div>

          {/* Pricing Tiers */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {tiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`card relative ${tier.highlighted ? 'border-[#3b82f6]/50' : ''}`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#3b82f6] text-white text-xs font-semibold px-4 py-1 rounded-full">
                    POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{tier.title}</h3>
                  <p className="text-sm text-[#888888] mb-4">{tier.description}</p>
                  <div className="text-4xl font-bold text-white">{tier.price}</div>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#a1a1a1]">
                      <span className="text-[#3b82f6] mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mb-16">
            <Link href="/pilot">
              <Button variant="primary" size="lg">
                Request a pilot
              </Button>
            </Link>
            <p className="text-sm text-[#666666] mt-4">
              All tiers include 5–10× dataset expansion and privacy-safe synthetic data generation
            </p>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-2">How is pricing calculated?</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  Pricing is based on the size of your input dataset and the complexity of transformation required.
                  We start with a pilot to understand your use case and provide a custom quote.
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-2">What happens during a pilot?</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  We work with your team to transform a sample dataset (typically 10–100K examples), validate quality,
                  and ensure the synthetic output meets your training requirements. Pilots typically run 2–4 weeks.
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-2">Do you guarantee GDPR/EU AI Act compliance?</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  Verifily is designed to help teams meet regulatory requirements by transforming data into privacy-safe
                  synthetic derivatives. However, compliance depends on your specific use case and legal interpretation.
                  We recommend consulting your legal team.
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-2">Can we deploy on-premise?</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  Yes, on-premise deployment is available for Enterprise customers. This ensures your raw data never
                  leaves your infrastructure.
                </p>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-white mb-2">What formats do you support?</h3>
                <p className="text-sm text-[#888888] leading-relaxed">
                  We export to JSONL, Parquet, and custom formats as needed. We can also integrate directly with
                  HuggingFace Datasets, PyTorch DataLoaders, or your internal training pipeline.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
