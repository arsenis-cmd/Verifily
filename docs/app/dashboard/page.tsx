'use client';

import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Verification {
  id: string;
  content: string;
  classification: 'HUMAN' | 'AI' | 'MIXED';
  ai_probability: number;
  confidence: number;
  platform?: string;
  created_at: string;
}

type DetectionStep = 'input' | 'detecting' | 'complete';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [step, setStep] = useState<DetectionStep>('input');
  const [newContent, setNewContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [aiResult, setAiResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoaded, router]);

  useEffect(() => {
    if (user) {
      fetchVerifications();
    }
  }, [user]);

  const fetchVerifications = async () => {
    try {
      const response = await fetch('/api/verifications');
      const data = await response.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDetectAI = async () => {
    if (!newContent || newContent.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    setError('');
    setStep('detecting');

    try {
      // Call Railway backend API
      const apiUrl = process.env.NEXT_PUBLIC_AI_API_URL || 'https://verifily-production.up.railway.app/api/v1';
      const response = await fetch(`${apiUrl}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          content_type: 'text'
        })
      });

      const result = await response.json();
      setAiResult(result);

      // Save to user's account
      await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          classification: result.classification,
          ai_probability: result.ai_probability,
          confidence: result.confidence,
          platform,
          metadata: result
        })
      });

      setStep('complete');
    } catch (error) {
      console.error('Error detecting content:', error);
      setError('Failed to detect content. Please try again.');
      setStep('input');
    }
  };

  const resetModal = () => {
    setShowNewModal(false);
    setStep('input');
    setNewContent('');
    setPlatform('twitter');
    setAiResult(null);
    setError('');
    fetchVerifications();
  };

  if (!isLoaded || loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#888888' }}>Loading...</div>
      </div>
    );
  }

  const isHuman = aiResult?.classification === 'HUMAN';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #222222',
        backgroundColor: '#0a0a0a'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link href="/" style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            textDecoration: 'none'
          }}>
            Verifily
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setShowNewModal(true)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#10b981',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              New Detection
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '48px 24px'
      }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            marginBottom: '8px'
          }}>
            Your Verifications
          </h1>
          <p style={{ color: '#888888', fontSize: '16px' }}>
            All your AI content detections in one place
          </p>
        </div>

        {/* Verifications Grid */}
        {verifications.length === 0 ? (
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <p style={{ color: '#666666', marginBottom: '24px' }}>No verifications yet</p>
            <button
              onClick={() => setShowNewModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#10b981',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Your First Detection
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {verifications.map((verification) => (
              <div
                key={verification.id}
                style={{
                  backgroundColor: '#111111',
                  border: '1px solid #222222',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#222222'}
              >
                {/* Classification Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px'
                }}>
                  <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: verification.classification === 'HUMAN'
                      ? 'rgba(16, 185, 129, 0.1)'
                      : verification.classification === 'AI'
                      ? 'rgba(239, 68, 68, 0.1)'
                      : 'rgba(251, 191, 36, 0.1)',
                    border: `1px solid ${
                      verification.classification === 'HUMAN'
                        ? 'rgba(16, 185, 129, 0.3)'
                        : verification.classification === 'AI'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : 'rgba(251, 191, 36, 0.3)'
                    }`,
                    color: verification.classification === 'HUMAN'
                      ? '#10b981'
                      : verification.classification === 'AI'
                      ? '#ef4444'
                      : '#fbbf24'
                  }}>
                    {verification.classification}
                  </span>
                  <span style={{ color: '#666666', fontSize: '12px' }}>
                    {new Date(verification.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Content Preview */}
                <p style={{
                  color: '#a1a1a1',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {verification.content}
                </p>

                {/* Stats */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid #222222'
                }}>
                  <div>
                    <div style={{ color: '#666666', fontSize: '11px', marginBottom: '4px' }}>
                      AI PROBABILITY
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(verification.ai_probability * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#666666', fontSize: '11px', marginBottom: '4px' }}>
                      CONFIDENCE
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      {(verification.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Detection Modal */}
      {showNewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '20px',
          overflowY: 'auto'
        }}>
          <div style={{
            backgroundColor: '#111111',
            border: '1px solid #222222',
            borderRadius: '16px',
            maxWidth: '800px',
            width: '100%',
            padding: '40px',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              onClick={resetModal}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'transparent',
                border: 'none',
                color: '#666666',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '4px 8px'
              }}
            >
              ✕
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
                New AI Detection
              </h2>
              <p style={{ color: '#888888', fontSize: '14px' }}>
                Analyze content for AI-generated patterns
              </p>
            </div>

            {/* Step Indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              marginBottom: '40px'
            }}>
              {['input', 'detecting', 'complete'].map((s, i) => (
                <div key={s} style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: step === s || (step === 'complete' && i < 2)
                    ? '#10b981'
                    : 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid rgba(239, 68, 68, 0.5)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                color: '#ef4444'
              }}>
                {error}
              </div>
            )}

            {/* Step 1: Input Content */}
            {step === 'input' && (
              <div>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste your content here..."
                  style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: '20px'
                  }}
                />

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#888888'
                  }}>
                    Platform
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="twitter">Twitter/X</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="blog">Blog Post</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  onClick={handleDetectAI}
                  disabled={!newContent || newContent.length < 10}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#10b981',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: newContent.length >= 10 ? 'pointer' : 'not-allowed',
                    opacity: newContent.length >= 10 ? 1 : 0.5
                  }}
                >
                  Detect AI →
                </button>
              </div>
            )}

            {/* Step 2: Detecting */}
            {step === 'detecting' && (
              <div style={{
                textAlign: 'center',
                padding: '60px 40px'
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  border: '4px solid rgba(16, 185, 129, 0.3)',
                  borderTop: '4px solid #10b981',
                  borderRadius: '50%',
                  margin: '0 auto 24px auto',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                  Analyzing Content...
                </h3>
                <p style={{ color: '#888888' }}>Running AI detection model</p>
                <style jsx>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Step 3: Complete */}
            {step === 'complete' && aiResult && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  backgroundColor: isHuman ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${isHuman ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                  borderRadius: '12px',
                  padding: '40px',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    fontSize: '56px',
                    fontWeight: 'bold',
                    color: isHuman ? '#10b981' : '#ef4444',
                    marginBottom: '16px'
                  }}>
                    {Math.round(aiResult.ai_probability * 100)}% AI
                  </div>
                  <p style={{
                    fontSize: '18px',
                    color: isHuman ? '#10b981' : '#ef4444',
                    fontWeight: '600',
                    marginBottom: '8px'
                  }}>
                    {isHuman ? 'Likely Human-Written' : 'Likely AI-Generated'}
                  </p>
                  <p style={{ color: '#888888', fontSize: '14px' }}>
                    Confidence: {Math.round(aiResult.confidence * 100)}%
                  </p>
                </div>

                <button
                  onClick={resetModal}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: '#10b981',
                    color: 'black',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
