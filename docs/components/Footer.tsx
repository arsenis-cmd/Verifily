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
    <footer style={{
      position: 'relative',
      overflow: 'hidden',
      background: '#0a1628',
      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
      fontSize: '0.75rem' // Significantly smaller base font
    }}>
      {/* Main Footer Content */}
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '40px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '40px',
          marginBottom: '40px'
        }}>
          {/* Brand Column */}
          <div style={{ gridColumn: 'span 2' }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '15px'
            }} className="gradient-text">
              Verifily
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              lineHeight: '1.6',
              fontSize: '0.75rem',
              maxWidth: '280px',
              marginBottom: '20px'
            }}>
              Empowering users to distinguish between human and AI-generated content
              with cutting-edge detection technology.
            </p>

            {/* Social Links */}
            <div style={{ display: 'flex', gap: '12px' }}>
              {social.map((item, index) => (
                <motion.a
                  key={index}
                  href={item.href}
                  aria-label={item.label}
                  whileHover={{ scale: 1.1 }}
                  className="glass"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <item.icon size={14} color="rgba(255, 255, 255, 0.6)" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 style={{
              fontWeight: 'bold',
              marginBottom: '15px',
              fontSize: '0.8rem',
              color: '#fff'
            }}>
              Product
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.product.map((link, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <a
                    href={link.href}
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      transition: 'color 0.2s'
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 style={{
              fontWeight: 'bold',
              marginBottom: '15px',
              fontSize: '0.8rem',
              color: '#fff'
            }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.company.map((link, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <a
                    href={link.href}
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      transition: 'color 0.2s'
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 style={{
              fontWeight: 'bold',
              marginBottom: '15px',
              fontSize: '0.8rem',
              color: '#fff'
            }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {links.legal.map((link, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <a
                    href={link.href}
                    style={{
                      color: 'rgba(255, 255, 255, 0.5)',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      transition: 'color 0.2s'
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.4)'
        }}>
          <p>© 2026 Verifily. All rights reserved.</p>
          <p>Building trust in the AI era</p>
        </div>
      </div>
    </footer>
  );
}
