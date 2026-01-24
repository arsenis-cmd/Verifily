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
    <>
      <Navigation />

      <div className="bg-[#000000] min-h-screen">
        {/* Add massive top padding to clear fixed nav */}
        <div className="pt-40 pb-32 px-6">

          {/* Center everything with max-width */}
          <div className="max-w-2xl mx-auto">

            {/* Title */}
            <div className="text-center mb-16">
              <div className="w-16 h-0.5 bg-white/20 mx-auto mb-8"></div>
              <h1 className="text-4xl font-bold text-white mb-4">
                Content Verification
              </h1>
              <p className="text-[#888] text-base">
                Cryptographic proof of authenticity
              </p>
            </div>

            {/* Loading */}
            {loading && (
              <div className="text-center py-20">
                <div className="w-16 h-16 border-4 border-[#10b981]/30 border-t-[#10b981] rounded-full animate-spin mx-auto mb-6"></div>
                <p className="text-[#888]">Loading verification...</p>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
                <div className="text-5xl mb-4 text-red-400">!</div>
                <h2 className="text-2xl font-bold text-red-400 mb-2">Verification Not Found</h2>
                <p className="text-[#888]">{error}</p>
              </div>
            )}

            {/* Content */}
            {verification && !loading && !error && (
              <div className="space-y-10">

                {/* Status */}
                <div
                  className={`border-2 rounded-xl p-12 text-center ${
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
                  <div className={`text-6xl font-bold mb-6 ${isHuman ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {isHuman ? 'VERIFIED' : 'AI DETECTED'}
                  </div>
                  <h2 className={`text-3xl font-bold mb-4 ${isHuman ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                    {isHuman ? 'Human-Written Content' : 'AI-Generated Content'}
                  </h2>
                  <p className="text-[#888] text-base">
                    {isHuman
                      ? 'This content has been verified as human-written by the author'
                      : `Detected as AI-generated with ${Math.round(verification.ai_probability * 100)}% probability`
                    }
                  </p>
                </div>

                {/* Stats - 2 column grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
                    <div className="text-[#888] text-xs uppercase tracking-wider mb-3">
                      Confidence
                    </div>
                    <div className="text-white text-3xl font-bold">
                      {Math.round(verification.confidence * 100)}%
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
                    <div className="text-[#888] text-xs uppercase tracking-wider mb-3">
                      Verified By
                    </div>
                    <div className="text-white text-3xl font-bold">
                      {verification.view_count}
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
                    <div className="text-[#888] text-xs uppercase tracking-wider mb-3">
                      Date
                    </div>
                    <div className="text-white text-lg font-semibold">
                      {new Date(verification.verified_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </div>

                  {verification.platform && (
                    <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
                      <div className="text-[#888] text-xs uppercase tracking-wider mb-3">
                        Platform
                      </div>
                      <div className="text-white text-lg font-semibold capitalize">
                        {verification.platform}
                      </div>
                    </div>
                  )}
                </div>

                {/* Original Post */}
                {verification.post_url && (
                  <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
                    <div className="text-[#888] text-xs uppercase tracking-wider mb-4">
                      Original Post
                    </div>
                    <a
                      href={verification.post_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#10b981] hover:text-[#059669] transition-colors break-all text-sm underline"
                    >
                      {verification.post_url}
                    </a>
                  </div>
                )}

                {/* Hash */}
                <div className="bg-white/[0.02] border border-white/10 rounded-lg p-6">
                  <div className="text-[#888] text-xs uppercase tracking-wider mb-4">
                    Verification Hash
                  </div>
                  <code className="text-white/70 text-xs font-mono break-all bg-black/40 p-3 rounded block">
                    {verification.content_hash}
                  </code>
                </div>

                {/* Info */}
                <div className="border-t border-white/10 pt-10 mt-10">
                  <h3 className="text-xl font-bold text-white mb-6">About This Verification</h3>
                  <div className="space-y-4 text-[#888] text-sm leading-relaxed">
                    {isHuman ? (
                      <>
                        <p>
                          This content has been verified as human-written through Verifily's verification system.
                          The author has claimed this content as their original work.
                        </p>
                        <p>
                          This verification is permanent and can be shared to prove authenticity.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>
                          This content has been analyzed and appears to be AI-generated with high confidence.
                        </p>
                        <p>
                          This verification helps maintain transparency about content origins.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center pt-10 border-t border-white/10 mt-10">
                  <p className="text-[#888] mb-6 text-sm">
                    Verify your own content with Verifily
                  </p>
                  <a
                    href="/"
                    className="inline-block px-8 py-3 bg-[#10b981]/20 border-2 border-[#10b981]/60 text-[#10b981] rounded-lg font-semibold hover:bg-[#10b981]/30 transition-all text-sm"
                    style={{ boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)' }}
                  >
                    Get Verifily
                  </a>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
