'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const hasClerk = typeof window === 'undefined'
  ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key'
  : true;

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[rgba(0,0,0,0.85)] backdrop-blur-2xl border-b border-[#1a1a1a] shadow-2xl'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-12 md:px-20">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-white hover:opacity-80 transition-opacity tracking-tight"
          >
            Verifily
          </Link>

          {/* Desktop Navigation — centered */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="#how-it-works"
              className="text-[15px] text-[#888888] hover:text-white transition-colors relative group"
            >
              How it Works
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="#features"
              className="text-[15px] text-[#888888] hover:text-white transition-colors relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
            </Link>
            <Link
              href="/pricing"
              className="text-[15px] text-[#888888] hover:text-white transition-colors relative group"
            >
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-white group-hover:w-full transition-all duration-300" />
            </Link>
          </div>

          {/* Right — auth + CTA */}
          <div className="flex items-center gap-6">
            {hasClerk ? (
              <>
                <SignedOut>
                  <Link href="/sign-in">
                    <Button variant="secondary" size="sm">
                      Sign In
                    </Button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            ) : null}
            <Link href="/pilot">
              <Button variant="primary" size="sm">
                Request pilot
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
