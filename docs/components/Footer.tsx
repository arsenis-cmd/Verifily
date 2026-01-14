'use client';

import Link from 'next/link';

export default function Footer() {
  const links = {
    product: [
      { label: 'Chrome Extension', href: '#' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Pricing', href: '#pricing' },
    ],
    resources: [
      { label: 'Documentation', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Support', href: '#' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
    ],
  };

  const social = [
    { name: 'Twitter', href: '#', label: 'Twitter' },
    { name: 'LinkedIn', href: '#', label: 'LinkedIn' },
    { name: 'GitHub', href: '#', label: 'GitHub' },
  ];

  return (
    <footer className="bg-[#000000] border-t border-[#111111]">
      <div className="w-full max-w-[1400px] mx-auto px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 py-20 text-center md:text-left">
          {/* Product Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-white font-semibold text-[11px] mb-5 uppercase tracking-[0.15em]">
              Product
            </h4>
            <ul className="space-y-3">
              {links.product.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[#666666] hover:text-white transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-white font-semibold text-[11px] mb-5 uppercase tracking-[0.15em]">
              Resources
            </h4>
            <ul className="space-y-3">
              {links.resources.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[#666666] hover:text-white transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col items-center md:items-start">
            <h4 className="text-white font-semibold text-[11px] mb-5 uppercase tracking-[0.15em]">
              Legal
            </h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-[15px] text-[#666666] hover:text-white transition-colors inline-block"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <Link
              href="/"
              className="text-xl font-bold text-white mb-3 block hover:opacity-80 transition-opacity"
            >
              Verifily
            </Link>
            <p className="text-[15px] text-[#666666] leading-relaxed">
              Proof of humanity in the AI era.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#111111] py-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-center">
            {/* Copyright */}
            <p className="text-[13px] text-[#666666]">
              © 2026 Verifily. All rights reserved.
            </p>

            {/* Divider */}
            <div className="hidden md:block w-px h-4 bg-[#222222]" />

            {/* Social Links */}
            <div className="flex items-center gap-8">
              {social.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  aria-label={item.label}
                  className="text-[13px] text-[#666666] hover:text-white transition-colors"
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
