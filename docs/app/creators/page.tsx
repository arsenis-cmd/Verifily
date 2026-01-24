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

            <div className="grid md:grid-cols-3 gap-6 w-full">
              {/* Legal Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0 }}
                className="group bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] rounded-2xl p-8 hover:border-[#3b82f6]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#3b82f6]/10"
              >
                <div className="mb-6 pb-4 border-b border-[#222222]">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-[#a1a1a1] bg-clip-text text-transparent">
                    Legal Regulations
                  </h3>
                </div>
                <ul className="space-y-3 text-[#a1a1a1] text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>FTC Endorsement Guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>FDA Health Claims</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>EU AI Act</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>GDPR & CCPA</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>COPPA (Children)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>ASA (UK Advertising)</span>
                  </li>
                </ul>
              </motion.div>

              {/* Platform Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="group bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] rounded-2xl p-8 hover:border-[#3b82f6]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#3b82f6]/10"
              >
                <div className="mb-6 pb-4 border-b border-[#222222]">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-[#a1a1a1] bg-clip-text text-transparent">
                    Platform Policies
                  </h3>
                </div>
                <ul className="space-y-3 text-[#a1a1a1] text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>YouTube Guidelines</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>TikTok Policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Instagram/Facebook</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Twitter/X Rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>LinkedIn Policies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Google & Meta Ads</span>
                  </li>
                </ul>
              </motion.div>

              {/* Industry Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="group bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] rounded-2xl p-8 hover:border-[#3b82f6]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#3b82f6]/10"
              >
                <div className="mb-6 pb-4 border-b border-[#222222]">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-[#a1a1a1] bg-clip-text text-transparent">
                    Industry Specific
                  </h3>
                </div>
                <ul className="space-y-3 text-[#a1a1a1] text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Healthcare & Supplements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Finance & Investing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Crypto & Web3</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Alcohol & Tobacco</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Gambling</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#3b82f6] mt-1">▸</span>
                    <span>Real Estate</span>
                  </li>
                </ul>
              </motion.div>
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
              {[
                'Video Scripts',
                'Blog Posts',
                'Email Campaigns',
                'Social Posts',
                'Image Captions',
                'Ad Copy',
              ].map((label, index) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300" />
                  <div className="relative px-6 py-5 bg-[#111111] border border-[#222222] rounded-2xl text-white group-hover:border-[#3b82f6] transition-all duration-300 text-center">
                    <span className="font-semibold text-sm tracking-wide">{label}</span>
                  </div>
                </motion.div>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-br from-[#111111] to-[#0a0a0a] border border-[#222222] rounded-2xl p-8 w-full mt-8 text-left"
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#222222]">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Risk Assessment</h3>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-500 text-xs font-bold">
                      HIGH RISK
                    </span>
                    <span className="text-[#666666] text-sm">3 Critical Issues Detected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-[#0a0a0a] border border-red-500/20 rounded-xl p-6 hover:border-red-500/40 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-xs font-bold">
                      CRITICAL
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">"This product cures anxiety"</p>
                      <p className="text-[#a1a1a1] text-sm">
                        FDA Violation - Cannot claim to cure disease
                      </p>
                    </div>
                  </div>
                  <div className="pl-3 border-l-2 border-green-500/30 ml-3 mt-3">
                    <p className="text-[#666666] text-xs mb-1">SUGGESTED FIX</p>
                    <p className="text-green-500 text-sm font-medium">
                      "May help support a calm mood"
                    </p>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-red-500/20 rounded-xl p-6 hover:border-red-500/40 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-red-500/10 border border-red-500/30 rounded-md text-red-500 text-xs font-bold">
                      CRITICAL
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">No disclosure for sponsored content</p>
                      <p className="text-[#a1a1a1] text-sm">
                        FTC Violation - Sponsored content requires clear disclosure
                      </p>
                    </div>
                  </div>
                  <div className="pl-3 border-l-2 border-green-500/30 ml-3 mt-3">
                    <p className="text-[#666666] text-xs mb-1">SUGGESTED FIX</p>
                    <p className="text-green-500 text-sm font-medium">
                      Add "Ad" or "Sponsored" label at start of content
                    </p>
                  </div>
                </div>

                <div className="bg-[#0a0a0a] border border-yellow-500/20 rounded-xl p-6 hover:border-yellow-500/40 transition-colors">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-md text-yellow-500 text-xs font-bold">
                      WARNING
                    </span>
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">"Guaranteed results"</p>
                      <p className="text-[#a1a1a1] text-sm">
                        Must include terms and conditions of guarantee
                      </p>
                    </div>
                  </div>
                  <div className="pl-3 border-l-2 border-green-500/30 ml-3 mt-3">
                    <p className="text-[#666666] text-xs mb-1">SUGGESTED FIX</p>
                    <p className="text-green-500 text-sm font-medium">
                      Add link to refund policy or specify guarantee terms
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
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
              href="https://chatgpt.com/g/g-69746b59da488191822592759b0c7e59-verifily-for-creators"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary" size="lg">
                Open Verifily for Creators
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
              Try our Chrome Extension
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
