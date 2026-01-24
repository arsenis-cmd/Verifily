'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const API_URL = 'https://verifily-production.up.railway.app/api/v1';

interface Verification {
  content_hash: string;
  classification: string;
  ai_probability: number;
  confidence: number;
  view_count: number;
  verified_at: string;
  platform?: string;
  post_url?: string;
  username?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const hash = params.hash as string;

  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerification() {
      try {
        const response = await fetch(`${API_URL}/check/${hash}`);

        if (!response.ok) {
          throw new Error('Verification not found');
        }

        const data = await response.json();
        setVerification(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load verification');
      } finally {
        setLoading(false);
      }
    }

    if (hash) {
      fetchVerification();
    }
  }, [hash]);

  const isHuman = verification?.classification === 'human';

  return (
    <div className="bg-[#000000] min-h-screen">
      <Navigation />

      <main className="relative z-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">

          {/* Page Title */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="w-12 h-[2px] bg-white/20 mx-auto mb-6"></div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">
              Content Verification
            </h1>
            <p className="text-[#a1a1a1] text-sm sm:text-base">
              Proof of authenticity on the blockchain of truth
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin mb-6"></div>
              <p className="text-[#a1a1a1] text-base sm:text-lg">Loading verification...</p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-500/5 border-2 border-red-500/40 rounded-xl p-6 sm:p-8 text-center">
              <div className="text-4xl sm:text-5xl mb-4 text-red-400">!</div>
              <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-2">Verification Not Found</h2>
              <p className="text-[#a1a1a1] text-sm sm:text-base">{error}</p>
            </div>
          )}

          {/* Verification Content */}
          {verification && !loading && !error && (
            <div className="space-y-6 sm:space-y-8">

              {/* Main Status Card */}
              <div
                className={`border-2 rounded-xl p-6 sm:p-10 text-center ${
                  isHuman
                    ? 'bg-[#10b981]/5 border-[#10b981]/50'
                    : 'bg-[#ef4444]/5 border-[#ef4444]/50'
                }`}
                style={{
                  boxShadow: isHuman
                    ? '0 0 30px rgba(16, 185, 129, 0.15)'
                    : '0 0 30px rgba(239, 68, 68, 0.15)'
                }}
              >
                <div className={`text-5xl sm:text-6xl font-bold mb-4 ${isHuman ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {isHuman ? 'VERIFIED' : 'AI DETECTED'}
                </div>
                <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${isHuman ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {isHuman ? 'Human-Written Content' : 'AI-Generated Content'}
                </h2>
                <p className="text-[#a1a1a1] text-sm sm:text-base max-w-xl mx-auto">
                  {isHuman
                    ? 'This content has been verified as human-written by the author'
                    : `This content was detected as AI-generated with ${Math.round(verification.ai_probability * 100)}% probability`
                  }
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                {/* Confidence */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6">
                  <div className="text-[#a1a1a1] text-xs sm:text-sm uppercase tracking-wider mb-2">
                    Confidence
                  </div>
                  <div className="text-white text-2xl sm:text-3xl font-bold">
                    {Math.round(verification.confidence * 100)}%
                  </div>
                </div>

                {/* View Count */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6">
                  <div className="text-[#a1a1a1] text-xs sm:text-sm uppercase tracking-wider mb-2">
                    Verified By
                  </div>
                  <div className="text-white text-2xl sm:text-3xl font-bold">
                    {verification.view_count} {verification.view_count === 1 ? 'user' : 'users'}
                  </div>
                </div>

                {/* Date */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6">
                  <div className="text-[#a1a1a1] text-xs sm:text-sm uppercase tracking-wider mb-2">
                    Verified On
                  </div>
                  <div className="text-white text-base sm:text-lg font-semibold">
                    {new Date(verification.verified_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Platform */}
                {verification.platform && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6">
                    <div className="text-[#a1a1a1] text-xs sm:text-sm uppercase tracking-wider mb-2">
                      Platform
                    </div>
                    <div className="text-white text-base sm:text-lg font-semibold capitalize">
                      {verification.platform}
                    </div>
                  </div>
                )}
              </div>

              {/* Original Post */}
              {verification.post_url && (
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6">
                  <div className="text-[#a1a1a1] text-xs sm:text-sm uppercase tracking-wider mb-3">
                    Original Post
                  </div>
                  <a
                    href={verification.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10b981] hover:text-[#059669] transition-colors break-all text-sm sm:text-base underline"
                  >
                    {verification.post_url}
                  </a>
                </div>
              )}

              {/* Hash */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 sm:p-6">
                <div className="text-[#a1a1a1] text-xs sm:text-sm uppercase tracking-wider mb-3">
                  Verification Hash
                </div>
                <code className="text-white text-xs sm:text-sm font-mono break-all bg-black/40 p-3 rounded block leading-relaxed">
                  {verification.content_hash}
                </code>
              </div>

              {/* Explanation */}
              <div className="border-t border-white/10 pt-6 sm:pt-8">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-4">About This Verification</h3>
                <div className="space-y-3 text-[#a1a1a1] text-sm sm:text-base leading-relaxed">
                  {isHuman ? (
                    <>
                      <p>
                        This content has been verified as human-written through Verifily's verification system.
                        The author has claimed this content as their original work and staked their reputation on it.
                      </p>
                      <p>
                        This verification is permanent and cryptographically secured. Anyone can view this proof
                        to confirm the content's authenticity.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This content has been analyzed and appears to be AI-generated with high confidence.
                        Our detection system uses advanced models to identify patterns typical of AI-written text.
                      </p>
                      <p>
                        This verification helps maintain transparency about content origins on the internet.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="text-center pt-6 sm:pt-8 border-t border-white/10">
                <p className="text-[#a1a1a1] mb-4 text-sm sm:text-base">
                  Verify your own content with Verifily
                </p>
                <a
                  href="/"
                  className="inline-block px-6 sm:px-8 py-3 bg-[#10b981]/20 border-2 border-[#10b981]/60 text-[#10b981] rounded-lg font-semibold hover:bg-[#10b981]/30 transition-all text-sm sm:text-base"
                  style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
                >
                  Get Verifily
                </a>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
