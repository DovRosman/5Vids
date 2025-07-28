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
 * Checks if the daily data needs to be reset (i.e., if it's a new day).
 */
function resetDailyDataIfNeeded() {
  const today = getTodayDateString();
  chrome.storage.local.get("lastResetDate", (data) => {
    if (data.lastResetDate !== today) {
      chrome.storage.local.set({
        watchedVideosToday: [],
        lastResetDate: today,
      });
      console.log("New day, video data reset.");
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

    // Check if video is already in the list
    if (watchedVideos.some((video) => video.id === videoId)) {
      callback({ success: true, message: "Video already counted" });
      return;
    }

    // Check if limit would be exceeded
    if (watchedVideos.length >= 5) {
      callback({ success: false, message: "Daily limit reached" });
      return;
    }

    // Add the video
    const newVideo = { id: videoId, title: videoTitle };
    watchedVideos.push(newVideo);

    chrome.storage.local.set({ watchedVideosToday: watchedVideos }, () => {
      console.log(
        `Video added: "${videoTitle}". Count: ${watchedVideos.length}`,
      );
      callback({ success: true, message: "Video added to count" });
    });
  });
}

/**
 * Checks if a video should show the overlay (not already watched, under limit, extension enabled)
 * @param {string} videoId The YouTube video ID
 * @param {function} callback Callback function to handle the response
 */
function checkVideoStatus(videoId, callback) {
  chrome.storage.local.get(
    ["watchedVideosToday", "extensionEnabled"],
    (data) => {
      const isEnabled = data.extensionEnabled !== false; // Default to true

      if (!isEnabled) {
        callback({ shouldShowOverlay: false });
        return;
      }

      resetDailyDataIfNeeded();

      let watchedVideos = data.watchedVideosToday || [];
      const isAlreadyWatched = watchedVideos.some(
        (video) => video.id === videoId,
      );
      const hasReachedLimit = watchedVideos.length >= 5;

      if (isAlreadyWatched) {
        callback({ shouldShowOverlay: false, reason: "already_watched" });
      } else if (hasReachedLimit) {
        callback({ shouldShowOverlay: false, reason: "limit_reached" });
        // Redirect to block page
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, {
              url: chrome.runtime.getURL("block.html"),
            });
          }
        });
      } else {
        callback({
          shouldShowOverlay: true,
          currentCount: watchedVideos.length,
          remaining: 5 - watchedVideos.length,
        });
      }
    },
  );
}

// --- Extension Listeners ---

// Set default values when the extension is installed.
chrome.runtime.onInstalled.addListener(() => {
  resetDailyDataIfNeeded();
  chrome.storage.local.get(["extensionEnabled", "darkMode"], (data) => {
    if (data.extensionEnabled === undefined) {
      chrome.storage.local.set({ extensionEnabled: true });
    }
    if (data.darkMode === undefined) {
      chrome.storage.local.set({ darkMode: true });
    }
  });
});

// Listen for messages from content script and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "removeVideo") {
    chrome.storage.local.get(["watchedVideosToday"], (data) => {
      let watchedVideos = data.watchedVideosToday || [];
      watchedVideos = watchedVideos.filter(
        (video) => video.id !== request.videoId,
      );
      chrome.storage.local.set({ watchedVideosToday: watchedVideos });
      sendResponse({ success: true });
    });
    return true; // Indicates an asynchronous response.
  } else if (request.action === "addVideoToCount") {
    addVideoToCount(request.videoId, request.videoTitle, sendResponse);
    return true; // Indicates an asynchronous response.
  } else if (request.action === "checkVideoStatus") {
    checkVideoStatus(request.videoId, sendResponse);
    return true; // Indicates an asynchronous response.
  }
});
