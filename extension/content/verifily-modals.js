(function() {
  'use strict';

  console.log('[Verifily] ========== SCRIPT STARTED ==========');
  console.log('[Verifily] File loaded successfully');
  console.log('[Verifily] Location:', window.location.href);

  try {

  const CONFIG = {
    DEFAULT_API_URL: 'https://verifily.io/api',
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
      // Method 1: Check account switcher button
      const accountSwitcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
      if (accountSwitcher) {
        const usernameText = accountSwitcher.textContent;
        const match = usernameText.match(/@([\w]+)/);
        if (match) {
          currentUsername = match[1];
          chrome.storage.local.set({ [CONFIG.CURRENT_USER_KEY]: currentUsername });
          console.log('[Verifily] ✓ Detected user from account switcher:', currentUsername);
          return currentUsername;
        }
      }

      // Method 2: Check profile link in sidebar
      const profileLink = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
      if (profileLink) {
        const href = profileLink.getAttribute('href');
        if (href && href.startsWith('/')) {
          const username = href.substring(1).split('/')[0];
          if (username && username.length > 0) {
            currentUsername = username;
            chrome.storage.local.set({ [CONFIG.CURRENT_USER_KEY]: currentUsername });
            console.log('[Verifily] ✓ Detected user from profile link:', currentUsername);
            return currentUsername;
          }
        }
      }

      // Method 3: Try to find from any tweet by checking if "Delete" button exists
      const tweets = document.querySelectorAll('[data-testid="tweet"]');
      for (const tweet of tweets) {
        const deleteBtn = tweet.querySelector('[data-testid="caret"]');
        if (deleteBtn) {
          // This tweet has edit/delete options, so it's our own
          const userEl = tweet.querySelector('[data-testid="User-Name"]');
          const usernameLink = userEl?.querySelector('a[href^="/"]');
          if (usernameLink) {
            const href = usernameLink.getAttribute('href');
            const username = href.split('/')[1]?.split('?')[0];
            if (username) {
              currentUsername = username;
              chrome.storage.local.set({ [CONFIG.CURRENT_USER_KEY]: currentUsername });
              console.log('[Verifily] ✓ Detected user from own tweet:', currentUsername);
              return currentUsername;
            }
          }
        }
      }

      // Silently fail if user not detected (common on non-profile pages)
      return null;
    } catch (e) {
      // Only log error if it's an actual error, not just "user not found"
      if (e.message && !e.message.includes('querySelector')) {
        console.error('[Verifily] Error detecting current user:', e);
      }
      return null;
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
      if (!usernameLink) return false;

      const href = usernameLink.getAttribute('href');
      const username = href?.split('/')[1]?.split('?')[0] || '';

      const currentUser = detectCurrentUser();

      const isOwn = currentUser && username.toLowerCase() === currentUser.toLowerCase();

      if (isOwn) {
        console.log('[Verifily] ✓ Found own tweet by @' + username);
      }

      return isOwn;
    } catch (e) {
      console.error('[Verifily] Error checking tweet ownership:', e);
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

          submitBtn.textContent = 'Success!';
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

          <div class="verifily-consent-container" style="margin: 16px 0; padding: 12px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 8px;">
            <label style="display: flex; align-items: flex-start; cursor: pointer; gap: 10px;">
              <input type="checkbox" id="verifily-consent-checkbox" style="margin-top: 4px; cursor: pointer; width: 16px; height: 16px;" />
              <span style="flex: 1; font-size: 13px; line-height: 1.5; color: #10b981;">
                I consent to Verifily storing this content for training AI detection models and building the human-verified dataset. This helps improve AI detection accuracy for everyone.
              </span>
            </label>
          </div>

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
    const consentCheckbox = overlay.querySelector('#verifily-consent-checkbox');

    const closeModal = () => {
      overlay.remove();
    };

    closeBtn.onclick = closeModal;
    cancelBtn.onclick = closeModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) closeModal();
    };

    confirmBtn.onclick = async () => {
      // Validate consent checkbox
      if (!consentCheckbox.checked) {
        alert('Please accept the consent agreement to continue with verification.');
        return;
      }

      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Verifying...';

      try {
        await onConfirm(consentCheckbox.checked);
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
    const tweetText = encodeURIComponent(`I verified my content as human-written on Verifily!\n\n${shareUrl}`);
    const twitterShareUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

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
            <span>Verified as Human</span>
            <span>Viewed by ${verification.view_count} people</span>
          </div>
          <button class="verifily-tweet-btn">Tweet Your Verification</button>
          <p class="verifily-modal-footer">Anyone with this link can see your verification.</p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('.verifily-modal-close');
    const copyBtn = overlay.querySelector('.verifily-copy-btn');
    const tweetBtn = overlay.querySelector('.verifily-tweet-btn');
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
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 2000);
    };

    tweetBtn.onclick = () => {
      window.open(twitterShareUrl, '_blank', 'width=550,height=420');
    };
  }

  /**
   * Add "Verify as Human" button to user's own tweets
   */
  function addVerifyButton(tweetEl, tweetData) {
    // Check if already has button
    if (tweetEl.querySelector('.verifily-verify-btn')) {
      return;
    }

    // Check if this is user's own tweet
    if (!isTweetByCurrentUser(tweetEl)) {
      return;
    }

    const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
    if (!textEl) {
      console.warn('[Verifily] No tweet text found for own tweet');
      return;
    }

    console.log('[Verifily] Adding verify button to tweet:', tweetData.text.substring(0, 50));

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'verifily-button-container';
    buttonContainer.style.marginTop = '12px';
    buttonContainer.style.marginBottom = '8px';

    const verifyBtn = document.createElement('button');
    verifyBtn.className = 'verifily-verify-btn';
    verifyBtn.textContent = 'Verify as Human';

    verifyBtn.onclick = async (e) => {
      e.stopPropagation();
      e.preventDefault();

      console.log('[Verifily] Verify button clicked');

      // Show email capture modal first (if not already captured)
      if (!emailCaptured) {
        console.log('[Verifily] Showing email capture first');
        showEmailCaptureModal(() => {
          // After email capture, show verification modal
          showVerificationModal(tweetData, (consent) => verifyAsHuman(tweetEl, tweetData, verifyBtn, consent));
        });
      } else {
        // Directly show verification modal
        console.log('[Verifily] Showing verification modal');
        showVerificationModal(tweetData, (consent) => verifyAsHuman(tweetEl, tweetData, verifyBtn, consent));
      }
    };

    buttonContainer.appendChild(verifyBtn);

    // Insert after tweet text
    textEl.parentElement.insertBefore(buttonContainer, textEl.nextSibling);

    console.log('[Verifily] ✓ Verify button added successfully');
  }

  /**
   * Perform human verification
   */
  async function verifyAsHuman(tweetEl, tweetData, button, consentGiven = false) {
    try {
      button.disabled = true;
      button.textContent = 'Verifying...';

      const currentUser = detectCurrentUser();
      if (!currentUser) {
        throw new Error('Could not detect current user');
      }

      const response = await fetch(`${API_URL}/verify/human/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: tweetData.text,
          platform: 'twitter',
          post_id: tweetData.tweet_id,
          post_url: tweetData.post_url,
          username: currentUser,
          consent_training_data: consentGiven
        })
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('[Verifily] Verified as human:', result);

      // Extract verification data from response
      const verification = result.verification || result;
      verification.shareable_url = result.shareable_url || verification.public_url;
      verification.content_hash = result.content_hash || verification.content_hash;

      // Update button to show success + share
      button.textContent = 'Verified';
      button.className = 'verifily-verify-btn verifily-verified';

      // Add share button
      const shareBtn = document.createElement('button');
      shareBtn.className = 'verifily-share-btn';
      shareBtn.textContent = 'Share';
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
      button.textContent = 'Verify as Human';
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
        labelSpan.textContent = `Verified by @${verification.message.split('@')[1] || 'author'}`;
      }
    }
  }

  /**
   * Scan page for user's own tweets and add verify buttons
   */
  function scanForOwnTweets() {
    const currentUser = detectCurrentUser();
    if (!currentUser) {
      console.warn('[Verifily] Cannot scan for own tweets - user not detected yet');
      return;
    }

    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    console.log(`[Verifily] Scanning ${tweets.length} tweets for @${currentUser}`);

    let ownTweetsFound = 0;
    let tweetUsernames = [];

    tweets.forEach((tweetEl, index) => {
      try {
        console.log(`[Verifily] ===== Processing tweet ${index + 1} =====`);

        // Skip if already processed
        if (tweetEl.dataset.verifilyProcessed) {
          console.log(`[Verifily] Tweet ${index + 1}: Already processed, skipping`);
          return;
        }
        tweetEl.dataset.verifilyProcessed = 'true';

        // Extract tweet data
        const textEl = tweetEl.querySelector('[data-testid="tweetText"]');
        const text = textEl?.textContent || '';
        console.log(`[Verifily] Tweet ${index + 1}: Text length = ${text.length}, text = "${text.substring(0, 50)}..."`);

        if (text.length < 3) {
          console.log(`[Verifily] Tweet ${index + 1}: Too short (${text.length} chars), SKIPPING`);
          return;
        }

        const userEl = tweetEl.querySelector('[data-testid="User-Name"]');
        console.log(`[Verifily] Tweet ${index + 1}: User element found =`, !!userEl);

        const usernameLink = userEl?.querySelector('a[href^="/"]');
        console.log(`[Verifily] Tweet ${index + 1}: Username link found =`, !!usernameLink);
        console.log(`[Verifily] Tweet ${index + 1}: Username link href =`, usernameLink?.getAttribute('href'));

        if (!usernameLink) {
          console.log(`[Verifily] Tweet ${index + 1}: No username link found, SKIPPING`);
          return;
        }

        const href = usernameLink.getAttribute('href');
        const username = href?.split('/')[1]?.split('?')[0] || '';
        console.log(`[Verifily] Tweet ${index + 1}: Extracted username = "${username}"`);

        tweetUsernames.push(username);

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
        const isOwnTweet = username.toLowerCase() === currentUser.toLowerCase();
        console.log(`[Verifily] Tweet ${index + 1}: @${username} === @${currentUser}? ${isOwnTweet}`);

        if (isOwnTweet) {
          ownTweetsFound++;
          addVerifyButton(tweetEl, tweetData);
        }

      } catch (e) {
        console.error('[Verifily] Error processing tweet:', e);
      }
    });

    console.log(`[Verifily] All usernames found:`, [...new Set(tweetUsernames)]);
    console.log(`[Verifily] Looking for: @${currentUser}`);

    if (ownTweetsFound > 0) {
      console.log(`[Verifily] ✓ Found ${ownTweetsFound} of your own tweets`);
    } else {
      console.warn(`[Verifily] ⚠ No own tweets found. Check if @${currentUser} matches any of:`, [...new Set(tweetUsernames)]);
    }
  }

  // Only run on Twitter
  if (window.location.hostname.includes('twitter.com') || window.location.hostname.includes('x.com')) {
    console.log('[Verifily] Human verification module loaded ✓');
    console.log('[Verifily] Current URL:', window.location.href);

    // Try to detect user immediately
    try {
      const initialUser = detectCurrentUser();
      if (initialUser) {
        console.log('[Verifily] ✓ User detected:', initialUser);
      }
    } catch (e) {
      // Silently ignore - user detection will retry
    }

    // Initial scan (delayed to let page load)
    setTimeout(() => {
      console.log('[Verifily] ========== Starting initial scan ==========');
      const user = detectCurrentUser();
      console.log('[Verifily] Current user before scan:', user);
      scanForOwnTweets();
    }, 3000);

    // Periodic scan every 5 seconds
    setInterval(() => {
      const user = detectCurrentUser();
      if (user) {
        scanForOwnTweets();
      } else {
        console.warn('[Verifily] Periodic scan skipped - no user detected');
      }
    }, 5000);

    // Scroll detection - scan when user scrolls
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scanForOwnTweets();
      }, 1000);
    });

    // Manual trigger via console command
    window.verifilyForceVerifyButton = () => {
      console.log('[Verifily] Manual scan triggered');
      const user = detectCurrentUser();
      console.log('[Verifily] User:', user);
      scanForOwnTweets();
    };

    console.log('[Verifily] Tweet scanner initialized - looking for your tweets...');
    console.log('[Verifily] Type window.verifilyForceVerifyButton() to manually trigger scan');
  }

  // Expose globally for other scripts and debugging
  window.verifily = {
    showEmailCaptureModal,
    showVerificationModal,
    showShareModal,
    detectCurrentUser,
    isTweetByCurrentUser,
    scanForOwnTweets,  // For manual debugging
    // Debug helper
    debug: () => {
      const user = detectCurrentUser();
      console.log('[Verifily Debug] Current user:', user);
      console.log('[Verifily Debug] Email captured:', emailCaptured);
      console.log('[Verifily Debug] API URL:', API_URL);
      const tweets = document.querySelectorAll('[data-testid="tweet"]');
      console.log('[Verifily Debug] Total tweets on page:', tweets.length);
      scanForOwnTweets();
      return { user, emailCaptured, API_URL, tweetsFound: tweets.length };
    }
  };

  console.log('[Verifily] ========== SCRIPT COMPLETED SUCCESSFULLY ==========');

  } catch (error) {
    console.error('[Verifily] ========== CRITICAL ERROR ==========');
    console.error('[Verifily] Script failed to initialize:', error);
    console.error('[Verifily] Error stack:', error.stack);
  }

})();
