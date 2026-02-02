'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';

export default function PricingPage() {
  const { user } = useUser();

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for trying out Verifily',
      features: [
        '10 AI detections per month',
        '5 human verifications per month',
        'Basic detection accuracy',
        'Email support',
        'Public verification badges'
      ],
      cta: 'Get Started',
      highlighted: false,
      link: user ? '/dashboard' : '/sign-up'
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      description: 'For content creators and professionals',
      features: [
        'Unlimited AI detections',
        'Unlimited human verifications',
        'Advanced detection accuracy',
        'Priority email support',
        'Custom verification badges',
        'API access',
        'Export verification history',
        'Advanced analytics'
      ],
      cta: 'Start Free Trial',
      highlighted: true,
      link: user ? '/dashboard' : '/sign-up'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Dedicated account manager',
        'Custom integration support',
        'SLA guarantees',
        'Advanced security features',
        'White-label solutions',
        'Training & onboarding',
        'Custom contract terms'
      ],
      cta: 'Contact Sales',
      highlighted: false,
      link: 'mailto:sales@verifily.io'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: 'white',
      padding: '80px 20px'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        textAlign: 'center',
        marginBottom: '80px'
      }}>
        <Link
          href="/"
          style={{
            display: 'inline-block',
            marginBottom: '40px',
            color: '#666666',
            textDecoration: 'none',
            fontSize: '14px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#10b981'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#666666'}
        >
          ← Back to Home
        </Link>

        <h1 style={{
          fontSize: '56px',
          fontWeight: 'bold',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Simple, Transparent Pricing
        </h1>

        <p style={{
          fontSize: '20px',
          color: '#888888',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          Choose the plan that fits your needs. All plans include access to our AI detection technology.
        </p>
      </div>

      {/* Pricing Cards */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        marginBottom: '80px'
      }}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            style={{
              backgroundColor: plan.highlighted ? '#111111' : '#0a0a0a',
              border: plan.highlighted ? '2px solid #10b981' : '1px solid #222222',
              borderRadius: '20px',
              padding: '40px',
              position: 'relative',
              transition: 'transform 0.2s, border-color 0.2s',
              transform: plan.highlighted ? 'scale(1.05)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              if (!plan.highlighted) {
                e.currentTarget.style.borderColor = '#10b981';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = plan.highlighted ? 'scale(1.05)' : 'scale(1)';
              if (!plan.highlighted) {
                e.currentTarget.style.borderColor = '#222222';
              }
            }}
          >
            {plan.highlighted && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#10b981',
                color: 'black',
                padding: '4px 16px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                MOST POPULAR
              </div>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                {plan.name}
              </h3>
              <p style={{
                color: '#666666',
                fontSize: '14px',
                minHeight: '40px'
              }}>
                {plan.description}
              </p>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <div style={{
                fontSize: '48px',
                fontWeight: 'bold',
                marginBottom: '4px'
              }}>
                {plan.price}
              </div>
              <div style={{
                color: '#666666',
                fontSize: '14px'
              }}>
                {plan.period}
              </div>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 32px 0'
            }}>
              {plan.features.map((feature, index) => (
                <li
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    marginBottom: '16px',
                    color: '#a1a1a1',
                    fontSize: '14px'
                  }}
                >
                  <span style={{
                    color: '#10b981',
                    fontSize: '18px',
                    lineHeight: 1,
                    flexShrink: 0
                  }}>
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.link}
              style={{
                display: 'block',
                width: '100%',
                padding: '16px',
                backgroundColor: plan.highlighted ? '#10b981' : 'transparent',
                color: plan.highlighted ? 'black' : 'white',
                border: plan.highlighted ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                textAlign: 'center',
                textDecoration: 'none',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (plan.highlighted) {
                  e.currentTarget.style.backgroundColor = '#0ea472';
                } else {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (plan.highlighted) {
                  e.currentTarget.style.backgroundColor = '#10b981';
                } else {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '40px'
        }}>
          Frequently Asked Questions
        </h2>

        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Can I upgrade or downgrade my plan?
            </h3>
            <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.6' }}>
              Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected immediately, and billing will be prorated.
            </p>
          </div>

          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              What payment methods do you accept?
            </h3>
            <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.6' }}>
              We accept all major credit cards (Visa, Mastercard, American Express) and support payment via Stripe for secure transactions.
            </p>
          </div>

          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Is there a free trial for the Pro plan?
            </h3>
            <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.6' }}>
              Yes! We offer a 14-day free trial for the Pro plan. No credit card required to start your trial.
            </p>
          </div>

          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              How accurate is the AI detection?
            </h3>
            <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.6' }}>
              Our AI detection model has been trained on millions of samples and achieves over 95% accuracy. Pro users get access to our most advanced detection model with even higher accuracy rates.
            </p>
          </div>

          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>
              Can I cancel my subscription at any time?
            </h3>
            <p style={{ color: '#888888', fontSize: '14px', lineHeight: '1.6' }}>
              Absolutely. You can cancel your subscription at any time with no cancellation fees. You'll continue to have access until the end of your billing period.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{
        maxWidth: '800px',
        margin: '80px auto 0',
        textAlign: 'center',
        padding: '60px 40px',
        backgroundColor: '#111111',
        border: '1px solid #222222',
        borderRadius: '20px'
      }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '16px'
        }}>
          Ready to get started?
        </h2>
        <p style={{
          color: '#888888',
          fontSize: '16px',
          marginBottom: '32px'
        }}>
          Join thousands of creators verifying their authentic human content.
        </p>
        <Link
          href={user ? '/dashboard' : '/sign-up'}
          style={{
            display: 'inline-block',
            padding: '16px 40px',
            backgroundColor: '#10b981',
            color: 'black',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: 'bold',
            textDecoration: 'none',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0ea472'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
        >
          Start Free
        </Link>
      </div>
    </div>
  );
}
