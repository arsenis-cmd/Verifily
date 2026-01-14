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
          ? 'bg-[rgba(0,0,0,0.95)] backdrop-blur-xl border-b border-[#111111]'
          : ''
      }`}
    >
      <div className="w-full max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-bold text-white tracking-tight hover:opacity-80 transition-opacity"
        >
          Verifily
        </Link>

        <div className="hidden md:flex items-center gap-12">
          <Link
            href="#how-it-works"
            className="text-[15px] font-medium text-[#999999] hover:text-white transition-colors relative group"
          >
            How it Works
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            href="#features"
            className="text-[15px] font-medium text-[#999999] hover:text-white transition-colors relative group"
          >
            Features
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
          </Link>
          <Link
            href="#pricing"
            className="text-[15px] font-medium text-[#999999] hover:text-white transition-colors relative group"
          >
            Pricing
            <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
          </Link>
        </div>

        <Button variant="primary" size="md">
          Add to Chrome
        </Button>
      </div>
    </motion.nav>
  );
}
