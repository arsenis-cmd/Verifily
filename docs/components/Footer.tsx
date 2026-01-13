'use client';

import { motion } from 'framer-motion';
import { Twitter, Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  const links = {
    product: [
      { label: 'Chrome Extension', href: '#' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Features', href: '#features' },
      { label: 'API (Coming Soon)', href: '#' },
    ],
    company: [
      { label: 'About', href: '#' },
      { label: 'Blog', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  const social = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Mail, href: '#', label: 'Email' },
  ];

  return (
    <footer className="relative overflow-hidden bg-primary-900 border-t border-white/5">
      {/* Background */}
      <div className="absolute inset-0 dot-pattern opacity-5" />
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-accent-500/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-3xl font-bold font-heading gradient-text">Verifily</h3>
            <p className="text-white/60 leading-relaxed max-w-sm">
              Empowering users to distinguish between human and AI-generated content
              with cutting-edge detection technology.
            </p>

            {/* Social Links */}
            <div className="flex gap-4">
              {social.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  aria-label={item.label}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-accent-500/50 transition-all group"
                >
                  <item.icon className="w-5 h-5 text-white/60 group-hover:text-accent-500 transition-colors" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold font-heading mb-6 text-white">Product</h4>
            <ul className="space-y-3">
              {links.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-accent-500 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold font-heading mb-6 text-white">Company</h4>
            <ul className="space-y-3">
              {links.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-accent-500 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold font-heading mb-6 text-white">Legal</h4>
            <ul className="space-y-3">
              {links.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-white/60 hover:text-accent-500 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-white/40 text-sm">
            <p>© 2026 Verifily. All rights reserved.</p>
            <p className="flex items-center gap-2">
              Building trust in the AI era
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
