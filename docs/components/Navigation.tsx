'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

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
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[rgba(0,0,0,0.95)] backdrop-blur-xl border-b border-[#222222]'
          : ''
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity"
        >
          Verifily
        </Link>

        <div className="hidden md:flex items-center gap-10">
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-[#a1a1a1] hover:text-white transition-colors relative group"
          >
            How it Works
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-[#a1a1a1] hover:text-white transition-colors relative group"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-[#a1a1a1] hover:text-white transition-colors relative group"
          >
            Pricing
          </Link>
        </div>

        <Button variant="primary" size="sm">
          Add to Chrome
        </Button>
      </div>
    </motion.nav>
  );
}
