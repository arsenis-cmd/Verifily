'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

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

    const subject = encodeURIComponent('Verifily Pilot Program Request');
    const body = encodeURIComponent(
`Name: ${formData.name}
Email: ${formData.email}
Company: ${formData.company}
Use Case: ${formData.useCase}
Dataset Type/Size: ${formData.datasetSize}
Compliance Region: ${formData.complianceRegion}`
    );

    window.location.href = `mailto:pilot@verifily.io?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const update = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const inputClass =
    'w-full h-[56px] px-5 bg-[#000] border border-[#2a2a2a] rounded-xl text-base text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors';

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      <Navigation />

      <main className="flex-grow flex items-center justify-center py-40 px-6">
        <div className="w-full max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-16">
              <h1 className="text-white !text-5xl md:!text-6xl lg:!text-7xl mb-6">
                Request a{' '}
                <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                  pilot
                </span>
              </h1>
              <div className="w-12 h-px bg-white/20 mx-auto mb-8" />
              <p className="text-lg md:text-xl text-[#888] leading-relaxed max-w-xl mx-auto text-center">
                We&apos;re working with ML teams to refine our data transformation
                pipeline. If you&apos;re training models and blocked by compliance
                or data security, tell us about your use case.
              </p>
            </div>

            {!submitted ? (
              <div className="card">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-[#aaa] mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => update('name', e.target.value)}
                        className={inputClass}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#aaa] mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={inputClass}
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-[#aaa] mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => update('company', e.target.value)}
                      className={inputClass}
                      placeholder="Company name"
                    />
                  </div>

                  {/* Use Case */}
                  <div>
                    <label className="block text-sm font-medium text-[#aaa] mb-2">
                      Use case *
                    </label>
                    <textarea
                      required
                      value={formData.useCase}
                      onChange={(e) => update('useCase', e.target.value)}
                      rows={4}
                      className="w-full px-5 py-4 bg-[#000] border border-[#2a2a2a] rounded-xl text-base text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                      placeholder="What are you training and why do you need synthetic data?"
                    />
                  </div>

                  {/* Dataset + Region row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-[#aaa] mb-2">
                        Dataset type / size
                      </label>
                      <input
                        type="text"
                        value={formData.datasetSize}
                        onChange={(e) => update('datasetSize', e.target.value)}
                        className={inputClass}
                        placeholder="e.g. 10K support tickets"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#aaa] mb-2">
                        Compliance region
                      </label>
                      <select
                        value={formData.complianceRegion}
                        onChange={(e) => update('complianceRegion', e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        <option value="EU">EU (GDPR)</option>
                        <option value="US">US</option>
                        <option value="Global">Global</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      className="w-full"
                    >
                      Apply for pilot program
                    </Button>
                  </div>
                </form>

                <p className="text-sm text-[#555] text-center mt-8">
                  We typically respond within 2 business days.
                  No commitment required.
                </p>
              </div>
            ) : (
              <div className="card text-center">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-8">
                  <span className="text-emerald-400 text-2xl">&#10003;</span>
                </div>
                <h3 className="text-white mb-4">
                  Thank you for your interest
                </h3>
                <p className="text-base text-[#888] mb-8 leading-relaxed max-w-md mx-auto">
                  Your default email client should open with a pre-filled message.
                  If not, email us directly at{' '}
                  <a
                    href="mailto:pilot@verifily.io"
                    className="text-[#3b82f6] hover:underline"
                  >
                    pilot@verifily.io
                  </a>
                </p>
                <Button
                  variant="secondary"
                  size="sm"
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
