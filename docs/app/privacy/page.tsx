import type { Metadata } from "next";
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SmoothScrollWrapper from '@/components/SmoothScrollWrapper';

export const metadata: Metadata = {
  title: "Privacy Policy - Verifily",
  description: "Learn how Verifily collects, uses, and protects your personal information.",
  openGraph: {
    title: "Privacy Policy - Verifily",
    description: "Learn how Verifily collects, uses, and protects your personal information.",
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
            <p className="text-[#a1a1a1] text-lg">Effective Date: January 22, 2025</p>
          </div>

          {/* Content */}
          <div className="space-y-16 text-[#a1a1a1]">
            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Introduction</h2>
              <p className="leading-relaxed text-lg">
                Welcome to Verifily. We are committed to protecting your privacy and ensuring transparency about how we collect, use, and protect your personal information. This Privacy Policy explains our practices regarding data collection and usage when you use our browser extension and services.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Information We Collect</h2>

              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">1. Information You Provide</h3>
                  <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                    <li><strong className="text-white">Email Address:</strong> When you join our waitlist or sign up for updates, we collect your email address.</li>
                    <li><strong className="text-white">Content for Verification:</strong> When you verify content as human-written, we collect the text you choose to verify along with metadata (timestamp, source URL).</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-white mb-4">2. Automatically Collected Information</h3>
                  <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                    <li><strong className="text-white">Content Analysis Data:</strong> When the extension scans web pages for AI-generated content, we temporarily process text content to provide detection results.</li>
                    <li><strong className="text-white">Usage Statistics:</strong> We collect aggregated, anonymized statistics about AI detection (e.g., total scans performed, percentage of AI-detected content).</li>
                    <li><strong className="text-white">Browser Information:</strong> Basic technical information such as browser type and extension version for compatibility and troubleshooting.</li>
                  </ul>
                </div>

                <div className="border-l-2 border-white/20 pl-6 py-4 bg-white/[0.02]">
                  <h3 className="text-xl font-semibold text-white mb-4">3. Information We Do NOT Collect</h3>
                  <p className="font-semibold text-white mb-3 text-lg">We do not:</p>
                  <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                    <li>Track your browsing history beyond the pages where you actively use Verifily</li>
                    <li>Collect personally identifiable information without your explicit consent</li>
                    <li>Share your personal data with third-party advertisers</li>
                    <li>Store your passwords or sensitive account credentials</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">How We Use Your Information</h2>
              <p className="mb-6 text-lg">We use the collected information for the following purposes:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Provide AI Detection Services:</strong> Analyze content to detect AI-generated text and provide verification badges.</li>
                <li><strong className="text-white">Improve Our Service:</strong> Enhance detection accuracy and user experience based on aggregated usage patterns.</li>
                <li><strong className="text-white">Communication:</strong> Send you updates about new features, improvements, and important service announcements (only if you've opted in).</li>
                <li><strong className="text-white">Verification Records:</strong> Maintain records of content you've verified as human-written, allowing you to prove authenticity.</li>
                <li><strong className="text-white">Analytics:</strong> Generate aggregated statistics about AI content prevalence across the web (anonymized data only).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Data Storage and Security</h2>
              <p className="mb-6 text-lg">We take data security seriously and implement industry-standard measures to protect your information:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Encryption:</strong> All data transmitted between your browser and our servers is encrypted using HTTPS/TLS.</li>
                <li><strong className="text-white">Secure Storage:</strong> Your data is stored on secure cloud servers with access controls and regular security audits.</li>
                <li><strong className="text-white">Data Retention:</strong> We retain your verification records and email for as long as you use our service. You can request deletion at any time.</li>
                <li><strong className="text-white">Local Storage:</strong> Some preferences and statistics are stored locally in your browser and never leave your device.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Data Sharing and Third Parties</h2>
              <p className="mb-6 text-lg">We do not sell your personal information. We may share data only in these limited circumstances:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Service Providers:</strong> We use trusted third-party services for hosting and infrastructure (e.g., Railway.app for backend hosting). These providers are contractually obligated to protect your data.</li>
                <li><strong className="text-white">Legal Requirements:</strong> We may disclose information if required by law, court order, or to protect our rights and safety.</li>
                <li><strong className="text-white">Aggregated Data:</strong> We may share anonymized, aggregated statistics (e.g., "X% of tweets analyzed contain AI content") for research or marketing purposes.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Your Rights and Choices</h2>
              <p className="mb-6 text-lg">You have the following rights regarding your personal data:</p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong className="text-white">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
                <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing emails at any time using the link in our emails.</li>
                <li><strong className="text-white">Disable Extension:</strong> You can disable or uninstall the extension at any time, which will stop all data collection.</li>
                <li><strong className="text-white">Toggle Detection:</strong> Use the on/off toggle in the extension popup to temporarily disable AI detection without uninstalling.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Cookies and Tracking</h2>
              <p className="leading-relaxed text-lg">
                The Verifily extension does not use traditional cookies. However, we use browser local storage to save your preferences and statistics on your device. This data is not transmitted to our servers unless you actively use verification features.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Children's Privacy</h2>
              <p className="leading-relaxed text-lg">
                Verifily is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">Changes to This Privacy Policy</h2>
              <p className="mb-6 text-lg">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of significant changes by:
              </p>
              <ul className="list-disc list-inside space-y-3 ml-4 text-lg">
                <li>Updating the "Effective Date" at the top of this policy</li>
                <li>Sending an email notification if you're on our mailing list</li>
                <li>Displaying a notification in the extension</li>
              </ul>
              <p className="mt-6 leading-relaxed text-lg">
                Your continued use of Verifily after changes indicates your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-3xl font-bold text-white mb-6">International Data Transfers</h2>
              <p className="leading-relaxed text-lg">
                Your data may be processed and stored in countries outside your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
              </p>
            </section>

            {/* Contact Section */}
            <section className="border border-white/10 rounded-lg p-8 md:p-12 bg-white/[0.02] text-center">
              <h2 className="text-3xl font-bold text-white mb-6">Contact Us</h2>
              <p className="mb-8 leading-relaxed text-lg">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
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
            <p className="text-[#a1a1a1]/60">&copy; 2025 Verifily. All rights reserved.</p>
          </div>
        </div>
      </main>

      <Footer />
    </SmoothScrollWrapper>
  );
}
