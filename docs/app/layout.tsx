import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Verifily - Know what's AI. Prove what's human.",
  description: "The browser extension that detects AI-generated content and lets you verify your authentic human work. Join the trust layer for the AI era.",
  keywords: "AI detection, content verification, human verification, AI checker, content authenticity",
  authors: [{ name: "Verifily" }],
  openGraph: {
    title: "Verifily - Know what's AI. Prove what's human.",
    description: "The browser extension that detects AI-generated content and lets you verify your authentic human work.",
    url: "https://verifily.io",
    siteName: "Verifily",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verifily - Know what's AI. Prove what's human.",
    description: "The browser extension that detects AI-generated content and lets you verify your authentic human work.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="antialiased flex flex-col items-center w-full">
        <div className="w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}
