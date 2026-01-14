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
    { name: 'Twitter', href: '#' },
    { name: 'LinkedIn', href: '#' },
    { name: 'GitHub', href: '#' },
  ];

  return (
    <footer className="relative bg-[#000000] border-t border-[#111111]">
      <div className="w-full max-w-6xl mx-auto px-6">
        {/* Main Content */}
        <div className="py-20">
          <div className="grid grid-cols-2 md:grid-cols-12 gap-8 md:gap-12">
            {/* Brand - Takes up more space */}
            <div className="col-span-2 md:col-span-4">
              <Link
                href="/"
                className="text-3xl font-bold text-white mb-4 block hover:opacity-80 transition-opacity"
              >
                Verifily
              </Link>
              <p className="text-base text-[#666666] leading-relaxed mb-6 max-w-xs">
                Proof of humanity in the AI era. Verify authenticity, build trust.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-6">
                {social.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="text-sm text-[#666666] hover:text-white transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Product Links */}
            <div className="col-span-1 md:col-span-3">
              <h4 className="text-white font-semibold text-xs mb-6 uppercase tracking-widest">
                Product
              </h4>
              <ul className="space-y-4">
                {links.product.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-base text-[#666666] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div className="col-span-1 md:col-span-3">
              <h4 className="text-white font-semibold text-xs mb-6 uppercase tracking-widest">
                Resources
              </h4>
              <ul className="space-y-4">
                {links.resources.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-base text-[#666666] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div className="col-span-2 md:col-span-2">
              <h4 className="text-white font-semibold text-xs mb-6 uppercase tracking-widest">
                Legal
              </h4>
              <ul className="space-y-4">
                {links.legal.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-base text-[#666666] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#111111] py-8">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 text-center">
            <p className="text-sm text-[#555555]">
              © 2026 Verifily. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
