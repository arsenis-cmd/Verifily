'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#000000] border-t border-[#111] w-full">
      <div className="max-w-[1600px] mx-auto px-12 md:px-20 py-20">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-16 mb-16">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-xl font-bold text-white hover:opacity-80 transition-opacity"
            >
              Verifily
            </Link>
            <p className="text-sm text-[#555] mt-4 max-w-sm leading-relaxed text-left">
              Privacy-safe synthetic data for AI training.
              Transform internal human data into training-ready corpora.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-24">
            <div>
              <h4 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-6">
                Product
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="#how-it-works" className="text-base text-[#666] hover:text-white transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-base text-[#666] hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-base text-[#666] hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/pilot" className="text-base text-[#666] hover:text-white transition-colors">
                    Pilot Program
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#888] uppercase tracking-wider mb-6">
                Company
              </h4>
              <ul className="space-y-4">
                <li>
                  <Link href="/privacy" className="text-base text-[#666] hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="mailto:pilot@verifily.io" className="text-base text-[#666] hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1a1a1a] mb-8" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-sm text-[#444]">
            &copy; 2026 Verifily. All rights reserved.
          </p>
          <div className="flex items-center gap-8">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#555] hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#555] hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-[#555] hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
