// Expose Bot - Share Card Generator
(function() {
  'use strict';

  class BotExposer {
    constructor() {
      this.exposedAccounts = new Set();
    }

    init() {
      if (!this.isTwitter()) return;
      console.log('[BotExposer] Initializing...');
      this.watchForBotBadges();
    }

    isTwitter() {
      return window.location.hostname.includes('twitter.com') ||
             window.location.hostname.includes('x.com');
    }

    watchForBotBadges() {
      // Watch for account analysis badges
      const observer = new MutationObserver(() => {
        const badges = document.querySelectorAll('.poc-account-badge:not(.poc-expose-added)');
        badges.forEach(badge => this.addExposeButton(badge));
      });

      observer.observe(document.body, { childList: true, subtree: true });

      // Check existing badges
      setTimeout(() => {
        const badges = document.querySelectorAll('.poc-account-badge:not(.poc-expose-added)');
        badges.forEach(badge => this.addExposeButton(badge));
      }, 2000);
    }

    addExposeButton(badge) {
      badge.classList.add('poc-expose-added');

      // Only add button for bots and AI-assisted accounts
      if (!badge.classList.contains('poc-bot') &&
          !badge.classList.contains('poc-ai-assisted')) {
        return;
      }

      const button = document.createElement('button');
      button.className = 'poc-expose-btn';
      button.innerHTML = 'Expose Bot';
      button.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showExposeCard(badge);
      };

      badge.appendChild(button);
    }

    async showExposeCard(badge) {
      const username = this.extractUsername();
      const stats = this.extractStats(badge);

      console.log('[BotExposer] Extracted stats for @' + username + ':', stats);

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'poc-expose-overlay';
      overlay.innerHTML = `
        <div class="poc-expose-modal">
          <button class="poc-expose-close">×</button>
          <div class="poc-expose-preview">
            <div id="poc-share-card" class="poc-share-card">
              <div class="poc-card-header">
                <div class="poc-card-alert">BOT DETECTED</div>
                <div class="poc-card-logo">PoC</div>
              </div>

              <div class="poc-card-body">
                <div class="poc-card-username">@${username}</div>

                <div class="poc-card-meter">
                  <div class="poc-meter-bar">
                    <div class="poc-meter-fill" style="width: ${stats.botPercent}%"></div>
                  </div>
                  <div class="poc-meter-label">${stats.botPercent}% Bot Probability</div>
                </div>

                <div class="poc-card-warnings">
                  ${this.generateWarnings(stats)}
                </div>
              </div>

              <div class="poc-card-footer">
                <div class="poc-card-divider"></div>
                <div class="poc-card-cta">Scan any Twitter account → poc.app</div>
              </div>
            </div>
          </div>

          <div class="poc-expose-actions">
            <button class="poc-btn poc-btn-primary" id="poc-share-twitter">
              Share on Twitter
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Event listeners
      overlay.querySelector('.poc-expose-close').onclick = () => overlay.remove();
      overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
      };

      document.getElementById('poc-share-twitter').onclick = () => {
        this.shareToTwitter(username, stats.botPercent);
      };

      this.addExposeStyles();
    }

    extractUsername() {
      const pathParts = window.location.pathname.split('/').filter(p => p);
      return pathParts[0] || 'unknown';
    }

    extractStats(badge) {
      const percentText = badge.querySelector('.poc-stat-value')?.textContent || '0%';
      const botPercent = parseInt(percentText);
      const analyzed = badge.querySelectorAll('.poc-stat-value')[1]?.textContent || '0';

      // Extract real Twitter stats
      const accountAge = this.getAccountAge();
      const tweetCount = this.getTweetCount();
      const tweetsPerDay = accountAge > 0 ? Math.round(tweetCount / accountAge) : 0;

      return {
        botPercent,
        analyzed: parseInt(analyzed),
        createdDays: accountAge,
        tweetsPerDay: tweetsPerDay,
        totalTweets: tweetCount
      };
    }

    getAccountAge() {
      try {
        // Find "Joined" date in profile
        const joinedElement = Array.from(document.querySelectorAll('span'))
          .find(el => el.textContent.includes('Joined'));

        if (joinedElement && joinedElement.nextSibling) {
          const joinedText = joinedElement.nextSibling.textContent;
          const joinedDate = new Date(joinedText);
          const now = new Date();
          const ageDays = Math.floor((now - joinedDate) / (1000 * 60 * 60 * 24));
          return ageDays > 0 ? ageDays : 1;
        }

        // Fallback: Try to find from profile header
        const timeElements = document.querySelectorAll('time');
        if (timeElements.length > 0) {
          const joinedTime = Array.from(timeElements).find(t =>
            t.getAttribute('datetime') && !t.closest('[data-testid="tweet"]')
          );

          if (joinedTime) {
            const joinedDate = new Date(joinedTime.getAttribute('datetime'));
            const now = new Date();
            const ageDays = Math.floor((now - joinedDate) / (1000 * 60 * 60 * 24));
            return ageDays > 0 ? ageDays : 1;
          }
        }
      } catch (e) {
        console.error('[BotExposer] Error getting account age:', e);
      }

      return null; // Return null if we can't determine
    }

    getTweetCount() {
      try {
        // Find tweet count in profile stats
        const statsElements = document.querySelectorAll('[href$="/status"]');

        for (const el of statsElements) {
          const parent = el.closest('a');
          if (parent) {
            const countText = parent.textContent.replace(/[^\d.KM]/g, '');
            return this.parseCount(countText);
          }
        }

        // Fallback: look for any number near "posts" or "tweets"
        const allText = document.body.textContent;
        const match = allText.match(/(\d+[\d,]*)\s*(post|tweet)s?/i);
        if (match) {
          return parseInt(match[1].replace(/,/g, ''));
        }
      } catch (e) {
        console.error('[BotExposer] Error getting tweet count:', e);
      }

      return 0;
    }

    parseCount(str) {
      // Convert "1.2K" to 1200, "3.5M" to 3500000, etc.
      if (str.includes('K')) {
        return Math.round(parseFloat(str) * 1000);
      }
      if (str.includes('M')) {
        return Math.round(parseFloat(str) * 1000000);
      }
      return parseInt(str) || 0;
    }

    generateWarnings(stats) {
      const warnings = [];

      if (stats.tweetsPerDay > 100) {
        warnings.push(`Posts ${stats.tweetsPerDay.toLocaleString()} times/day`);
      }

      if (stats.botPercent > 80) {
        warnings.push(`${stats.botPercent}% AI-generated content`);
      }

      if (stats.createdDays !== null && stats.createdDays < 90) {
        if (stats.createdDays < 1) {
          warnings.push(`Account created today`);
        } else if (stats.createdDays === 1) {
          warnings.push(`Account created yesterday`);
        } else {
          warnings.push(`Account created ${stats.createdDays} days ago`);
        }
      }

      if (stats.totalTweets > 10000) {
        warnings.push(`${(stats.totalTweets / 1000).toFixed(1)}K total posts`);
      }

      // If no warnings, add the bot percent as the main warning
      if (warnings.length === 0 && stats.botPercent > 50) {
        warnings.push(`High bot probability detected`);
      }

      return warnings.map(w => `<div class="poc-warning-item">⚠ ${w}</div>`).join('');
    }

    async trackExpose(username) {
      try {
        const result = await chrome.storage.local.get(['userStats']);
        const userStats = result.userStats || { scanned: 0, bots: 0, exposed: 0 };
        userStats.exposed++;
        await chrome.storage.local.set({ userStats });

        // Notify popup
        chrome.runtime.sendMessage({ type: 'STATS_UPDATED' }).catch(() => {});
      } catch (e) {
        // Ignore storage errors
      }
    }

    shareToTwitter(username, botPercent) {
      this.trackExpose(username);
      const text = `This account @${username} is ${botPercent}% likely a bot! Detected by PoC AI Detector`;
      const url = 'https://poc.app';
      const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(tweetUrl, '_blank');
    }

    addExposeStyles() {
      if (document.getElementById('poc-expose-styles')) return;

      const style = document.createElement('style');
      style.id = 'poc-expose-styles';
      style.textContent = `
        .poc-expose-btn {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
          width: 100%;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
        }

        .poc-expose-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.6);
        }

        .poc-expose-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 12, 41, 0.95);
          backdrop-filter: blur(10px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .poc-expose-modal {
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 100%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 20px;
          padding: 28px;
          max-width: 700px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          animation: slideUp 0.3s ease-out;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .poc-expose-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.8);
          transition: all 0.3s;
        }

        .poc-expose-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          transform: rotate(90deg);
        }

        .poc-expose-preview {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
        }

        .poc-share-card {
          width: 600px;
          height: 337.5px;
          background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
          border-radius: 16px;
          padding: 36px;
          color: white;
          font-family: system-ui, -apple-system, sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border: 1px solid rgba(139, 92, 246, 0.3);
        }

        .poc-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .poc-card-alert {
          font-size: 20px;
          font-weight: 700;
          color: #ef4444;
        }

        .poc-card-logo {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
        }

        .poc-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .poc-card-username {
          font-size: 32px;
          font-weight: 700;
        }

        .poc-meter-bar {
          width: 100%;
          height: 24px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
        }

        .poc-meter-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444, #dc2626);
          transition: width 0.3s ease-out;
        }

        .poc-meter-label {
          margin-top: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #d1d5db;
        }

        .poc-card-warnings {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .poc-warning-item {
          font-size: 15px;
          color: #fca5a5;
        }

        .poc-card-footer {
          padding-top: 16px;
        }

        .poc-card-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.2);
          margin-bottom: 16px;
        }

        .poc-card-cta {
          font-size: 14px;
          color: #9ca3af;
          text-align: center;
        }

        .poc-expose-actions {
          display: flex;
          justify-content: center;
        }

        .poc-btn {
          padding: 14px 32px;
          border-radius: 10px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .poc-btn-primary {
          background: linear-gradient(135deg, #1d9bf0, #0c7abf);
          color: white;
          box-shadow: 0 4px 15px rgba(29, 155, 240, 0.4);
        }

        .poc-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(29, 155, 240, 0.6);
        }
      `;

      document.head.appendChild(style);
    }
  }

  // Initialize
  const exposer = new BotExposer();
  setTimeout(() => exposer.init(), 2000);
})();
