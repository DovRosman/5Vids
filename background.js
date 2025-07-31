// background.js

/**
 * Returns the current date as a string in YYYY-MM-DD format.
 */
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Applies the limit-reached CSS to a specific tab.
 */
function applyLimitReachedStyles(tabId) {
  // Add a check to prevent errors if the tab is closed
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      console.log(`Tab ${tabId} not found, skipping CSS injection.`);
      return;
    }
    chrome.scripting
      .insertCSS({
        target: { tabId: tabId },
        files: ["limit-reached.css"],
      })
      .catch((err) => console.log("Failed to insert CSS:", err.message));
  });
}

/**
 * Removes the limit-reached CSS from a specific tab.
 */
function removeLimitReachedStyles(tabId) {
  // Add a check to prevent errors if the tab is closed
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) {
      console.log(`Tab ${tabId} not found, skipping CSS removal.`);
      return;
    }
    chrome.scripting
      .removeCSS({
        target: { tabId: tabId },
        files: ["limit-reached.css"],
      })
      .catch((err) => console.log("Failed to remove CSS:", err.message));
  });
}

/**
 * Updates the styling of a YouTube tab based on the current state.
 * @param {object} tab The tab to update.
 */
function updateYouTubeTabStyles(tab) {
  chrome.storage.local.get(
    ["watchedVideosToday", "extensionEnabled"],
    (data) => {
      const isEnabled = data.extensionEnabled !== false;
      const watchedVideos = data.watchedVideosToday || [];
      const hasReachedLimit = watchedVideos.length >= 5;

      if (isEnabled && hasReachedLimit) {
        applyLimitReachedStyles(tab.id);
      } else {
        removeLimitReachedStyles(tab.id);
      }
    },
  );
}

/**
 * Updates the styling for all open YouTube tabs.
 */
function updateAllYouTubeTabsStyles() {
  chrome.tabs.query({ url: "*://*.youtube.com/*" }, (tabs) => {
    tabs.forEach(updateYouTubeTabStyles);
  });
}

/**
 * Checks if the daily data needs to be reset (i.e., if it's a new day).
 */
function resetDailyDataIfNeeded() {
  const today = getTodayDateString();
  chrome.storage.local.get("lastResetDate", (data) => {
    if (data.lastResetDate !== today) {
      chrome.storage.local.set(
        {
          watchedVideosToday: [],
          lastResetDate: today,
        },
        () => {
          console.log("New day, video data reset.");
          updateAllYouTubeTabsStyles();
        },
      );
    }
  });
}

/**
 * Adds a video to the watched list
 * @param {string} videoId The YouTube video ID
 * @param {string} videoTitle The title of the video
 * @param {function} callback Callback function to handle the response
 */
function addVideoToCount(videoId, videoTitle, callback) {
  chrome.storage.local.get(["watchedVideosToday"], (data) => {
    let watchedVideos = data.watchedVideosToday || [];

    if (watchedVideos.some((video) => video.id === videoId)) {
      callback({ success: true, message: "Video already counted" });
      return;
    }

    if (watchedVideos.length >= 5) {
      callback({ success: false, message: "Daily limit reached" });
      return;
    }

    getVideoThumbnail(videoId, (thumbnail) => {
      const newVideo = {
        id: videoId,
        title: videoTitle,
        thumbnail: thumbnail,
        addedAt: Date.now(),
      };
      watchedVideos.push(newVideo);

      chrome.storage.local.set({ watchedVideosToday: watchedVideos }, () => {
        console.log(
          `Video added: "${videoTitle}". Count: ${watchedVideos.length}`,
        );
        if (watchedVideos.length >= 5) {
          updateAllYouTubeTabsStyles();
        }
        callback({ success: true, message: "Video added to count" });
      });
    });
  });
}

/**
 * Adds a video to the bank
 * @param {string} videoId The YouTube video ID
 * @param {string} videoTitle The title of the video
 * @param {function} callback Callback function to handle the response
 */
function addVideoToBank(videoId, videoTitle, callback) {
  chrome.storage.local.get(["videoBank"], (data) => {
    let videoBank = data.videoBank || [];

    if (videoBank.some((video) => video.id === videoId)) {
      callback({ success: true, message: "Video already in bank" });
      return;
    }

    if (videoBank.length >= 3) {
      callback({
        success: false,
        message: "Bank limit reached (3 videos max)",
      });
      return;
    }

    getVideoThumbnail(videoId, (thumbnail) => {
      const newVideo = {
        id: videoId,
        title: videoTitle,
        thumbnail: thumbnail,
        bankedAt: Date.now(),
      };
      videoBank.push(newVideo);

      chrome.storage.local.set({ videoBank: videoBank }, () => {
        console.log(
          `Video banked: "${videoTitle}". Bank count: ${videoBank.length}`,
        );
        callback({ success: true, message: "Video added to bank" });
      });
    });
  });
}

/**
 * Gets video thumbnail URL
 * @param {string} videoId The YouTube video ID
 * @param {function} callback Callback function to handle the response
 */
