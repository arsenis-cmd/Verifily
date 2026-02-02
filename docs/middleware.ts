import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/creators(.*)',
  '/privacy(.*)',
  '/api/newsletter(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/dashboard(.*)'
]);

// Only use Clerk middleware if keys are configured
const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
                     process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== 'your_clerk_publishable_key';

export default hasClerkKeys
  ? clerkMiddleware(async (auth, request) => {
      // Don't protect API routes - let them handle auth internally
      const isApiRoute = request.nextUrl.pathname.startsWith('/api/');
      if (!isPublicRoute(request) && !isApiRoute) {
        await auth.protect();
      }
    })
  : () => NextResponse.next();

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
