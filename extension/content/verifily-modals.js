(function() {
  'use strict';

  const CONFIG = {
    DEFAULT_API_URL: 'https://verifily-production.up.railway.app/api/v1',
    EMAIL_CAPTURE_KEY: 'verifily_email_captured',
    CURRENT_USER_KEY: 'verifily_current_user'
  };

  let API_URL = CONFIG.DEFAULT_API_URL;
  let emailCaptured = false;
  let currentUsername = null;

  // Load settings from storage
  chrome.storage.local.get(['apiUrl', CONFIG.EMAIL_CAPTURE_KEY, CONFIG.CURRENT_USER_KEY], (result) => {
    if (result.apiUrl) {
      API_URL = result.apiUrl;
    }
    emailCaptured = result[CONFIG.EMAIL_CAPTURE_KEY] || false;
    currentUsername = result[CONFIG.CURRENT_USER_KEY] || null;
  });

  /**
   * Detect current logged-in Twitter username
   */
  function detectCurrentUser() {
    if (currentUsername) return currentUsername;

    try {
      // Try to find username from profile link in nav
      const profileLinks = document.querySelectorAll('a[href^="/"][href$=""]');
      for (const link of profileLinks) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/') && href.split('/').length === 2) {
          const username = href.substring(1);
          if (username && username.length > 0 && !username.includes('/')) {
            currentUsername = username;
            chrome.storage.local.set({ [CONFIG.CURRENT_USER_KEY]: username });
            console.log('[Verifily] Detected current user:', username);
            return username;
          }
        }
      }

      // Alternative: check for data-testid="SideNav_AccountSwitcher_Button"
      const accountSwitcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
      if (accountSwitcher) {
        const usernameText = accountSwitcher.textContent;
        const match = usernameText.match(/@(\w+)/);
        if (match) {
          currentUsername = match[1];
          chrome.storage.local.set({ [CONFIG.CURRENT_USER_KEY]: currentUsername });
          console.log('[Verifily] Detected current user:', currentUsername);
          return currentUsername;
        }
      }
    } catch (e) {
      console.error('[Verifily] Error detecting current user:', e);
    }

    return null;
  }

  /**
   * Check if tweet is by current user
   */
  function isTweetByCurrentUser(tweetEl) {
    try {
      const userEl = tweetEl.querySelector('[data-testid="User-Name"]');
      const usernameLink = userEl?.querySelector('a[href^="/"]');
      const username = usernameLink?.href?.split('/').pop() || '';

      const currentUser = detectCurrentUser();
      return currentUser && username === currentUser;
    } catch (e) {
      return false;
    }
  }

  /**
   * Show email capture modal
   */
  function showEmailCaptureModal(onSubmit) {
    if (emailCaptured) return; // Already captured

    const overlay = document.createElement('div');
    overlay.className = 'verifily-modal-overlay';
    overlay.innerHTML = `
      <div class="verifily-modal">
        <div class="verifily-modal-header">
          <h2>Join the Verifily Waitlist</h2>
          <button class="verifily-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="verifily-modal-body">
          <p>Get early access to Verifily - the human content verification network.</p>
          <input type="email" class="verifily-email-input" placeholder="your@email.com" required />
          <button class="verifily-submit-btn">Join Waitlist</button>
          <p class="verifily-modal-footer">We'll notify you when verification features go live.</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.verifily-modal-close');
    const submitBtn = overlay.querySelector('.verifily-submit-btn');
    const emailInput = overlay.querySelector('.verifily-email-input');

    const closeModal = () => {
      overlay.remove();
    };

    closeBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    submitBtn.onclick = async () => {
      const email = emailInput.value.trim();
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email address');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Joining...';

      try {
        const response = await fetch(`${API_URL}/waitlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'extension' })
        });

        if (response.ok) {
          const data = await response.json();
          emailCaptured = true;
          chrome.storage.local.set({ [CONFIG.EMAIL_CAPTURE_KEY]: true });

          submitBtn.textContent = '✓ Success!';
          setTimeout(() => {
            closeModal();
            if (onSubmit) onSubmit();
          }, 1000);
        } else {
          throw new Error('Failed to join waitlist');
        }
      } catch (error) {
        console.error('[Verifily] Waitlist error:', error);
        alert('Could not join waitlist. Please try again later.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Join Waitlist';
      }
    };
  }

  /**
   * Show human verification confirmation modal
   */
  function showVerificationModal(tweetData, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'verifily-modal-overlay';
    overlay.innerHTML = `
      <div class="verifily-modal">
        <div class="verifily-modal-header">
          <h2>Verify as Human</h2>
          <button class="verifily-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="verifily-modal-body">
          <p>You're about to verify this content as human-written:</p>
          <div class="verifily-content-preview">
            "${tweetData.text.substring(0, 150)}${tweetData.text.length > 150 ? '...' : ''}"
          </div>
          <p class="verifily-modal-note">This will create a permanent verification record that can be shared with others.</p>
          <div class="verifily-modal-actions">
            <button class="verifily-cancel-btn">Cancel</button>
            <button class="verifily-confirm-btn">Verify as Human</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.verifily-modal-close');
    const cancelBtn = overlay.querySelector('.verifily-cancel-btn');
    const confirmBtn = overlay.querySelector('.verifily-confirm-btn');

    const closeModal = () => {
      overlay.remove();
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    confirmBtn.onclick = async () => {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Verifying...';

      try {
        await onConfirm();
        closeModal();
      } catch (error) {
        console.error('[Verifily] Verification error:', error);
        alert('Verification failed. Please try again.');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Verify as Human';
      }
    };
  }

  /**
   * Show share verification modal
   */
  function showShareModal(verification) {
    const shareUrl = verification.shareable_url || `https://verifily.io/verify/${verification.content_hash}`;

    const overlay = document.createElement('div');
    overlay.className = 'verifily-modal-overlay';
    overlay.innerHTML = `
      <div class="verifily-modal">
        <div class="verifily-modal-header">
          <h2>Share Verification</h2>
          <button class="verifily-modal-close" aria-label="Close">&times;</button>
        </div>
        <div class="verifily-modal-body">
          <p>Share your human verification with others:</p>
          <div class="verifily-share-url">
            <input type="text" readonly value="${shareUrl}" class="verifily-url-input" />
            <button class="verifily-copy-btn">Copy</button>
          </div>
          <div class="verifily-share-stats">
            <span>✓ Verified as Human</span>
            <span>👁 Viewed by ${verification.view_count} people</span>
          </div>
          <p class="verifily-modal-footer">Anyone with this link can see your verification.</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.verifily-modal-close');
    const copyBtn = overlay.querySelector('.verifily-copy-btn');
    const urlInput = overlay.querySelector('.verifily-url-input');

    const closeModal = () => {
      overlay.remove();
    };

    closeBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    copyBtn.onclick = () => {
      urlInput.select();
      document.execCommand('copy');
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    };
  }

  /**
   * Add "Verify as Human" button to user's own tweets
   */
  function addVerifyButton(tweetEl, tweetData) {
    // Check if already has button
    if (tweetEl.querySelector('.verifily-verify-btn')) return;

    // Check if this is user's own tweet
    if (!isTweetByCurrentUser(tweetEl)) return;

    const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
    if (!textEl) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'verifily-button-container';

    const verifyBtn = document.createElement('button');
    verifyBtn.className = 'verifily-verify-btn';
    verifyBtn.textContent = '✓ Verify as Human';

    verifyBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();

      // Show email capture modal first (if not already captured)
      if (!emailCaptured) {
        showEmailCaptureModal(() => {
          // After email capture, show verification modal
          showVerificationModal(tweetData, () => verifyAsHuman(tweetEl, tweetData, verifyBtn));
        });
      } else {
        // Directly show verification modal
        showVerificationModal(tweetData, () => verifyAsHuman(tweetEl, tweetData, verifyBtn));
      }
    };

    buttonContainer.appendChild(verifyBtn);
    textEl.parentElement.appendChild(buttonContainer);
  }

  /**
   * Perform human verification
   */
  async function verifyAsHuman(tweetEl, tweetData, button) {
    try {
      button.disabled = true;
      button.textContent = 'Verifying...';

      const currentUser = detectCurrentUser();
      if (!currentUser) {
        throw new Error('Could not detect current user');
      }

      const response = await fetch(`${API_URL}/verify/human`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: tweetData.text,
          platform: 'twitter',
          post_id: tweetData.tweet_id,
          post_url: tweetData.post_url,
          username: currentUser
        })
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const verification = await response.json();
      console.log('[Verifily] Verified as human:', verification);

      // Update button to show success + share
      button.textContent = '✓ Verified';
      button.className = 'verifily-verify-btn verifily-verified';

      // Add share button
      const shareBtn = document.createElement('button');
      shareBtn.className = 'verifily-share-btn';
      shareBtn.textContent = '🔗 Share';
      shareBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        showShareModal(verification);
      };

      button.parentElement.appendChild(shareBtn);

      // Update tweet badge if exists
      updateTweetBadge(tweetEl, verification);

    } catch (error) {
      console.error('[Verifily] Verification failed:', error);
      button.disabled = false;
      button.textContent = '✓ Verify as Human';
      throw error;
    }
  }

  /**
   * Update existing tweet badge to show author-verified status
   */
  function updateTweetBadge(tweetEl, verification) {
    const existingBadge = tweetEl.querySelector('.poc-verified-badge');
    if (existingBadge) {
      existingBadge.className = 'poc-verified-badge human author-verified';
      const labelSpan = existingBadge.querySelector('.poc-badge-label');
      if (labelSpan) {
        labelSpan.textContent = `✓ Verified by @${verification.message.split('@')[1] || 'author'}`;
      }
    }
  }

  /**
   * Scan page for user's own tweets and add verify buttons
   */
  function scanForOwnTweets() {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');

    tweets.forEach(tweetEl => {
      try {
        // Skip if already processed
        if (tweetEl.dataset.verifilyProcessed) return;
        tweetEl.dataset.verifilyProcessed = 'true';

        // Extract tweet data
        const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
        const text = textEl?.textContent || '';
        if (text.length < 10) return;

        const userEl = tweetEl.querySelector('[data-testid="User-Name"]');
        const usernameLink = userEl?.querySelector('a[href^="/"]');
        const username = usernameLink?.href?.split('/').pop() || '';

        const tweetLink = tweetEl.querySelector('a[href*="/status/"]');
        const tweetId = tweetLink?.href?.match(/status\/(\d+)/)?.[1] || '';

        const tweetData = {
          text,
          username,
          tweet_id: tweetId,
          element: tweetEl,
          post_url: tweetLink?.href || window.location.href
        };

        // Add verify button if this is user's own tweet
        addVerifyButton(tweetEl, tweetData);

      } catch (e) {
        console.error('[Verifily] Error processing tweet:', e);
      }
    });
  }

  // Only run on Twitter
  if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
    console.log('[Verifily] Human verification module loaded');

    // Initial scan
    setTimeout(scanForOwnTweets, 3000);

    // Periodic scan
    setInterval(scanForOwnTweets, 3000);

    // Scroll detection
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(scanForOwnTweets, 500);
    });
  }

  // Expose globally for other scripts
  window.verifily = {
    showEmailCaptureModal,
    showVerificationModal,
    showShareModal,
    detectCurrentUser,
    isTweetByCurrentUser
  };

})();