function getVideoThumbnail(videoId, callback) {
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;
  callback(thumbnailUrl);
}

/**
 * Checks if a video should show the overlay. This does NOT redirect.
 * @param {string} videoId The YouTube video ID
 * @param {function} callback Callback function to handle the response
 */
function checkVideoStatusForOverlay(videoId, callback) {
  chrome.storage.local.get(
    ["watchedVideosToday", "extensionEnabled", "videoBank"],
    (data) => {
      const isEnabled = data.extensionEnabled !== false;
      if (!isEnabled) {
        callback({ shouldShowOverlay: false });
        return;
      }

      resetDailyDataIfNeeded();

      let watchedVideos = data.watchedVideosToday || [];
      let videoBank = data.videoBank || [];

      const isAlreadyWatched = watchedVideos.some(
        (video) => video.id === videoId,
      );
      const isInBank = videoBank.some((video) => video.id === videoId);
      const hasReachedLimit = watchedVideos.length >= 5;

      if (isAlreadyWatched || isInBank || hasReachedLimit) {
        callback({ shouldShowOverlay: false });
      } else {
        callback({
          shouldShowOverlay: true,
          currentCount: watchedVideos.length,
          remaining: 5 - watchedVideos.length,
          bankCount: videoBank.length,
          bankRemaining: 3 - videoBank.length,
        });
      }
    },
  );
}

/**
 * Checks the video limit and redirects the tab if the limit is reached.
 * @param {number} tabId The ID of the tab to check.
 * @param {string} url The URL of the tab.
 */
function checkLimitAndRedirect(tabId, url) {
  try {
    const videoId = new URL(url).searchParams.get("v");
    if (!videoId) return;

    chrome.storage.local.get(
      ["watchedVideosToday", "extensionEnabled", "videoBank"],
      (data) => {
        const isEnabled = data.extensionEnabled !== false;
        if (!isEnabled) return;

        const watchedVideos = data.watchedVideosToday || [];
        const videoBank = data.videoBank || [];
        const isAlreadyWatched = watchedVideos.some((v) => v.id === videoId);
        const isInBank = videoBank.some((v) => v.id === videoId);
        const hasReachedLimit = watchedVideos.length >= 5;

        if (hasReachedLimit && !isAlreadyWatched && !isInBank) {
          chrome.tabs.update(tabId, {
            url: chrome.runtime.getURL("block.html"),
          });
        }
      },
    );
  } catch (e) {
    console.error("Error in checkLimitAndRedirect:", e);
  }
}

// --- Extension Listeners ---

chrome.runtime.onInstalled.addListener(() => {
  resetDailyDataIfNeeded();
  chrome.storage.local.get(
    ["extensionEnabled", "darkMode", "videoBank"],
    (data) => {
      if (data.extensionEnabled === undefined)
        chrome.storage.local.set({ extensionEnabled: true });
      if (data.darkMode === undefined)
        chrome.storage.local.set({ darkMode: true });
      if (data.videoBank === undefined)
        chrome.storage.local.set({ videoBank: [] });
    },
  );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "removeVideo") {
    chrome.storage.local.get(["watchedVideosToday"], (data) => {
      let watchedVideos = data.watchedVideosToday || [];
      watchedVideos = watchedVideos.filter(
        (video) => video.id !== request.videoId,
      );
      chrome.storage.local.set({ watchedVideosToday: watchedVideos }, () => {
        updateAllYouTubeTabsStyles();
        sendResponse({ success: true });
      });
    });
    return true;
  } else if (request.action === "removeVideoFromBank") {
    chrome.storage.local.get(["videoBank"], (data) => {
      let videoBank = data.videoBank || [];
      videoBank = videoBank.filter((video) => video.id !== request.videoId);
      chrome.storage.local.set({ videoBank: videoBank }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  } else if (request.action === "addVideoToCount") {
    addVideoToCount(request.videoId, request.videoTitle, sendResponse);
    return true;
  } else if (request.action === "addVideoToBank") {
    addVideoToBank(request.videoId, request.videoTitle, sendResponse);
    return true;
  } else if (request.action === "checkVideoStatus") {
    checkVideoStatusForOverlay(request.videoId, sendResponse);
    return true;
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (
    namespace === "local" &&
    (changes.watchedVideosToday || changes.extensionEnabled)
  ) {
    updateAllYouTubeTabsStyles();
  }
});

// This listener handles full page loads and style updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url &&
    tab.url.includes("youtube.com")
  ) {
    if (tab.url.includes("/watch")) {
      checkLimitAndRedirect(tabId, tab.url);
    }
    updateYouTubeTabStyles(tab);
  }
});

// This listener handles SPA navigation (e.g., clicking a video from the homepage)
chrome.webNavigation.onHistoryStateUpdated.addListener(
  (details) => {
    if (details.frameId === 0 && details.url.includes("youtube.com/watch")) {
      checkLimitAndRedirect(details.tabId, details.url);
    }
  },
  { url: [{ hostContains: "www.youtube.com" }] },
);
