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
      <div className="w-full px-20 py-32">
        {/* Main Footer - Centered Grid */}
        <div className="grid grid-cols-4 gap-20 mb-20 text-center">
          {/* Product Links */}
          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">
              Product
            </h4>
            <ul className="space-y-3">
              {links.product.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#666666] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">
              Resources
            </h4>
            <ul className="space-y-3">
              {links.resources.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#666666] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-bold text-xs mb-6 uppercase tracking-widest">
              Legal
            </h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#666666] hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Brand */}
          <div>
            <Link
              href="/"
              className="text-2xl font-bold text-white mb-4 block hover:opacity-80 transition-opacity"
            >
              Verifily
            </Link>
            <p className="text-sm text-[#666666] leading-relaxed">
              Proof of humanity in the AI era.
            </p>
          </div>
        </div>

        {/* Bottom Bar - Centered */}
        <div className="border-t border-[#111111] pt-10">
          <div className="text-center space-y-4">
            <p className="text-xs text-[#555555]">
              © 2026 Verifily. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex gap-8 justify-center">
              {social.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="text-xs text-[#666666] hover:text-white transition-colors"
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
