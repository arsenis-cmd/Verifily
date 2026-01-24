'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

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
        if (!response.ok) throw new Error('Verification not found');
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: 'white',
      padding: '80px 20px 60px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>
            Content Verification
          </h1>
          <p style={{ color: '#888888', fontSize: '14px' }}>
            Cryptographic proof of authenticity
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(16, 185, 129, 0.3)',
              borderTop: '4px solid #10b981',
              borderRadius: '50%',
              margin: '0 auto 20px auto',
              animation: 'spin 1s linear infinite'
            }}></div>
            <p style={{ color: '#888888' }}>Loading...</p>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ef4444' }}>!</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
              Not Found
            </h2>
            <p style={{ color: '#888888' }}>{error}</p>
          </div>
        )}

        {/* Content */}
        {verification && !loading && !error && (
          <div>

            {/* Status Card */}
            <div style={{
              backgroundColor: isHuman ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
              border: `2px solid ${isHuman ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
              borderRadius: '12px',
              padding: '48px 24px',
              textAlign: 'center',
              marginBottom: '40px',
              boxShadow: isHuman ? '0 0 30px rgba(16, 185, 129, 0.15)' : '0 0 30px rgba(239, 68, 68, 0.15)'
            }}>
              <div style={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: isHuman ? '#10b981' : '#ef4444',
                marginBottom: '20px'
              }}>
                {isHuman ? 'VERIFIED' : 'AI DETECTED'}
              </div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: 'bold',
                color: isHuman ? '#10b981' : '#ef4444',
                marginBottom: '12px'
              }}>
                {isHuman ? 'Human-Written Content' : 'AI-Generated Content'}
              </h2>
              <p style={{ color: '#888888', fontSize: '15px' }}>
                {isHuman
                  ? 'Verified as human-written by the author'
                  : `Detected as AI-generated (${Math.round(verification.ai_probability * 100)}% probability)`
                }
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Confidence
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {Math.round(verification.confidence * 100)}%
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Verified By
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
                  {verification.view_count}
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px'
              }}>
                <div style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Date
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                  {new Date(verification.verified_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>

              {verification.platform && (
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '24px'
                }}>
                  <div style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Platform
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {verification.platform}
                  </div>
                </div>
              )}
            </div>

            {/* Hash */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '40px'
            }}>
              <div style={{ color: '#888888', fontSize: '11px', textTransform: 'uppercase', marginBottom: '12px' }}>
                Verification Hash
              </div>
              <code style={{
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '11px',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                display: 'block',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                padding: '12px',
                borderRadius: '8px'
              }}>
                {verification.content_hash}
              </code>
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center', paddingTop: '20px' }}>
              <p style={{ color: '#888888', fontSize: '14px', marginBottom: '20px' }}>
                Verify your own content with Verifily
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '2px solid rgba(16, 185, 129, 0.6)',
                  color: '#10b981',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  textDecoration: 'none',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
                }}
              >
                Get Verifily
              </a>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
