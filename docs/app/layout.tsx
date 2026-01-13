import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Verifily - Detect AI Content Instantly",
  description: "Chrome extension that detects AI-generated text in real-time. 99.7% accuracy, lightning-fast detection, and privacy-first design. Verify the truth on any website.",
  keywords: "AI detection, AI content detector, verify AI text, Chrome extension, content verification",
  authors: [{ name: "Verifily" }],
  openGraph: {
    title: "Verifily - Detect AI Content Instantly",
    description: "Chrome extension that detects AI-generated text in real-time with 99.7% accuracy.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
