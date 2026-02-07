'use client';

import { useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
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

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col">
      <Navigation />

      <main className="flex-grow flex items-start justify-center pt-28 pb-20 px-6">
        <div className="w-full max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
                Request a{' '}
                <span className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] bg-clip-text text-transparent">
                  pilot
                </span>
              </h1>
              <div className="w-10 h-px bg-white/20 mx-auto mb-5" />
              <p className="text-sm text-[#888] leading-relaxed max-w-md mx-auto">
                We&apos;re working with ML teams to refine our data transformation
                pipeline. If you&apos;re training models and blocked by compliance
                or data security, tell us about your use case.
              </p>
            </div>

            {!submitted ? (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-8 md:p-10">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name + Email row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#aaa] mb-1.5">
                        Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => update('name', e.target.value)}
                        className="w-full h-11 px-3.5 bg-[#000] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#aaa] mb-1.5">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => update('email', e.target.value)}
                        className="w-full h-11 px-3.5 bg-[#000] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors"
                        placeholder="you@company.com"
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1.5">
                      Company *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => update('company', e.target.value)}
                      className="w-full h-11 px-3.5 bg-[#000] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors"
                      placeholder="Company name"
                    />
                  </div>

                  {/* Use Case */}
                  <div>
                    <label className="block text-xs font-medium text-[#aaa] mb-1.5">
                      Use case *
                    </label>
                    <textarea
                      required
                      value={formData.useCase}
                      onChange={(e) => update('useCase', e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 bg-[#000] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors resize-none"
                      placeholder="What are you training and why do you need synthetic data?"
                    />
                  </div>

                  {/* Dataset + Region row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#aaa] mb-1.5">
                        Dataset type / size
                      </label>
                      <input
                        type="text"
                        value={formData.datasetSize}
                        onChange={(e) => update('datasetSize', e.target.value)}
                        className="w-full h-11 px-3.5 bg-[#000] border border-[#2a2a2a] rounded-lg text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#3b82f6] transition-colors"
                        placeholder="e.g. 10K support tickets"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#aaa] mb-1.5">
                        Compliance region
                      </label>
                      <select
                        value={formData.complianceRegion}
                        onChange={(e) => update('complianceRegion', e.target.value)}
                        className="w-full h-11 px-3.5 bg-[#000] border border-[#2a2a2a] rounded-lg text-sm text-white focus:outline-none focus:border-[#3b82f6] transition-colors"
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
                  <button
                    type="submit"
                    className="w-full h-12 mt-2 text-sm font-medium text-white bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Apply for pilot program
                  </button>
                </form>

                <p className="text-[11px] text-[#555] text-center mt-5">
                  We typically respond within 2 business days.
                  No commitment required.
                </p>
              </div>
            ) : (
              <div className="bg-[#0a0a0a] border border-[#222] rounded-2xl p-10 md:p-12 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="text-emerald-400 text-lg">&#10003;</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Thank you for your interest
                </h3>
                <p className="text-sm text-[#888] mb-6 leading-relaxed max-w-sm mx-auto">
                  Your default email client should open with a pre-filled message.
                  If not, email us directly at{' '}
                  <a
                    href="mailto:pilot@verifily.io"
                    className="text-[#3b82f6] hover:underline"
                  >
                    pilot@verifily.io
                  </a>
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="h-10 px-6 text-sm font-medium text-white border border-[#333] rounded-lg hover:border-[#555] hover:bg-white/[0.03] transition-all"
                >
                  Submit another request
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
