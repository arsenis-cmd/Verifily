'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function ProductDemo() {
  const sectionRef = useRef<HTMLElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current || !demoRef.current) return;

    const ctx = gsap.context(() => {
      // Pin the section during animation
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=250%',
        pin: true,
        scrub: 1,
      });

      // Animation timeline
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: '+=250%',
          scrub: 1,
        },
      });

      // Step 1: Text appears
      tl.from('.demo-text', {
        opacity: 0,
        y: 30,
        duration: 0.5,
      });

      // Step 2: Extension popup slides in
      tl.from(
        '.demo-extension',
        {
          opacity: 0,
          y: 50,
          duration: 0.5,
        },
        '+=0.3'
      );

      // Step 3: Scanning animation
      tl.to(
        '.demo-progress',
        {
          width: '100%',
          duration: 0.8,
        },
        '+=0.2'
      );

      // Step 4: Result appears
      tl.from(
        '.demo-result',
        {
          opacity: 0,
          y: 20,
          duration: 0.4,
        },
        '+=0.2'
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a]"
    >
      <div className="container">
        <div className="w-full mx-auto">
          <h2 className="text-7xl font-bold text-white text-center mb-20">
            See it in <span className="text-[#3b82f6]">action</span>
          </h2>

          <div
            ref={demoRef}
            className="flex justify-center"
          >
            <div className="flex flex-col gap-8 items-center max-w-4xl w-full"
            >
            {/* Fake webpage */}
            <div className="demo-text bg-[#111111] border border-[#222222] rounded-xl p-8 w-full">
              <p className="text-[#a1a1a1] text-base leading-relaxed">
                "The implementation of machine learning algorithms in modern
                healthcare systems has demonstrated significant potential for
                improving diagnostic accuracy and patient outcomes. These
                advanced computational techniques have revolutionized the way
                medical professionals approach complex diagnostic challenges,
                enabling more precise and timely interventions that can
                significantly impact patient care and treatment efficacy..."
              </p>
            </div>

            {/* Extension popup */}
            <div className="demo-extension bg-[#111111] border border-[#222222] rounded-xl p-8 shadow-2xl w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-semibold">Verifily</h3>
                <span className="text-[#666666]">✕</span>
              </div>

              {/* Scanning progress */}
              <div className="mb-6">
                <div className="text-sm text-[#a1a1a1] mb-2">
                  Analyzing content...
                </div>
                <div className="h-2 bg-[#222222] rounded-full overflow-hidden">
                  <div
                    className="demo-progress h-full bg-gradient-to-r from-[#ff4444] to-[#cc3333] rounded-full"
                    style={{ width: '0%' }}
                  />
                </div>
              </div>

              {/* Result */}
              <div className="demo-result opacity-0">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#ff4444] text-xl">✗</span>
                  <span className="text-white font-semibold">
                    AI-Generated
                  </span>
                </div>
                <div className="text-sm text-[#a1a1a1] space-y-2 mb-4">
                  <div>AI Confidence: 94%</div>
                  <div className="text-xs">
                    Indicators detected:
                    <ul className="mt-2 space-y-1 pl-4">
                      <li>• Uniform sentence structure</li>
                      <li>• Low perplexity score</li>
                      <li>• Generic phrasing patterns</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
