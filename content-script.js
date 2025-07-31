// content-script.js - Injected into YouTube pages

(function () {
  "use strict";

  let overlayTimer = null;
  let currentVideoId = null;
  let decisionMade = false;
  let overlay = null;

  // Create the overlay HTML
  function createOverlay(videoTitle, currentCount, bankCount, bankRemaining) {
    const overlayHTML = `
            <div id="yt-limit-overlay" style="
                position: fixed;
                top: 20px;
                right: 20px;
                width: 350px;
                background: linear-gradient(135deg, rgba(31, 41, 55, 0.98), rgba(55, 65, 81, 0.98));
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 16px;
                padding: 20px;
                color: white;
                font-family: 'YouTube Sans', 'Roboto', sans-serif;
                font-size: 14px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                animation: slideIn 0.3s ease-out;
                user-select: none;
            ">
                <style>
                    @keyframes slideIn {
                        from {
                            opacity: 0;
                            transform: translateX(100px);
                        }
                        to {
                            opacity: 1;
                            transform: translateX(0);
                        }
                    }

                    @keyframes slideOut {
                        from {
                            opacity: 1;
                            transform: translateX(0);
                        }
                        to {
                            opacity: 0;
                            transform: translateX(100px);
                        }
                    }

                    .yt-limit-pulse {
                        animation: pulse 1s ease-in-out infinite;
                    }

                    @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                    }

                    .yt-limit-btn {
                        padding: 10px 16px;
                        border: none;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 13px;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                        justify-content: center;
                        min-width: 0;
                        flex: 1;
                    }

                    .yt-limit-btn:hover {
                        transform: translateY(-1px);
                    }

                    .yt-limit-btn-yes {
                        background: linear-gradient(135deg, #10b981, #059669);
                        color: white;
                    }

                    .yt-limit-btn-yes:hover {
                        background: linear-gradient(135deg, #059669, #047857);
                    }

                    .yt-limit-btn-bank {
                        background: linear-gradient(135deg, #3b82f6, #2563eb);
                        color: white;
                    }

                    .yt-limit-btn-bank:hover {
                        background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    }

                    .yt-limit-btn-bank:disabled {
                        background: #6b7280;
                        cursor: not-allowed;
                        opacity: 0.6;
                    }

                    .yt-limit-btn-bank:disabled:hover {
                        transform: none;
                        background: #6b7280;
                    }

                    .yt-limit-btn-no {
                        background: linear-gradient(135deg, #ef4444, #dc2626);
                        color: white;
                    }

                    .yt-limit-btn-no:hover {
                        background: linear-gradient(135deg, #dc2626, #b91c1c);
                    }

                    .stats-row {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 12px;
                    }

                    .stat-item {
                        flex: 1;
                        text-align: center;
                        padding: 8px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        border: 1px solid rgba(255, 255, 255, 0.15);
                    }

                    .stat-value {
                        font-size: 16px;
                        font-weight: 700;
                        color: #f3f4f6;
                        display: block;
                    }

                    .stat-label {
                        font-size: 10px;
                        color: rgba(255, 255, 255, 0.7);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-top: 2px;
                    }

                    .bank-stat .stat-value {
                        color: #3b82f6;
                    }
                </style>

                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 15px;">
                    <div style="
                        width: 50px;
                        height: 50px;
                        border-radius: 50%;
                        border: 3px solid #ef4444;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-size: 18px;
                        color: #ef4444;
                        position: relative;
                    " id="timer-circle">
                        <div style="
                            position: absolute;
                            top: -3px;
                            left: -3px;
                            width: 50px;
                            height: 50px;
                            border-radius: 50%;
                            border: 3px solid transparent;
                            border-top-color: #ef4444;
                            transform-origin: center;
                            transition: transform 0.1s linear;
                        " id="timer-progress"></div>
                        <span id="timer-number">10</span>
                    </div>
                    <div style="flex: 1;">
                        <div style="
                            font-weight: 600;
                            font-size: 15px;
                            color: #f3f4f6;
                            margin-bottom: 4px;
                        ">What to do with this video?</div>
                        <div style="
                            font-size: 12px;
                            color: rgba(255, 255, 255, 0.7);
                        ">Choose wisely!</div>
                    </div>
                </div>

                <div class="stats-row">
                    <div class="stat-item">
                        <span class="stat-value">${currentCount}/5</span>
                        <span class="stat-label">Today</span>
                    </div>
                    <div class="stat-item bank-stat">
                        <span class="stat-value">${bankCount}/3</span>
                        <span class="stat-label">Bank</span>
                    </div>
                </div>

                <div style="
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.8);
                    margin-bottom: 15px;
                    line-height: 1.4;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                " title="${videoTitle}">${videoTitle}</div>

                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <button class="yt-limit-btn yt-limit-btn-yes" id="count-video-btn">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Count It
                    </button>
                    <button class="yt-limit-btn yt-limit-btn-bank" id="bank-video-btn" ${bankRemaining <= 0 ? "disabled" : ""}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                        Bank
                    </button>
                </div>

                <div style="display: flex; gap: 8px;">
                    <button class="yt-limit-btn yt-limit-btn-no" id="skip-video-btn">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Skip & Go Back
                    </button>
                </div>

                <div style="
                    margin-top: 12px;
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.5);
                    text-align: center;
                ">Y: Count | B: Bank | N: Skip</div>
            </div>
        `;

    // Remove existing overlay if present
    const existingOverlay = document.getElementById("yt-limit-overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create and insert overlay
    const overlayContainer = document.createElement("div");
    overlayContainer.innerHTML = overlayHTML;
    overlay = overlayContainer.firstElementChild;
    document.body.appendChild(overlay);

    return overlay;
  }

  // Start the countdown timer
  function startTimer(overlay, videoId, videoTitle) {
    let timeLeft = 10;
    const timerNumber = overlay.querySelector("#timer-number");
    const timerProgress = overlay.querySelector("#timer-progress");
    const timerCircle = overlay.querySelector("#timer-circle");

    const updateTimer = () => {
      timerNumber.textContent = timeLeft;

      // Update progress ring
      const progress = (10 - timeLeft) / 10;
      const rotation = progress * 360;
      timerProgress.style.transform = `rotate(${rotation}deg)`;

      // Add pulse effect when time is running low
      if (timeLeft <= 3) {
        timerCircle.classList.add("yt-limit-pulse");
      }

      if (timeLeft <= 0) {
        if (!decisionMade) {
          // Auto-skip if no decision made
          skipVideo();
        }
        return;
      }

      timeLeft--;
    };

    updateTimer(); // Initial call
    overlayTimer = setInterval(updateTimer, 1000);

    // Add event listeners
    const countBtn = overlay.querySelector("#count-video-btn");
    const bankBtn = overlay.querySelector("#bank-video-btn");
    const skipBtn = overlay.querySelector("#skip-video-btn");

    countBtn.addEventListener("click", () => countVideo(videoId, videoTitle));
    bankBtn.addEventListener("click", () => bankVideo(videoId, videoTitle));
    skipBtn.addEventListener("click", () => skipVideo());

    // Keyboard shortcuts
    const keyHandler = (e) => {
      if (e.key === "y" || e.key === "Y") {
        e.preventDefault();
        countVideo(videoId, videoTitle);
      } else if (e.key === "b" || e.key === "B") {
        e.preventDefault();
        if (!bankBtn.disabled) {
          bankVideo(videoId, videoTitle);
        }
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        skipVideo();
      }
    };

    document.addEventListener("keydown", keyHandler);

    // Store reference to remove listener later
    overlay._keyHandler = keyHandler;
  }

  // Count the video (user chose yes)
  function countVideo(videoId, videoTitle) {
    if (decisionMade) return;
    decisionMade = true;

    // Send message to background script
    chrome.runtime.sendMessage(
      {
        action: "addVideoToCount",
        videoId: videoId,
        videoTitle: videoTitle,
      },
      (response) => {
        console.log("Video counted:", response);
      },
    );

    removeOverlay();
  }

  // Bank the video (user chose to bank)
  function bankVideo(videoId, videoTitle) {
    if (decisionMade) return;
    decisionMade = true;

    // Send message to background script
    chrome.runtime.sendMessage(
      {
        action: "addVideoToBank",
        videoId: videoId,
        videoTitle: videoTitle,
      },
      (response) => {
        console.log("Video banked:", response);
      },
    );

    removeOverlay();
  }

  // Skip the video (user chose no)
  function skipVideo() {
    if (decisionMade) return;
    decisionMade = true;

    // Redirect to YouTube homepage
    window.location.href = "https://www.youtube.com";
  }

  // Remove the overlay
  function removeOverlay() {
    if (overlayTimer) {
      clearInterval(overlayTimer);
      overlayTimer = null;
    }

    if (overlay) {
      // Remove keyboard listener
      if (overlay._keyHandler) {
        document.removeEventListener("keydown", overlay._keyHandler);
      }

      // Animate out
      overlay.style.animation = "slideOut 0.3s ease-out forwards";
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        overlay = null;
      }, 300);
    }
  }

  // Get video title from page
  function getVideoTitle() {
    const titleSelectors = [
      "#title h1 yt-formatted-string",
      "h1.title",
      "#container h1",
      'h1[class*="title"]',
    ];

    for (const selector of titleSelectors) {
      const element = document.querySelector(selector);
      if (element && element.textContent && element.textContent.trim()) {
        return element.textContent.trim();
      }
    }

    // Fallback to document title
    const docTitle = document.title.replace(" - YouTube", "").trim();
    return docTitle !== "YouTube" ? docTitle : "Unknown Video";
  }

  // Check if this is a new video and show overlay if needed
  function checkVideoAndShowOverlay() {
    const url = window.location.href;
    if (!url.includes("youtube.com/watch")) {
      currentVideoId = null; // Reset when we navigate away from a watch page
      return;
    }

    const videoId = new URL(url).searchParams.get("v");
    if (!videoId || videoId === currentVideoId) return;

    currentVideoId = videoId;
    decisionMade = false;

    // Wait a bit for page to load, then get video title and show overlay
    setTimeout(() => {
      // The background script now handles redirection proactively.
      // This message is just to check if we should show the overlay.
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          {
            action: "checkVideoStatus",
            videoId: videoId,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              // This can happen if the extension context is invalidated.
              // The background script's webNavigation listener will handle redirection.
              console.log("5Vids: " + chrome.runtime.lastError.message);
              return;
            }
            if (response && response.shouldShowOverlay) {
              const videoTitle = getVideoTitle();
              const overlayElement = createOverlay(
                videoTitle,
                response.currentCount,
                response.bankCount,
                response.bankRemaining,
              );
              startTimer(overlayElement, videoId, videoTitle);
            }
          },
        );
      } else {
        // The chrome.runtime object is not available. This can happen during an extension reload.
        // The background script's webNavigation listener should handle this case.
        console.log(
          "5Vids: Extension context not available. Background script will handle redirection if needed.",
        );
      }
    }, 500); // Reduced timeout to be more responsive
  }

  // Listen for URL changes (YouTube is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // Remove existing overlay when navigating
      if (overlay) {
        removeOverlay();
      }
      checkVideoAndShowOverlay();
    }
  }).observe(document, { subtree: true, childList: true });

  // Initial check
  checkVideoAndShowOverlay();
})();
