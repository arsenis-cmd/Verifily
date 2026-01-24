'use client';

import Link from 'next/link';
import { Button } from './ui/Button';

export default function ForCreators() {
  return (
    <section className="relative min-h-[50vh] flex items-center justify-center bg-[#0a0a0a] border-t border-[#111111]">
      <div className="container max-w-4xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Are you a <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">creator?</span>
          </h2>

          <div className="w-16 h-[2px] bg-white/20 mx-auto mb-6" />

          <p className="text-lg text-[#a1a1a1] max-w-2xl mb-8">
            Verifily for Creators helps you scan content for compliance with FTC, FDA,
            and platform policies before you post. Available now on ChatGPT.
          </p>

          <Link href="/creators">
            <Button variant="primary" size="lg">
              Explore Verifily for Creators
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
