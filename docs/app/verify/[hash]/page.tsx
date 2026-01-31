'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Verification {
  content_hash: string;
  classification: string;
  ai_probability: number;
  confidence: number;
  view_count: number;
  verified_at: string;
  platform: string;
  post_url?: string;
  username?: string;
  shareable_url?: string;
  badge_url?: string;
}

export default function VerifyPage() {
  const params = useParams();
  const hash = params.hash as string;
  const [verification, setVerification] = useState<Verification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchVerification() {
      try {
        const response = await fetch(`/api/verify/check/${hash}/`);
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

    fetchVerification();
  }, [hash]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const aiPercentage = Math.round(verification.ai_probability * 100);
  const confidencePercentage = Math.round(verification.confidence * 100);
  const isHuman = verification.classification === 'human';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <a href="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-purple-600">Verifily</h1>
          </a>
          <h2 className="text-2xl font-bold text-gray-900">Verification Details</h2>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Classification Badge */}
          <div className="text-center mb-8">
            <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold ${
              isHuman
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              <span className="text-2xl">{isHuman ? '✓' : '⚠'}</span>
              <span>Verified as {verification.classification}</span>
            </div>
          </div>

          {/* AI Score */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-medium">AI Detection Score</span>
              <span className="text-2xl font-bold text-gray-900">{aiPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  aiPercentage < 30 ? 'bg-green-500' :
                  aiPercentage < 70 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${aiPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {aiPercentage < 30 && 'Low AI probability - likely human-written'}
              {aiPercentage >= 30 && aiPercentage < 70 && 'Moderate AI probability - mixed content'}
              {aiPercentage >= 70 && 'High AI probability - likely AI-generated'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium mb-1">Confidence</div>
              <div className="text-2xl font-bold text-gray-900">{confidencePercentage}%</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium mb-1">Views</div>
              <div className="text-2xl font-bold text-gray-900">{verification.view_count}</div>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t border-gray-200 pt-6 space-y-3">
            {verification.username && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Username</span>
                <span className="text-gray-900 font-medium">@{verification.username}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Platform</span>
              <span className="text-gray-900 font-medium capitalize">{verification.platform}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Verified</span>
              <span className="text-gray-900 font-medium">
                {new Date(verification.verified_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>

          {/* Original Post Link */}
          {verification.post_url && (
            <div className="mt-6">
              <a
                href={verification.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition"
              >
                View Original Post →
              </a>
            </div>
          )}
        </div>

        {/* Trust Badge */}
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">
            This content was verified using Verifily's AI detection technology
          </p>
          <a
            href="/"
            className="inline-block bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Get Verified
          </a>
        </div>

        {/* Footer Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          Verification ID: {hash}
        </p>
      </div>
    </div>
  );
}
