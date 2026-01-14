'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HowItWorks() {
  const lineRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!lineRef.current || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(lineRef.current, {
        scaleX: 0,
        transformOrigin: 'left center',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
          end: 'bottom 70%',
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const steps = [
    {
      number: '1',
      title: 'Install the extension',
      description:
        'Add Verifily to Chrome in one click. No account required to start detecting AI content.',
    },
    {
      number: '2',
      title: 'Detect or verify',
      description:
        'Highlight any text and click "Check for AI" — or verify your own work as human-created.',
    },
    {
      number: '3',
      title: 'Get instant results',
      description:
        'See detailed analysis in seconds. Share your verification badge anywhere.',
    },
  ];

  return (
    <section ref={sectionRef} id="how-it-works" className="bg-[#0a0a0a]">
      <div className="container">
        <div className="max-w-[900px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="headline-lg text-center mb-4">How it works</h2>
            <p className="body-lg text-center mb-20 text-[#666666]">
              From detection to verification in seconds
            </p>

            {/* Steps */}
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute top-16 left-0 right-0 h-0.5 bg-[#222222] hidden md:block">
                <div
                  ref={lineRef}
                  className="h-full bg-[#3b82f6]"
                  style={{ transformOrigin: 'left center' }}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-12 relative">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className="text-center"
                  >
                    {/* Number circle */}
                    <div className="relative mb-8 flex justify-center">
                      <div className="w-16 h-16 rounded-full border-2 border-[#3b82f6] bg-[#000000] flex items-center justify-center text-2xl font-semibold text-white relative z-10">
                        {step.number}
                      </div>
                    </div>

                    <h3 className="headline-sm mb-3">{step.title}</h3>
                    <p className="body-md">{step.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
