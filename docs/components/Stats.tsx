'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Stats() {
  const statsRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!statsRef.current) return;

    const ctx = gsap.context(() => {
      const statNumbers = statsRef.current?.querySelectorAll('.stat-number');

      statNumbers?.forEach((stat) => {
        const target = stat.getAttribute('data-target');
        if (!target) return;

        gsap.to(stat, {
          scrollTrigger: {
            trigger: stat,
            start: 'top 80%',
          },
          innerHTML: target,
          duration: 2,
          snap: { innerHTML: 1 },
          ease: 'power1.out',
        });
      });
    }, statsRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    {
      number: '5',
      suffix: '–10×',
      label: 'Dataset Expansion',
      description: 'Typical multiplier from internal human data to synthetic training corpora',
    },
    {
      number: '100',
      suffix: '%',
      label: 'Privacy-Safe',
      description: 'Raw data stays internal—only privacy-safe synthetic output is exported',
    },
    {
      number: '0',
      suffix: '',
      label: 'Legal Risk',
      description: 'Designed for GDPR and EU AI Act compliance requirements',
    },
  ];

  return (
    <section ref={statsRef} className="bg-[#000000]">
      <div className="container">
        <div className="w-full mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="mb-4">
                  <span
                    className="stat-number text-6xl font-bold text-white"
                    data-target={stat.number}
                  >
                    0
                  </span>
                  <span className="text-6xl font-bold text-[#3b82f6]">
                    {stat.suffix}
                  </span>
                </div>
                <div className="headline-sm mb-2">{stat.label}</div>
                <p className="body-md">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
