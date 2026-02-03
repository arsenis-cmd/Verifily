'use client';

import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface Verification {
  id: string;
  content: string;
  content_hash: string;
  classification: 'HUMAN' | 'AI' | 'MIXED';
  ai_probability: number;
  confidence: number;
  platform?: string;
  created_at: string;
}

type DetectionStep = 'input' | 'detecting' | 'review' | 'verifying' | 'complete';

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [step, setStep] = useState<DetectionStep>('input');
  const [newContent, setNewContent] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [username, setUsername] = useState('');
  const [aiResult, setAiResult] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [error, setError] = useState('');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
      const response = await fetch('/api/verifications', {
        credentials: 'include'
      });
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
      setStep('review');
    } catch (error) {
      console.error('Error detecting content:', error);
      setError('Failed to detect content. Please try again.');
      setStep('input');
    }
  };

  const handleVerify = async () => {
    if (!username || username.length < 2) {
      setError('Please enter your username');
      return;
    }

    setError('');
    setStep('verifying');

    try {
      // Save to user's account
      const response = await fetch('/api/verifications', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          classification: aiResult.classification,
          ai_probability: aiResult.ai_probability,
          confidence: aiResult.confidence,
          platform,
          metadata: { ...aiResult, username }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Error response:', data);
        setError(`Failed to save: ${data.details || data.error || 'Unknown error'}`);
        setStep('review');
        return;
      }

      setVerification(data.verification);
      setStep('complete');
    } catch (error) {
      console.error('Error saving verification:', error);
      setError('Failed to save verification. Please try again.');
      setStep('review');
    }
  };

  const resetModal = () => {
    setShowNewModal(false);
    setStep('input');
    setNewContent('');
    setPlatform('twitter');
    setUsername('');
    setAiResult(null);
    setVerification(null);
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
                onClick={() => {
                  setSelectedVerification(verification);
                  setShowDetailsModal(true);
                }}
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
              {['input', 'detecting', 'review', 'verifying', 'complete'].map((s, i) => {
                const stepIndex = ['input', 'detecting', 'review', 'verifying', 'complete'].indexOf(step);
                const currentIndex = ['input', 'detecting', 'review', 'verifying', 'complete'].indexOf(s);
                return (
                  <div key={s} style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: currentIndex <= stepIndex
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
                );
              })}
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

            {/* Step 3: Review AI Results */}
            {step === 'review' && aiResult && (
              <div>
                <div style={{
                  backgroundColor: isHuman ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `2px solid ${isHuman ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                  marginBottom: '32px'
                }}>
                  <div style={{
                    fontSize: '48px',
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

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    color: '#888888'
                  }}>
                    Your Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="@username"
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px'
                }}>
                  <p style={{ fontSize: '14px', color: '#888888', marginBottom: '8px' }}>
                    By verifying, you confirm that:
                  </p>
                  <ul style={{ fontSize: '13px', color: '#888888', paddingLeft: '20px', margin: 0 }}>
                    <li>You are the original author of this content</li>
                    <li>This content was written by you (human)</li>
                    <li>You consent to this data being used for training</li>
                  </ul>
                </div>

                {/* Show warning if AI probability is >= 30% */}
                {aiResult.ai_probability >= 0.30 && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    textAlign: 'center'
                  }}>
                    <p style={{ fontSize: '14px', color: '#ef4444', fontWeight: '600', marginBottom: '4px' }}>
                      Cannot Verify as Human
                    </p>
                    <p style={{ fontSize: '13px', color: '#888888' }}>
                      Content must be less than 30% AI to verify as human-written. Your content is {Math.round(aiResult.ai_probability * 100)}% AI.
                    </p>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => {
                      setStep('input');
                      setAiResult(null);
                      setError('');
                    }}
                    style={{
                      flex: 1,
                      padding: '16px',
                      backgroundColor: 'transparent',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={!username || aiResult.ai_probability >= 0.30}
                    style={{
                      flex: 2,
                      padding: '16px',
                      backgroundColor: aiResult.ai_probability >= 0.30 ? '#666666' : '#10b981',
                      color: aiResult.ai_probability >= 0.30 ? '#333333' : 'black',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: (username && aiResult.ai_probability < 0.30) ? 'pointer' : 'not-allowed',
                      opacity: (username && aiResult.ai_probability < 0.30) ? 1 : 0.5
                    }}
                  >
                    Verify as Human
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Verifying */}
            {step === 'verifying' && (
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
                  Creating Verification...
                </h3>
                <p style={{ color: '#888888' }}>Storing in database</p>
                <style jsx>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Step 5: Complete */}
            {step === 'complete' && verification && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  color: '#10b981',
                  marginBottom: '24px'
                }}>
                  Verification Complete
                </div>
                <p style={{ color: '#888888', marginBottom: '40px', fontSize: '16px' }}>
                  Your content has been verified and saved to your dashboard
                </p>

                <div style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '32px',
                  textAlign: 'left'
                }}>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: '#888888', fontSize: '12px' }}>Verification ID</span>
                    <div style={{ fontFamily: 'monospace', fontSize: '14px', marginTop: '4px' }}>
                      {verification.id}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: '#888888', fontSize: '12px' }}>Classification</span>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      {verification.classification}
                    </div>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ color: '#888888', fontSize: '12px' }}>AI Probability</span>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      {Math.round(verification.ai_probability * 100)}%
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#888888', fontSize: '12px' }}>Confidence</span>
                    <div style={{ fontSize: '14px', marginTop: '4px' }}>
                      {Math.round(verification.confidence * 100)}%
                    </div>
                  </div>
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

      {/* Verification Details Modal */}
      {showDetailsModal && selectedVerification && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowDetailsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#000000',
              border: '1px solid #222222',
              borderRadius: '16px',
              padding: '40px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '32px'
            }}>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>
                  Verification Details
                </h2>
                <p style={{ color: '#666666', fontSize: '14px' }}>
                  {new Date(selectedVerification.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#666666',
                  fontSize: '32px',
                  cursor: 'pointer',
                  lineHeight: 1,
                  padding: 0
                }}
              >
                ×
              </button>
            </div>

            {/* Classification Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '32px'
            }}>
              <span style={{
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: 'bold',
                backgroundColor: selectedVerification.classification === 'HUMAN'
                  ? 'rgba(16, 185, 129, 0.1)'
                  : selectedVerification.classification === 'AI'
                  ? 'rgba(239, 68, 68, 0.1)'
                  : 'rgba(251, 191, 36, 0.1)',
                border: `1px solid ${
                  selectedVerification.classification === 'HUMAN'
                    ? 'rgba(16, 185, 129, 0.3)'
                    : selectedVerification.classification === 'AI'
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(251, 191, 36, 0.3)'
                }`,
                color: selectedVerification.classification === 'HUMAN'
                  ? '#10b981'
                  : selectedVerification.classification === 'AI'
                  ? '#ef4444'
                  : '#fbbf24'
              }}>
                {selectedVerification.classification}
              </span>
              <div style={{ color: '#888888', fontSize: '14px' }}>
                <span style={{ color: '#666666' }}>AI Probability:</span>{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {Math.round(selectedVerification.ai_probability * 100)}%
                </span>
                {' | '}
                <span style={{ color: '#666666' }}>Confidence:</span>{' '}
                <span style={{ fontWeight: 'bold' }}>
                  {Math.round(selectedVerification.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Platform */}
            {selectedVerification.platform && (
              <div style={{ marginBottom: '24px' }}>
                <p style={{ color: '#666666', fontSize: '12px', marginBottom: '4px' }}>
                  Platform
                </p>
                <p style={{ color: 'white', fontSize: '14px', textTransform: 'capitalize' }}>
                  {selectedVerification.platform}
                </p>
              </div>
            )}

            {/* Content */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ color: '#666666', fontSize: '12px', marginBottom: '12px' }}>
                Verified Content
              </p>
              <div style={{
                backgroundColor: '#111111',
                border: '1px solid #222222',
                borderRadius: '12px',
                padding: '24px',
                maxHeight: '400px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                <p style={{
                  color: '#e5e5e5',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  {selectedVerification.content}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div style={{
              backgroundColor: '#111111',
              border: '1px solid #222222',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <p style={{ color: '#666666', fontSize: '12px', marginBottom: '12px' }}>
                Technical Details
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px' }}>Verification ID</p>
                  <p style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#a1a1a1',
                    marginTop: '4px',
                    wordBreak: 'break-all'
                  }}>
                    {selectedVerification.id}
                  </p>
                </div>
                <div>
                  <p style={{ color: '#888888', fontSize: '12px' }}>Content Hash</p>
                  <p style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#a1a1a1',
                    marginTop: '4px'
                  }}>
                    {selectedVerification.content_hash}
                  </p>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowDetailsModal(false)}
              style={{
                width: '100%',
                marginTop: '24px',
                padding: '14px',
                backgroundColor: '#10b981',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
