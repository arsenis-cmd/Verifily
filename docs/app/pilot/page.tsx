'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function PilotPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    datasetSize: '',
    complianceRegion: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create mailto link with form data
    const subject = encodeURIComponent('Verifily Pilot Program Request');
    const body = encodeURIComponent(`
Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Use Case: ${formData.useCase}
Dataset Type/Size: ${formData.datasetSize}
Compliance Region: ${formData.complianceRegion}
    `);

    window.location.href = `mailto:pilot@verifily.io?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      <Navigation />

      <main className="flex-grow pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-6">
              Request a{' '}
              <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                pilot
              </span>
            </h1>

            <div className="w-16 h-[2px] bg-white/20 mb-8" />

            <p className="text-lg text-[#a1a1a1] mb-12">
              We're working with ML teams to refine our data transformation pipeline.
              Tell us about your use case, and we'll reach out to discuss a pilot.
            </p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#3b82f6] transition-colors"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#3b82f6] transition-colors"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#3b82f6] transition-colors"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Use Case *
                  </label>
                  <textarea
                    required
                    value={formData.useCase}
                    onChange={(e) =>
                      setFormData({ ...formData, useCase: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                    placeholder="Describe what you're training and why you need synthetic data..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Dataset Type/Size (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.datasetSize}
                    onChange={(e) =>
                      setFormData({ ...formData, datasetSize: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-white placeholder-[#666666] focus:outline-none focus:border-[#3b82f6] transition-colors"
                    placeholder="e.g., 10K internal support tickets, 500K user messages"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Compliance Region (optional)
                  </label>
                  <select
                    value={formData.complianceRegion}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        complianceRegion: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#222222] rounded-lg text-white focus:outline-none focus:border-[#3b82f6] transition-colors"
                  >
                    <option value="">Select a region...</option>
                    <option value="EU">EU (GDPR)</option>
                    <option value="US">US</option>
                    <option value="Global">Global</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <Button type="submit" variant="primary" size="lg" className="w-full">
                  Submit pilot request
                </Button>
              </form>
            ) : (
              <div className="card text-center p-12">
                <div className="text-5xl mb-6">✓</div>
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Thank you for your interest!
                </h3>
                <p className="text-[#888888] mb-6">
                  Your default email client should open with a pre-filled message.
                  If not, please email us directly at{' '}
                  <a
                    href="mailto:pilot@verifily.io"
                    className="text-[#3b82f6] hover:underline"
                  >
                    pilot@verifily.io
                  </a>
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setSubmitted(false)}
                >
                  Submit another request
                </Button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
