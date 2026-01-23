'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SmoothScrollWrapper from '@/components/SmoothScrollWrapper';

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
    <SmoothScrollWrapper>
      <Navigation />

      <main className="bg-[#000000] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-32 pb-24">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Content Verification
            </h1>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin mb-6"></div>
              <p className="text-[#a1a1a1] text-lg">Loading verification...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
              <div className="text-red-400 text-5xl mb-4">⚠</div>
              <h2 className="text-2xl font-bold text-red-400 mb-2">Verification Not Found</h2>
              <p className="text-[#a1a1a1]">{error}</p>
            </div>
          )}

          {/* Verification Display */}
          {verification && !loading && !error && (
            <div className="space-y-8">
              {/* Status Card */}
              <div
                className={`border-2 rounded-2xl p-8 text-center ${
                  isHuman
                    ? 'bg-[#10b981]/5 border-[#10b981]/60'
                    : 'bg-[#ef4444]/5 border-[#ef4444]/60'
                }`}
                style={{
                  boxShadow: isHuman
                    ? '0 0 40px rgba(16, 185, 129, 0.2)'
                    : '0 0 40px rgba(239, 68, 68, 0.2)'
                }}
              >
                <div className={`text-7xl mb-6 ${isHuman ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {isHuman ? '✓' : '⚠'}
                </div>
                <h2 className={`text-3xl font-bold mb-3 ${isHuman ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                  {isHuman ? 'Verified as Human' : 'AI-Generated Content'}
                </h2>
                <p className="text-[#a1a1a1] text-lg">
                  {isHuman
                    ? 'This content has been verified as human-written'
                    : `This content appears to be AI-generated with ${Math.round(verification.ai_probability * 100)}% confidence`
                  }
                </p>
              </div>

              {/* Details Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Confidence */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <div className="text-[#a1a1a1] text-sm uppercase tracking-wider mb-2">Confidence</div>
                  <div className="text-white text-3xl font-bold">
                    {Math.round(verification.confidence * 100)}%
                  </div>
                </div>

                {/* View Count */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <div className="text-[#a1a1a1] text-sm uppercase tracking-wider mb-2">Verified By</div>
                  <div className="text-white text-3xl font-bold">
                    {verification.view_count} {verification.view_count === 1 ? 'person' : 'people'}
                  </div>
                </div>

                {/* Verified Date */}
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <div className="text-[#a1a1a1] text-sm uppercase tracking-wider mb-2">Verified On</div>
                  <div className="text-white text-lg font-semibold">
                    {new Date(verification.verified_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                {/* Platform */}
                {verification.platform && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                    <div className="text-[#a1a1a1] text-sm uppercase tracking-wider mb-2">Platform</div>
                    <div className="text-white text-lg font-semibold capitalize">
                      {verification.platform}
                    </div>
                  </div>
                )}
              </div>

              {/* Original Post Link */}
              {verification.post_url && (
                <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                  <div className="text-[#a1a1a1] text-sm uppercase tracking-wider mb-3">Original Post</div>
                  <a
                    href={verification.post_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#10b981] hover:text-[#059669] transition-colors break-all underline"
                  >
                    {verification.post_url}
                  </a>
                </div>
              )}

              {/* Verification Hash */}
              <div className="bg-white/[0.02] border border-white/10 rounded-xl p-6">
                <div className="text-[#a1a1a1] text-sm uppercase tracking-wider mb-3">Verification Hash</div>
                <code className="text-white text-sm font-mono break-all bg-black/40 p-3 rounded block">
                  {verification.content_hash}
                </code>
              </div>

              {/* What This Means */}
              <div className="border-t border-white/10 pt-8">
                <h3 className="text-xl font-bold text-white mb-4">What This Means</h3>
                <div className="space-y-3 text-[#a1a1a1] leading-relaxed">
                  {isHuman ? (
                    <>
                      <p>
                        This content has been verified as human-written through Verifily's verification system.
                        The author has claimed this content as their original work.
                      </p>
                      <p>
                        This verification is permanent and can be shared with others to prove authenticity.
                        Each view of this link increases the verification count, showing how many people have
                        seen this proof.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        This content has been analyzed and appears to be AI-generated with high confidence.
                        Our detection system uses advanced AI models to identify patterns typical of AI-written text.
                      </p>
                      <p>
                        This verification helps maintain transparency about content origins on the internet.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Share Section */}
              <div className="text-center pt-8 border-t border-white/10">
                <p className="text-[#a1a1a1] mb-4">Install Verifily to verify your own content</p>
                <a
                  href="/"
                  className="inline-block px-8 py-3 bg-[#10b981]/20 border-2 border-[#10b981]/60 text-[#10b981] rounded-lg font-semibold hover:bg-[#10b981]/30 transition-all"
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
    </SmoothScrollWrapper>
  );
}
