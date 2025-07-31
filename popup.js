// popup.js

function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function updateTheme(isDark) {
  document.body.setAttribute("data-theme", isDark ? "dark" : "light");
  const themeIcon = document.getElementById("theme-icon");

  if (isDark) {
    // Moon icon for dark mode
    themeIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
    `;
  } else {
    // Sun icon for light mode
    themeIcon.innerHTML = `
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
    `;
  }
}

function updateExtensionToggle(isEnabled) {
  const toggle = document.getElementById("extension-toggle");
  const statusBar = document.getElementById("status-bar");

  if (isEnabled) {
    toggle.classList.add("active");
    statusBar.textContent = "Extension is active";
    statusBar.className = "status-bar status-enabled";
  } else {
    toggle.classList.remove("active");
    statusBar.textContent = "Extension is disabled";
    statusBar.className = "status-bar status-disabled";
  }
}

function updateProgressBar(count) {
  const progressFill = document.getElementById("progress-fill");
  const percentage = (count / 5) * 100;
  progressFill.style.width = `${percentage}%`;
}

function removeVideo(videoId) {
  chrome.runtime.sendMessage(
    { action: "removeVideo", videoId: videoId },
    (response) => {
      if (response && response.success) {
        updatePopup();
      }
    },
  );
}

function removeVideoFromBank(videoId) {
  chrome.runtime.sendMessage(
    { action: "removeVideoFromBank", videoId: videoId },
    (response) => {
      if (response && response.success) {
        updatePopup();
      }
    },
  );
}

function createVideoItem(video, index, isBank = false) {
  const listItem = document.createElement("li");
  listItem.className = "video-item";

  const thumbnail =
    video.thumbnail || `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;

  listItem.innerHTML = `
    <img src="${thumbnail}"
         alt="Video thumbnail"
         class="video-thumbnail"
         loading="lazy">
    <div class="${isBank ? "bank-number" : "video-number"}">${index + 1}</div>
    <a href="https://www.youtube.com/watch?v=${video.id}"
       target="_blank"
       title="${video.title}"
       class="video-link">${video.title}</a>
    <button class="action-btn delete-btn"
            title="Remove video"
            data-video-id="${video.id}">
      <svg class="action-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
    </button>
  `;

  return listItem;
}

function updatePopup() {
  chrome.storage.local.get(
    [
      "watchedVideosToday",
      "videoBank",
      "lastResetDate",
      "extensionEnabled",
      "darkMode",
    ],
    (data) => {
      const today = getTodayDateString();
      let watchedVideos = data.watchedVideosToday || [];
      let videoBank = data.videoBank || [];

      if (data.lastResetDate !== today) {
        watchedVideos = [];
      }

      // Update theme
      const isDarkMode = data.darkMode !== false; // Default to true
      updateTheme(isDarkMode);

      // Update extension toggle
      const isEnabled = data.extensionEnabled !== false; // Default to true
      updateExtensionToggle(isEnabled);

      // Update the count
      const videoCountElement = document.getElementById("video-count");
      if (videoCountElement) {
        videoCountElement.textContent = watchedVideos.length;
      }

      // Update bank count
      const bankCountElement = document.getElementById("bank-count");
      if (bankCountElement) {
        bankCountElement.textContent = videoBank.length;
      }

      // Update progress bar
      updateProgressBar(watchedVideos.length);

      // Render watched videos
      renderWatchedVideos(watchedVideos);

      // Render bank videos
      renderBankVideos(videoBank);
    },
  );
}

function renderWatchedVideos(watchedVideos) {
  const listElement = document.getElementById("watched-list");
  const messageElement = document.getElementById("no-watched-message");

  listElement.innerHTML = ""; // Clear previous items

  if (watchedVideos.length > 0) {
    messageElement.style.display = "none";
    listElement.style.display = "flex";

    watchedVideos.forEach((video, index) => {
      const listItem = createVideoItem(video, index, false);
      listElement.appendChild(listItem);
    });

    // Add event listeners to action buttons
    listElement.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const videoId = btn.getAttribute("data-video-id");
        removeVideo(videoId);
      });
    });
  } else {
    messageElement.style.display = "flex";
    listElement.style.display = "none";
  }
}

function renderBankVideos(videoBank) {
  const listElement = document.getElementById("bank-list");
  const messageElement = document.getElementById("no-bank-message");

  listElement.innerHTML = ""; // Clear previous items

  if (videoBank.length > 0) {
    messageElement.style.display = "none";
    listElement.style.display = "flex";

    videoBank.forEach((video, index) => {
      const listItem = createVideoItem(video, index, true);
      listElement.appendChild(listItem);
    });

    // Add event listeners to action buttons
    listElement.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const videoId = btn.getAttribute("data-video-id");
        removeVideoFromBank(videoId);
      });
    });
  } else {
    messageElement.style.display = "flex";
    listElement.style.display = "none";
  }
}

function setupTabs() {
  const watchedTab = document.getElementById("watched-tab");
  const bankTab = document.getElementById("bank-tab");
  const watchedContainer = document.getElementById("watched-container");
  const bankContainer = document.getElementById("bank-container");

  watchedTab.addEventListener("click", () => {
    watchedTab.classList.add("active");
    bankTab.classList.remove("active");
    watchedContainer.style.display = "block";
    bankContainer.style.display = "none";
  });

  bankTab.addEventListener("click", () => {
    bankTab.classList.add("active");
    watchedTab.classList.remove("active");
    watchedContainer.style.display = "none";
    bankContainer.style.display = "block";
  });
}

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  updatePopup();

  // Extension toggle handler
  const extensionToggle = document.getElementById("extension-toggle");
  extensionToggle.addEventListener("click", () => {
    chrome.storage.local.get("extensionEnabled", (data) => {
      const currentState = data.extensionEnabled !== false;
      const newState = !currentState;

      chrome.storage.local.set({ extensionEnabled: newState }, () => {
        updateExtensionToggle(newState);
      });
    });
  });

  // Theme toggle handler
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => {
    chrome.storage.local.get("darkMode", (data) => {
      const currentTheme = data.darkMode !== false;
      const newTheme = !currentTheme;

      chrome.storage.local.set({ darkMode: newTheme }, () => {
        updateTheme(newTheme);
      });
    });
  });
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local") {
    if (
      changes.watchedVideosToday ||
      changes.videoBank ||
      changes.extensionEnabled ||
      changes.darkMode
    ) {
      updatePopup();
    }
  }
});
