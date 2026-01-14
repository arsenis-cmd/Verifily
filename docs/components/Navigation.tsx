'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[rgba(0,0,0,0.8)] backdrop-blur-xl' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold text-white">
          Verifily
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#how-it-works"
            className="text-sm text-[#a1a1a1] hover:text-white transition-colors"
          >
            How it Works
          </Link>
          <Link
            href="#features"
            className="text-sm text-[#a1a1a1] hover:text-white transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-[#a1a1a1] hover:text-white transition-colors"
          >
            Pricing
          </Link>
        </div>

        <Button variant="primary" size="sm">
          Add to Chrome →
        </Button>
      </div>
    </nav>
  );
}
