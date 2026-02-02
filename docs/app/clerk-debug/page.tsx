'use client';

export default function ClerkDebugPage() {
  const hasPublishableKey = typeof window !== 'undefined' &&
    // @ts-ignore
    window.__clerk_publishable_key !== undefined;

  return (
    <div className="min-h-screen bg-[#000000] text-white p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Clerk Configuration Debug</h1>

        <div className="bg-[#111111] border border-[#222222] rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Environment Check</h2>

          <div className="space-y-2 font-mono text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:</span>
              <span className={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "text-green-400" : "text-red-400"}>
                {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
                  ? `${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.substring(0, 20)}...`
                  : "NOT SET"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-gray-400">Key Type:</span>
              <span className={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_') ? "text-green-400" : "text-yellow-400"}>
                {process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')
                  ? "PRODUCTION (pk_live_)"
                  : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
                    ? "DEVELOPMENT (pk_test_)"
                    : "UNKNOWN"}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-gray-400">Current Domain:</span>
              <span className="text-blue-400">
                {typeof window !== 'undefined' ? window.location.hostname : 'server-side'}
              </span>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-gray-400">Current URL:</span>
              <span className="text-blue-400">
                {typeof window !== 'undefined' ? window.location.href : 'server-side'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-yellow-600/50 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold text-yellow-400">Required Clerk Dashboard Configuration</h2>

          <p className="text-gray-300">
            To fix the "Missing client_id" error, configure these settings in your Clerk Dashboard:
          </p>

          <div className="space-y-4">
            <div className="bg-[#0a0a0a] border border-[#222222] rounded p-4">
              <h3 className="font-semibold mb-2">1. Go to Clerk Dashboard → Configure → Domains</h3>
              <p className="text-sm text-gray-400 mb-2">Add your production domain:</p>
              <div className="bg-black rounded p-3 font-mono text-sm">
                <div>Domain: <span className="text-green-400">verifily.io</span></div>
                <div>Type: <span className="text-blue-400">Production</span></div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222222] rounded p-4">
              <h3 className="font-semibold mb-2">2. Allowed Origins (CORS)</h3>
              <p className="text-sm text-gray-400 mb-2">Add these to allowed origins:</p>
              <div className="bg-black rounded p-3 font-mono text-sm space-y-1">
                <div className="text-green-400">https://verifily.io</div>
                <div className="text-green-400">https://*.vercel.app</div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222222] rounded p-4">
              <h3 className="font-semibold mb-2">3. Path Configuration (Already Done ✓)</h3>
              <div className="bg-black rounded p-3 font-mono text-sm space-y-1">
                <div>Home URL: <span className="text-green-400">https://verifily.io</span></div>
                <div>Sign-in: <span className="text-green-400">/sign-in</span></div>
                <div>Sign-up: <span className="text-green-400">/sign-up</span></div>
                <div>After sign-out: <span className="text-green-400">/</span></div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#222222] rounded p-4">
              <h3 className="font-semibold mb-2">4. Verify Instance Type</h3>
              <p className="text-sm text-gray-400">Make sure you're using a PRODUCTION instance, not a development instance.</p>
              <p className="text-sm text-gray-400 mt-2">
                Check: Clerk Dashboard → Settings → General → Instance Type should be "Production"
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#111111] border border-blue-600/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Steps to Fix</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Go to <a href="https://dashboard.clerk.com" target="_blank" className="text-blue-400 underline">Clerk Dashboard</a></li>
            <li>Select your application</li>
            <li>Go to <strong>Configure → Domains</strong></li>
            <li>Click "Add domain" and enter: <code className="bg-black px-2 py-1 rounded">verifily.io</code></li>
            <li>Go to <strong>Configure → API Keys</strong> and verify you're using production keys (pk_live_...)</li>
            <li>Go to <strong>Configure → Allowed Origins</strong> and add:
              <ul className="list-disc list-inside ml-6 mt-2">
                <li><code className="bg-black px-2 py-1 rounded">https://verifily.io</code></li>
                <li><code className="bg-black px-2 py-1 rounded">https://*.vercel.app</code></li>
              </ul>
            </li>
            <li>Wait 1-2 minutes for changes to propagate</li>
            <li>Clear your browser cache and try again</li>
          </ol>
        </div>

        <div className="text-center">
          <a
            href="/dashboard"
            className="inline-block bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
