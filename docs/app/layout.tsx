import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
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
  title: "Verifily — Privacy-safe synthetic data for AI training",
  description: "Transform internal human data into privacy-safe synthetic datasets. Expand training corpora 5–10× while reducing compliance risk under GDPR and the EU AI Act.",
  keywords: "synthetic data, AI training data, GDPR compliance, EU AI Act, privacy-safe datasets, data transformation, machine learning infrastructure",
  authors: [{ name: "Verifily" }],
  openGraph: {
    title: "Verifily — Privacy-safe synthetic data for AI training",
    description: "Transform internal human data into privacy-safe synthetic datasets. Expand training corpora 5–10× while reducing compliance risk under GDPR and the EU AI Act.",
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
    title: "Verifily — Privacy-safe synthetic data for AI training",
    description: "Transform internal human data into privacy-safe synthetic datasets. Expand training corpora 5–10× while reducing compliance risk.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
                       process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key';

  const content = (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="antialiased flex flex-col items-center w-full">
        <div className="w-full max-w-[1600px] mx-auto">
          {children}
        </div>
      </body>
    </html>
  );

  return hasClerkKeys ? (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      afterSignInUrl="/"
      afterSignUpUrl="/"
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      {content}
    </ClerkProvider>
  ) : content;
}
