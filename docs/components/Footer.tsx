'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#000000] border-t border-[#111] w-full">
      <div className="max-w-6xl mx-auto px-8 md:px-12 py-12">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10 mb-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-base font-bold text-white hover:opacity-80 transition-opacity"
            >
              Verifily
            </Link>
            <p className="text-xs text-[#555] mt-2 max-w-xs leading-relaxed text-left">
              Privacy-safe synthetic data for AI training.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex gap-16">
            <div>
              <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">
                Product
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="#how-it-works" className="text-sm text-[#666] hover:text-white transition-colors">
                    How it Works
                  </Link>
                </li>
                <li>
                  <Link href="#features" className="text-sm text-[#666] hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-sm text-[#666] hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/pilot" className="text-sm text-[#666] hover:text-white transition-colors">
                    Pilot Program
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link href="/privacy" className="text-sm text-[#666] hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="mailto:pilot@verifily.io" className="text-sm text-[#666] hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1a1a1a] mb-6" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#444]">
            &copy; 2026 Verifily. All rights reserved.
          </p>
          <div className="flex items-center gap-5">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-xs text-[#555] hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
