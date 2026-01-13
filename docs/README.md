# Verifily - Know What's AI. Prove What's Human.

The official landing page for Verifily - a browser extension that detects AI-generated content and helps you verify authentic human work.

## 🌐 Live Site

Visit: [https://verifily.ai](https://verifily.ai) (deployed via GitHub Pages)

## 🚀 What is Verifily?

Verifily is a Chrome extension that provides real-time AI content detection and human verification across the web. With the rise of AI-generated content, Verifily creates a trust layer for the internet by:

- **Detecting AI content** on any webpage with 95%+ accuracy
- **Verifying human attention** through eye tracking and engagement
- **Proving authenticity** with cryptographic verification
- **Building trust** in the AI era

## 🎯 Key Features

- **Real-time AI Detection** - Instantly identify AI-generated text and images
- **Twitter Bot Detection** - See which tweets are from bots or AI
- **Visual Highlighting** - Red for AI, green for human content
- **PoC Certified** - Network effect verification shared across all users
- **Privacy-First** - All processing happens locally or encrypted
- **Free & Open** - Available for everyone

## 💻 Local Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Navigate to docs folder
cd poc-mvp/docs

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the site.

### Build for Production

```bash
# Create optimized production build
npm run build

# The output will be in the 'out' folder
```

## 📁 Project Structure

```
docs/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Hero.tsx          # Hero section
│   ├── ProblemSection.tsx # Problem statement
│   ├── HowItWorks.tsx    # Explanation section
│   ├── LiveDemo.tsx      # Interactive demo
│   └── ...               # Other components
├── public/               # Static assets
└── next.config.ts        # Next.js configuration
```

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **Tailwind CSS v4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lenis** - Smooth scrolling
- **Lucide React** - Icon library
- **TypeScript** - Type safety

## 🚢 Deployment

The site is automatically deployed to GitHub Pages via GitHub Actions whenever changes are pushed to the main branch.

### Manual Deployment

```bash
# Build the site
npm run build

# The 'out' folder contains the static site
# Upload to any static hosting provider
```

## 📈 Performance

- Lighthouse Score: 95+ (all categories)
- Bundle Size: ~200KB (optimized)
- Load Time: <2s (first visit)

## 🤝 Contributing

This is the marketing website for Verifily. For the main application code:
- Extension: `../extension/`
- Backend API: `../backend/`
- Dashboard: `../dashboard/`

## 📄 License

Proprietary - Part of the Proof of Consideration platform

## 🔗 Links

- [Live Website](https://verifily.ai)
- [Chrome Extension](https://chrome.google.com/webstore)
- [Documentation](../README.md)
- [GitHub](https://github.com/yourusername/poc-mvp)

---

Built with ❤️ for transparency in the AI era
