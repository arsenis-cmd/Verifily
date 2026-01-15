'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#000000] border-t border-[#111111] w-full">
      <div className="w-full px-48 py-6">
        {/* Single row footer */}
        <div className="flex items-center justify-between text-[8px]">
          {/* Left: Brand */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-[8px] font-semibold text-white hover:opacity-80 transition-opacity"
            >
              Verifily
            </Link>
            <span className="text-[#333333]">|</span>
            <span className="text-[#666666]">© 2026 All rights reserved</span>
          </div>

          {/* Center: Links */}
          <div className="flex items-center gap-6">
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              Chrome Extension
            </Link>
            <Link
              href="#how-it-works"
              className="text-[#666666] hover:text-white transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              Documentation
            </Link>
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              Terms
            </Link>
          </div>

          {/* Right: Social */}
          <div className="flex items-center gap-4">
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              Twitter
            </Link>
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="text-[#666666] hover:text-white transition-colors"
            >
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
