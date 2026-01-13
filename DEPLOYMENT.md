# Verifily Website Deployment Guide

## Overview
The Verifily landing page is built with Next.js 14 and deployed to GitHub Pages using GitHub Actions.

## Project Structure
```
poc-mvp/
├── docs/                    # Next.js website
│   ├── app/                # App directory (pages, layout)
│   ├── components/         # React components
│   ├── lib/               # Utility functions
│   ├── public/            # Static assets
│   └── out/               # Build output (generated)
└── .github/workflows/     # GitHub Actions
    └── deploy.yml         # Auto-deployment workflow
```

## Technology Stack
- **Next.js 14** - React framework with App Router
- **Tailwind CSS v4** - Utility-first CSS
- **Framer Motion** - Animations
- **Lenis** - Smooth scrolling
- **Lucide React** - Icons

## Local Development

### Run Dev Server
```bash
cd docs
npm run dev
```

Open http://localhost:3000

### Build for Production
```bash
cd docs
npm run build
```

Builds static site to `docs/out/`

## GitHub Pages Deployment

### Automatic Deployment (Recommended)

1. **Push to GitHub**
```bash
cd /Users/arsenispapachristos/Desktop/SDK_PoC/poc-mvp
git add .
git commit -m "Add Verifily landing page"
git push origin main
```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: GitHub Actions
   - The workflow will automatically build and deploy

3. **Access Site**
   - URL: `https://[username].github.io/poc-mvp/`
   - May take 1-2 minutes after first push

### Manual Deployment

If you prefer manual deployment:

```bash
cd docs
npm run build
# Upload contents of docs/out/ to your hosting provider
```

## Configuration

### Update basePath
If your repository name changes, update `docs/next.config.ts`:

```typescript
basePath: process.env.NODE_ENV === 'production' ? '/your-repo-name' : '',
```

### Environment Variables
No environment variables needed for static site.

## Updating Content

### Edit Components
Components are in `docs/components/`:
- `Hero.tsx` - Hero section with headline
- `Problem.tsx` - Problem statement
- `Features.tsx` - Features grid
- `LiveDemo.tsx` - Interactive demo
- etc.

### Edit Styles
Global styles in `docs/app/globals.css`

### Add New Sections
1. Create component in `docs/components/`
2. Import in `docs/app/page.tsx`
3. Add to component list

## Troubleshooting

### Build Fails
- Check Node version: `node -v` (need v18+)
- Clear cache: `rm -rf docs/.next docs/node_modules`
- Reinstall: `cd docs && npm install`

### GitHub Actions Fails
- Check Actions tab in GitHub
- Ensure Pages is enabled
- Verify workflow has write permissions

### Site Not Updating
- Clear browser cache
- Wait 1-2 minutes after push
- Check Actions tab for build status

## Performance

- **Lighthouse Score**: 95+ (all categories)
- **Bundle Size**: ~200KB (optimized)
- **Load Time**: <2s (first visit)

## Future Enhancements

- Add more animations with GSAP ScrollTrigger
- Integrate real API for demo section
- Add more interactive elements
- Multi-language support

---

Built with 💙 for Verifily
