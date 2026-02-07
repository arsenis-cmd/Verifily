'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#000000] border-t border-[#111] w-full">
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-6">
        {/* Top row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          {/* Brand */}
          <Link
            href="/"
            className="text-sm font-bold text-white hover:opacity-80 transition-opacity"
          >
            Verifily
          </Link>

          {/* Links — single row */}
          <div className="flex items-center gap-6">
            <Link href="#how-it-works" className="text-xs text-[#666] hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="#features" className="text-xs text-[#666] hover:text-white transition-colors">
              Features
            </Link>
            <Link href="/pricing" className="text-xs text-[#666] hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/pilot" className="text-xs text-[#666] hover:text-white transition-colors">
              Pilot Program
            </Link>
            <Link href="/privacy" className="text-xs text-[#666] hover:text-white transition-colors">
              Privacy
            </Link>
            <a href="mailto:pilot@verifily.io" className="text-xs text-[#666] hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#1a1a1a] mb-4" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-[#444]">
            &copy; 2026 Verifily. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#555] hover:text-white transition-colors">
              Twitter
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#555] hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#555] hover:text-white transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
