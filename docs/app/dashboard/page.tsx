'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'detecting' | 'review' | 'verifying' | 'complete'>('input');
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [platform, setPlatform] = useState('twitter');
  const [aiResult, setAiResult] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);
  const [error, setError] = useState('');

  const handleDetectAI = async () => {
    if (!content || content.length < 10) {
      setError('Content must be at least 10 characters');
      return;
    }

    setError('');
    setStep('detecting');

    try {
      const response = await fetch('/api/verify/detect/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platform })
      });

      if (!response.ok) throw new Error('AI detection failed');

      const data = await response.json();
      setAiResult(data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to detect AI');
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
      const response = await fetch('/api/verify/human/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          username,
          platform,
          consent_training_data: true
        })
      });

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();
      setVerification(data.verification);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify content');
      setStep('review');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!verification) return;

    try {
      // Fetch SVG from API
      const response = await fetch(`/api/certificate/${verification.id}/`);
      const svgText = await response.text();

      // Create an image from SVG
      const img = new Image();
      const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Draw image on canvas
          ctx.drawImage(img, 0, 0);

          // Convert to PNG and download
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `verifily-certificate-${verification.id}.png`;
              document.body.appendChild(a);
              a.click();
              URL.revokeObjectURL(url);
              URL.revokeObjectURL(svgUrl);
              document.body.removeChild(a);
            }
          }, 'image/png');
        }
      };

      img.src = svgUrl;
    } catch (err) {
      setError('Failed to download certificate');
    }
  };

  const isHuman = aiResult?.classification === 'human';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      color: 'white',
      padding: '80px 20px 60px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '12px' }}>
            Verifily Dashboard
          </h1>
          <p style={{ color: '#888888', fontSize: '16px' }}>
            Verify your content as human-written
          </p>
        </div>

        {/* Step Indicator */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginBottom: '60px'
        }}>
          {['input', 'detecting', 'review', 'verifying', 'complete'].map((s, i) => (
            <div key={s} style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: step === s || ['detecting', 'review', 'verifying', 'complete'].indexOf(step) > i
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
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '40px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              Step 1: Submit Your Content
            </h2>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
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
                marginBottom: '24px'
              }}
            />

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888888' }}>
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
              disabled={!content || content.length < 10}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: '#10b981',
                color: 'black',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: content.length >= 10 ? 'pointer' : 'not-allowed',
                opacity: content.length >= 10 ? 1 : 0.5
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
            padding: '80px 40px'
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
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
              Analyzing Content...
            </h2>
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
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '40px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>
              Step 2: AI Detection Results
            </h2>

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
                marginBottom: '8px'
              }}>
                {Math.round(aiResult.ai_probability * 100)}% AI Probability
              </div>
              <p style={{ fontSize: '20px', color: isHuman ? '#10b981' : '#ef4444', fontWeight: '600', marginBottom: '12px' }}>
                Classification: {aiResult.classification.toUpperCase()}
              </p>
              <p style={{ color: '#888888', fontSize: '14px', marginBottom: '16px' }}>
                Model Confidence: {Math.round(aiResult.confidence * 100)}%
              </p>
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '13px',
                color: '#888888',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <strong>Detection Breakdown:</strong>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>AI Probability: {(aiResult.ai_probability * 100).toFixed(1)}%</div>
                  <div>Human Probability: {((1 - aiResult.ai_probability) * 100).toFixed(1)}%</div>
                  <div>Confidence Level: {(aiResult.confidence * 100).toFixed(1)}%</div>
                  <div>Classification: {aiResult.classification}</div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888888' }}>
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
              <ul style={{ fontSize: '13px', color: '#888888', paddingLeft: '20px' }}>
                <li>You are the original author of this content</li>
                <li>This content was written by you (human)</li>
                <li>You consent to this data being used for training</li>
              </ul>
            </div>

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
                ← Back
              </button>
              <button
                onClick={handleVerify}
                disabled={!username}
                style={{
                  flex: 2,
                  padding: '16px',
                  backgroundColor: '#10b981',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: username ? 'pointer' : 'not-allowed',
                  opacity: username ? 1 : 0.5
                }}
              >
                Verify as Human →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Verifying */}
        {step === 'verifying' && (
          <div style={{
            textAlign: 'center',
            padding: '80px 40px'
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
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
              Creating Verification...
            </h2>
            <p style={{ color: '#888888' }}>Storing in database and generating certificate</p>
            <style jsx>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && verification && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '40px',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '24px'
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#10b981',
              marginBottom: '16px'
            }}>
              Verification Complete
            </h2>
            <p style={{ color: '#888888', marginBottom: '40px' }}>
              Your content has been verified as human-written
            </p>

            <div style={{
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              borderRadius: '8px',
              padding: '24px',
              marginBottom: '32px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#888888', fontSize: '12px' }}>Verification ID</span>
                <div style={{ fontFamily: 'monospace', fontSize: '14px', marginTop: '4px' }}>
                  {verification.id}
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ color: '#888888', fontSize: '12px' }}>AI Score</span>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>
                  {verification.ai_score_at_verification}% AI probability
                </div>
              </div>
              <div>
                <span style={{ color: '#888888', fontSize: '12px' }}>Verified</span>
                <div style={{ fontSize: '14px', marginTop: '4px' }}>
                  {new Date(verification.verified_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <button
                onClick={handleDownloadCertificate}
                style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: '#10b981',
                  color: 'black',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Download Certificate
              </button>
              <button
                onClick={() => router.push(verification.public_url)}
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
                View Public Page
              </button>
            </div>

            <button
              onClick={() => {
                setStep('input');
                setContent('');
                setUsername('');
                setAiResult(null);
                setVerification(null);
                setError('');
              }}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: '#888888',
                border: 'none',
                fontSize: '14px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Verify Another Content
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
