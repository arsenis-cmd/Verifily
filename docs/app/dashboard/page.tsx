'use client';

import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
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

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [detecting, setDetecting] = useState(false);

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

  const handleNewDetection = async () => {
    if (!newContent.trim()) return;
    
    setDetecting(true);
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

      // Save to user's account
      await fetch('/api/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newContent,
          classification: result.classification,
          ai_probability: result.ai_probability,
          confidence: result.confidence,
          metadata: result
        })
      });

      // Refresh list
      await fetchVerifications();
      setShowNewModal(false);
      setNewContent('');
    } catch (error) {
      console.error('Error detecting content:', error);
      alert('Failed to detect content. Please try again.');
    } finally {
      setDetecting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000000]">
      {/* Header */}
      <header className="border-b border-[#222222] bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            Verifily
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="primary" size="md" onClick={() => setShowNewModal(true)}>
              New Detection
            </Button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Your Verifications
          </h1>
          <p className="text-[#a1a1a1]">
            All your AI content detections in one place
          </p>
        </div>

        {/* Verifications List */}
        {verifications.length === 0 ? (
          <div className="bg-[#111111] border border-[#222222] rounded-xl p-12 text-center">
            <p className="text-[#666666] mb-4">No verifications yet</p>
            <Button variant="primary" size="md" onClick={() => setShowNewModal(true)}>
              Create Your First Detection
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div
                key={verification.id}
                className="bg-[#111111] border border-[#222222] rounded-xl p-6 hover:border-[#3b82f6]/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        verification.classification === 'HUMAN'
                          ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                          : verification.classification === 'AI'
                          ? 'bg-red-500/10 border border-red-500/30 text-red-500'
                          : 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-500'
                      }`}
                    >
                      {verification.classification}
                    </span>
                    <span className="text-[#666666] text-sm">
                      {new Date(verification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-[#a1a1a1] text-sm">
                    AI: {(verification.ai_probability * 100).toFixed(1)}%
                  </div>
                </div>
                <p className="text-white line-clamp-3">
                  {verification.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Detection Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111111] border border-[#222222] rounded-2xl max-w-2xl w-full p-8">
            <h2 className="text-3xl font-bold text-white mb-6">
              New AI Detection
            </h2>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Paste the content you want to analyze..."
              className="w-full h-64 bg-[#0a0a0a] border border-[#222222] rounded-xl p-4 text-white placeholder:text-[#666666] resize-none focus:outline-none focus:border-[#3b82f6] transition-colors mb-6"
            />
            <div className="flex items-center gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleNewDetection}
                disabled={detecting || !newContent.trim()}
              >
                {detecting ? 'Analyzing...' : 'Detect AI'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  setShowNewModal(false);
                  setNewContent('');
                }}
                disabled={detecting}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
