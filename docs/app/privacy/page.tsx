import type { Metadata } from "next";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SmoothScrollWrapper from '@/components/SmoothScrollWrapper';

export const metadata: Metadata = {
  title: "Privacy Policy - Verifily",
  description: "Learn how Verifily handles data privacy and security for synthetic dataset generation.",
  openGraph: {
    title: "Privacy Policy - Verifily",
    description: "Learn how Verifily handles data privacy and security for synthetic dataset generation.",
    url: "https://verifily.io/privacy",
    siteName: "Verifily",
  },
};

export default function PrivacyPolicy() {
  return (
    <SmoothScrollWrapper>
      <Navigation />

      <main className="bg-[#000000] min-h-screen">
        <div className="max-w-4xl mx-auto px-6 md:px-12 pt-32 pb-24">
          {/* Header */}
          <div className="text-center mb-20">
            <div className="w-16 h-[2px] bg-white/20 mx-auto mb-8" />
            <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-4">
              Privacy Policy
            </h1>
            <p className="text-[#a1a1a1] text-lg">Effective Date: February 1, 2026</p>
          </div>

          {/* Content */}
          <div className="space-y-16 text-[#a1a1a1]">
            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Introduction</h2>
              <p className="leading-relaxed text-lg">
                Verifily provides a data transformation layer that converts internal human data into privacy-safe synthetic datasets for AI training. This Privacy Policy explains how we handle data when organizations use our platform, including what we collect, how we process it, and the safeguards we apply.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Information We Collect</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">1. Organization Information</h3>
                  <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                    <li><strong className="text-white">Contact Details:</strong> Name, email, and company information provided when requesting a pilot or contacting us.</li>
                    <li><strong className="text-white">Account Data:</strong> Organization name, pilot configuration, and billing details for active customers.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">2. Dataset Metadata</h3>
                  <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                    <li><strong className="text-white">Pipeline Configuration:</strong> Transformation parameters, filter settings, expansion targets, and run history.</li>
                    <li><strong className="text-white">Quality Metrics:</strong> Duplication rates, overlap scores, and leakage check results for synthetic outputs.</li>
                    <li><strong className="text-white">Audit Logs:</strong> Timestamps, dataset versions, and run metadata for reproducibility and compliance.</li>
                  </ul>
                </div>

                <div className="border-l-2 border-white/20 pl-6 py-4 bg-white/[0.02]">
                  <h3 className="text-xl font-semibold text-white mb-4">3. What We Do NOT Retain</h3>
                  <p className="font-semibold text-white mb-3 text-lg">By design, Verifily minimizes data retention:</p>
                  <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                    <li>Raw seed data is processed in-memory and not stored beyond the transformation run unless explicitly configured</li>
                    <li>We do not store or access the content of your training data after synthetic output is generated</li>
                    <li>We do not share raw or synthetic datasets with third parties</li>
                    <li>We do not use customer data to train our own models</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">How We Use Your Information</h2>
              <p className="mb-6 text-lg">We use collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Data Transformation:</strong> Process input datasets through our pipeline to generate privacy-safe synthetic outputs.</li>
                <li><strong className="text-white">Quality Assurance:</strong> Run deduplication, n-gram overlap, and leakage checks on synthetic datasets.</li>
                <li><strong className="text-white">Platform Improvement:</strong> Use aggregated, anonymized pipeline metrics to improve transformation quality and system reliability.</li>
                <li><strong className="text-white">Communication:</strong> Send pilot updates, product announcements, and service notifications (only with consent).</li>
                <li><strong className="text-white">Compliance Support:</strong> Maintain audit logs and version history to support your regulatory obligations under GDPR, the EU AI Act, and similar frameworks.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Data Storage and Security</h2>
              <p className="mb-6 text-lg">We implement industry-standard security measures:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Encryption:</strong> All data in transit is encrypted via TLS. Data at rest is encrypted using AES-256.</li>
                <li><strong className="text-white">Access Controls:</strong> Role-based access controls limit who can view or modify datasets and pipeline configurations.</li>
                <li><strong className="text-white">Infrastructure:</strong> Hosted on secure cloud infrastructure with regular security audits and monitoring.</li>
                <li><strong className="text-white">Data Isolation:</strong> Each organization's data is logically isolated. On-premise deployment is available for Enterprise customers.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Data Sharing and Third Parties</h2>
              <p className="mb-6 text-lg">We do not sell organizational or dataset information. We may share data only in these limited circumstances:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Infrastructure Providers:</strong> We use trusted cloud providers for hosting and compute. These providers are bound by data processing agreements.</li>
                <li><strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect our legal rights.</li>
                <li><strong className="text-white">Aggregated Metrics:</strong> We may share anonymized, aggregated platform metrics (e.g., average expansion ratios) for research or reporting purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Your Rights</h2>
              <p className="mb-6 text-lg">Organizations and their representatives have the following rights:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Access:</strong> Request details about what data we hold related to your organization.</li>
                <li><strong className="text-white">Correction:</strong> Request correction of inaccurate account or contact information.</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your organization's data, including pipeline configurations and audit logs (subject to legal retention requirements).</li>
                <li><strong className="text-white">Data Portability:</strong> Export your synthetic datasets and pipeline configurations at any time.</li>
                <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications at any time.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Cookies and Tracking</h2>
              <p className="leading-relaxed text-lg">
                Our website uses minimal cookies for essential functionality (e.g., session management for authenticated dashboard access). We do not use third-party advertising trackers. Analytics, if used, are privacy-respecting and anonymized.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">International Data Transfers</h2>
              <p className="leading-relaxed text-lg">
                Data may be processed in jurisdictions outside your country of residence. We ensure appropriate safeguards (such as Standard Contractual Clauses) are in place for cross-border transfers in accordance with GDPR and applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Changes to This Privacy Policy</h2>
              <p className="mb-6 text-lg">
                We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of material changes by:
              </p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li>Updating the &quot;Effective Date&quot; at the top of this policy</li>
                <li>Sending an email notification to active pilot and production customers</li>
              </ul>
              <p className="mt-6 leading-relaxed text-lg">
                Continued use of Verifily after changes indicates acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Section */}
            <section className="border border-white/10 rounded-lg p-8 md:p-12 bg-white/[0.02] text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Contact Us</h2>
              <p className="mb-8 leading-relaxed text-lg">
                If you have questions, concerns, or requests regarding this Privacy Policy or your data, please contact us:
              </p>
              <div className="space-y-3 text-lg">
                <p>
                  <strong className="text-white">Email:</strong>{' '}
                  <a href="mailto:privacy@verifily.io" className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors underline">
                    privacy@verifily.io
                  </a>
                </p>
                <p>
                  <strong className="text-white">Website:</strong>{' '}
                  <a href="https://verifily.io" className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors underline">
                    verifily.io
                  </a>
                </p>
              </div>
              <p className="mt-8 text-[#a1a1a1]/60">
                We will respond to your inquiry within 30 days.
              </p>
            </section>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-20 pt-12 border-t border-white/10">
            <p className="text-[#a1a1a1]/60">&copy; 2026 Verifily. All rights reserved.</p>
          </div>
        </div>
      </main>

      <Footer />
    </SmoothScrollWrapper>
  );
}
