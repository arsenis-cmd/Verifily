(function() {
  'use strict';

  const CONFIG = {
    DEFAULT_API_URL: 'https://verifily-production.up.railway.app/api/v1',
    SCAN_INTERVAL: 2000
  };

  let API_URL = CONFIG.DEFAULT_API_URL;

  // Load API URL from storage
  chrome.storage.local.get(['apiUrl'], (result) => {
    if (result.apiUrl) {
      API_URL = result.apiUrl;
    }
  });

  function isTwitter() {
    return window.location.hostname.includes('twitter.com') ||
           window.location.hostname.includes('x.com');
  }

  if (!isTwitter()) return;

  const scannedTweets = new Set();
  const verificationCache = new Map(); // Local cache

  // SHA-256 hash function
  async function hashText(text) {
    const normalized = text.toLowerCase().trim().replace(/\s+/g, ' ');
    const msgBuffer = new TextEncoder().encode(normalized);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  }

  function extractTweetData(tweetEl) {
    try {
      const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
      const text = textEl?.textContent || '';
      if (text.length < 10) return null;

      const userEl = tweetEl.querySelector('[data-testid="User-Name"]');
      const usernameLink = userEl?.querySelector('a[href^="/"]');
      const username = usernameLink?.href?.split('/').pop() || '';

      const tweetLink = tweetEl.querySelector('a[href*="/status/"]');
      const tweetId = tweetLink?.href?.match(/status\/(\d+)/)?.[1] || '';

      const uniqueId = `${username}:${tweetId || text.substring(0, 50)}`;
      if (scannedTweets.has(uniqueId)) return null;
      scannedTweets.add(uniqueId);

      return {
        text,
        username,
        tweet_id: tweetId,
        element: tweetEl,
        post_url: tweetLink?.href || window.location.href
      };
    } catch (e) { return null; }
  }

  function findTweets() {
    const tweets = [];
    document.querySelectorAll('[data-testid="tweet"]').forEach(el => {
      const data = extractTweetData(el);
      if (data) tweets.push(data);
    });
    return tweets;
  }

  // Check if content is already verified (network effect!)
  async function checkVerification(contentHash) {
    // Check local cache first
    if (verificationCache.has(contentHash)) {
      return verificationCache.get(contentHash);
    }

    try {
      const res = await fetch(`${API_URL}/check/${contentHash}`, {
        method: 'GET'
      });

      if (res.ok) {
        const data = await res.json();
        verificationCache.set(contentHash, data);
        return data;
      }
      return null; // Not verified yet
    } catch (e) {
      return null;
    }
  }

  // Verify content (first time or cache miss)
  async function verifyContent(tweet) {
    try {
      const res = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: tweet.text,
          platform: 'twitter',
          post_id: tweet.tweet_id,
          post_url: tweet.post_url
        })
      });

      if (res.ok) {
        const data = await res.json();
        verificationCache.set(data.content_hash, data);
        return data;
      }
      return null;
    } catch (e) {
      console.error('PoC verification error:', e);
      return null;
    }
  }

  async function detectTweet(tweet) {
    try {
      // Step 1: Hash the content
      const contentHash = await hashText(tweet.text);

      // Step 2: Check if already verified (fast path!)
      let verification = await checkVerification(contentHash);

      if (verification) {
        // Cached! Show immediately
        applyVerifiedBadge(tweet, verification, true);
        return;
      }

      // Step 3: Not cached, verify now
      verification = await verifyContent(tweet);

      if (verification) {
        applyVerifiedBadge(tweet, verification, false);
      }
    } catch (e) {
      console.error('PoC tweet detection error:', e);
    }
  }

  async function detectTweets(tweets) {
    if (tweets.length === 0) return;

    // Process all tweets in parallel
    await Promise.all(tweets.map(tweet => detectTweet(tweet)));

    // Update floating badge with stats
    window.pocHighlighter?.updateBadge({
      scanning: false,
      stats: {
        total: tweets.length,
        ai: 0, // Will be updated by individual results
        human: 0,
        mixed: 0
      }
    });
  }

  function applyVerifiedBadge(tweet, verification, fromCache) {
    const el = tweet.element;

    // Determine badge type
    const isHuman = verification.classification === 'human';
    const isAI = verification.classification === 'ai';
    const confidence = verification.confidence;

    const textEl = el.querySelector('[data-testid="tweetText"]');
    if (textEl && !textEl.querySelector('.poc-verified-badge')) {
      const badge = document.createElement('div');
      badge.className = `poc-verified-badge ${isHuman ? 'human' : 'ai'}`;

      // Badge content
      const iconSpan = document.createElement('span');
      iconSpan.className = 'poc-badge-icon';
      iconSpan.textContent = isHuman ? '✓' : '⚠';

      const labelSpan = document.createElement('span');
      labelSpan.className = 'poc-badge-label';
      labelSpan.textContent = isHuman
        ? 'PoC Certified Human'
        : `AI Detected (${Math.round(verification.ai_probability * 100)}%)`;

      const verifiedBySpan = document.createElement('span');
      verifiedBySpan.className = 'poc-badge-verified-count';
      verifiedBySpan.textContent = `Verified by ${verification.view_count} user${verification.view_count !== 1 ? 's' : ''}`;

      badge.appendChild(iconSpan);
      badge.appendChild(labelSpan);
      badge.appendChild(verifiedBySpan);

      textEl.parentElement.appendChild(badge);

      // Add border indicator
      el.style.borderLeft = isHuman ? '3px solid #10b981' : '3px solid #ef4444';
    }
  }

  function scanTwitter() {
    const tweets = findTweets();
    if (tweets.length > 0) detectTweets(tweets);
  }

  setTimeout(scanTwitter, 2000);
  setInterval(scanTwitter, CONFIG.SCAN_INTERVAL);

  let scrollTimeout;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(scanTwitter, 500);
  });
})();
