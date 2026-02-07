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
          ? 'bg-[rgba(0,0,0,0.85)] backdrop-blur-2xl border-b border-[#1a1a1a]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-bold text-white hover:opacity-80 transition-opacity tracking-tight"
          >
            Verifily
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="#how-it-works"
              className="text-[13px] text-[#888] hover:text-white transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#features"
              className="text-[13px] text-[#888] hover:text-white transition-colors"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="text-[13px] text-[#888] hover:text-white transition-colors"
            >
              Pricing
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {hasClerk ? (
              <>
                <SignedOut>
                  <Link href="/sign-in">
                    <button className="text-[13px] text-[#888] hover:text-white transition-colors px-3 py-1.5">
                      Sign in
                    </button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </>
            ) : null}
            <Link href="/pilot">
              <button className="h-9 px-5 text-[13px] font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-full hover:opacity-90 transition-opacity">
                Request pilot
              </button>
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
