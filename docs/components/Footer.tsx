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
    <footer className="bg-[#000000] border-t border-[#111111] w-full">
      <div className="w-full px-20 py-16">
        {/* Main Footer - Single Row */}
        <div className="flex items-center justify-between mb-8">
          {/* Brand */}
          <div className="text-left">
            <Link
              href="/"
              className="text-xl font-bold text-white mb-2 block hover:opacity-80 transition-opacity"
            >
              Verifily
            </Link>
            <p className="text-xs text-[#666666]">
              Proof of humanity in the AI era.
            </p>
          </div>

          {/* Links Row */}
          <div className="flex gap-16 text-left">
            {/* Product Links */}
            <div>
              <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-2">
                {links.product.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#666666] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">
                Resources
              </h4>
              <ul className="space-y-2">
                {links.resources.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#666666] hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-white font-semibold text-xs mb-3 uppercase tracking-wider">
                Legal
              </h4>
              <ul className="space-y-2">
                {links.legal.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#666666] hover:text-white transition-colors"
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
        <div className="border-t border-[#111111] pt-6 flex items-center justify-between">
          <p className="text-[10px] text-[#555555]">
            © 2026 Verifily. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex gap-6">
            {social.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="text-[10px] text-[#666666] hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
