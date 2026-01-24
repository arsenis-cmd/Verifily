'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function CreatorsPage() {
  return (
    <main className="min-h-screen bg-[#000000]">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-[#000000] pt-32 pb-16 overflow-hidden">
        {/* Background gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-white/[0.03] via-blue-500/[0.02] to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-center mb-20"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#111111] border border-[#222222] rounded-full text-[#3b82f6] text-sm mb-8">
                <span>Now available on ChatGPT</span>
              </div>

              {/* Main headline */}
              <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 text-center">
                Verifily for{' '}
                <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                  Creators
                </span>
              </h1>

              {/* Divider line */}
              <div className="w-16 h-[2px] bg-white/20 mx-auto mb-6" />

              {/* Subheadline */}
              <div className="flex justify-center mb-8">
                <p className="text-lg md:text-xl text-[#a1a1a1] max-w-2xl leading-relaxed text-center">
                  Your AI compliance co-pilot. Scan content against FTC, FDA, EU AI Act,
                  and platform policies before you post. Avoid takedowns and legal issues.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
                <a
                  href="https://chatgpt.com/g/g-69746b59da488191822592759b0c7e59-verifily-for-creators"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="primary" size="lg">
                    Try Free on ChatGPT
                  </Button>
                </a>
                <Link href="/">
                  <Button variant="secondary" size="lg">
                    Get Chrome Extension
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-6 text-sm text-[#666666]">
                <span>No Sign-up Required</span>
                <span>Instant Results</span>
                <span>Free to Use</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What It Checks Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#0a0a0a] border-t border-[#111111]">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              What Verifily <span className="text-[#3b82f6]">Checks</span>
            </h2>

            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-16" />

            <div className="grid md:grid-cols-3 gap-8 w-full">
              {/* Legal Card */}
              <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 text-center">
                <h3 className="text-2xl font-bold text-white mb-6">Legal Regulations</h3>
                <ul className="space-y-3 text-[#a1a1a1] text-left">
                  <li>• FTC Endorsement Guidelines</li>
                  <li>• FDA Health Claims</li>
                  <li>• EU AI Act</li>
                  <li>• GDPR & CCPA</li>
                  <li>• COPPA (Children)</li>
                  <li>• ASA (UK Advertising)</li>
                </ul>
              </div>

              {/* Platform Card */}
              <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 text-center">
                <h3 className="text-2xl font-bold text-white mb-6">Platform Policies</h3>
                <ul className="space-y-3 text-[#a1a1a1] text-left">
                  <li>• YouTube Guidelines</li>
                  <li>• TikTok Policies</li>
                  <li>• Instagram/Facebook</li>
                  <li>• Twitter/X Rules</li>
                  <li>• LinkedIn Policies</li>
                  <li>• Google & Meta Ads</li>
                </ul>
              </div>

              {/* Industry Card */}
              <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 text-center">
                <h3 className="text-2xl font-bold text-white mb-6">Industry Specific</h3>
                <ul className="space-y-3 text-[#a1a1a1] text-left">
                  <li>• Healthcare & Supplements</li>
                  <li>• Finance & Investing</li>
                  <li>• Crypto & Web3</li>
                  <li>• Alcohol & Tobacco</li>
                  <li>• Gambling</li>
                  <li>• Real Estate</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center bg-[#000000] border-t border-[#111111]">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              How it <span className="text-[#3b82f6]">works</span>
            </h2>

            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-16" />

            <div className="grid md:grid-cols-3 gap-12 w-full">
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-full flex items-center justify-center mb-6 text-white text-3xl font-bold">
                  1
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Upload</h3>
                <p className="text-[#a1a1a1] leading-relaxed">
                  Paste your script, ad copy, or upload video transcript
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-full flex items-center justify-center mb-6 text-white text-3xl font-bold">
                  2
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Analyze</h3>
                <p className="text-[#a1a1a1] leading-relaxed">
                  Get instant compliance report with specific violations
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-full flex items-center justify-center mb-6 text-white text-3xl font-bold">
                  3
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Fix</h3>
                <p className="text-[#a1a1a1] leading-relaxed">
                  Get suggested rewrites and compliant alternatives
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#0a0a0a] border-t border-[#111111]">
        <div className="container max-w-5xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Works with <span className="text-[#3b82f6]">any content</span>
            </h2>

            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-12" />

            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                'Video Scripts',
                'Blog Posts',
                'Email Campaigns',
                'Social Posts',
                'Image Captions',
                'Ad Copy',
              ].map((label) => (
                <div
                  key={label}
                  className="px-8 py-4 bg-[#111111] border border-[#222222] rounded-full text-white hover:border-[#3b82f6] transition-colors"
                >
                  <span className="font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Example Report Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-[#000000] border-t border-[#111111]">
        <div className="container max-w-4xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Example <span className="text-[#3b82f6]">report</span>
            </h2>

            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-12" />

            <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 w-full mt-8 text-left">
              <div className="flex items-center gap-3 mb-8">
                <div>
                  <h3 className="text-xl font-bold text-white">Risk Level: HIGH</h3>
                  <p className="text-red-500 text-sm">3 Critical Issues Found</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="border-l-4 border-red-500 pl-6 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 font-bold">CRITICAL</span>
                    <span className="text-white">"This product cures anxiety"</span>
                  </div>
                  <p className="text-[#a1a1a1] text-sm mb-2">
                    FDA Violation - Cannot claim to cure disease
                  </p>
                  <p className="text-green-500 text-sm">
                    Fix: "May help support a calm mood"
                  </p>
                </div>

                <div className="border-l-4 border-red-500 pl-6 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-red-500 font-bold">CRITICAL</span>
                    <span className="text-white">No #ad disclosure</span>
                  </div>
                  <p className="text-[#a1a1a1] text-sm mb-2">
                    FTC Violation - Sponsored content requires disclosure
                  </p>
                  <p className="text-green-500 text-sm">
                    Fix: Add "Ad" or "Sponsored" at start
                  </p>
                </div>

                <div className="border-l-4 border-yellow-500 pl-6 py-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-500 font-bold">WARNING</span>
                    <span className="text-white">"Guaranteed results"</span>
                  </div>
                  <p className="text-[#a1a1a1] text-sm mb-2">
                    Must include terms of guarantee
                  </p>
                  <p className="text-green-500 text-sm">
                    Fix: Link to refund policy
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center bg-[#0a0a0a] border-t border-[#111111]">
        <div className="container max-w-3xl mx-auto px-6">
          <div className="flex flex-col items-center justify-center text-center">
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Start checking your{' '}
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                content
              </span>
            </h2>

            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-6" />

            <p className="text-lg text-[#a1a1a1] max-w-xl mb-12">
              Free to use. No sign-up required. Just open on ChatGPT.
            </p>

            <a
              href="https://chat.openai.com/g/g-YOUR-GPT-ID"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                Open Verifily for Creators →
              </Button>
            </a>

            <p className="mt-6 text-sm text-[#666666]">
              Requires free ChatGPT account
            </p>
          </div>
        </div>
      </section>

      {/* Cross-link Section */}
      <section className="relative py-12 flex items-center justify-center bg-[#000000] border-t border-[#111111]">
        <div className="container max-w-3xl mx-auto px-6 text-center">
          <p className="text-[#a1a1a1]">
            Looking for AI detection?{' '}
            <Link href="/" className="text-[#3b82f6] hover:underline font-medium">
              Try our Chrome Extension →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
