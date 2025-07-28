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

function updatePopup() {
  chrome.storage.local.get(
    ["watchedVideosToday", "lastResetDate", "extensionEnabled", "darkMode"],
    (data) => {
      const today = getTodayDateString();
      let watchedVideos = data.watchedVideosToday || [];

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

      // Update progress bar
      updateProgressBar(watchedVideos.length);

      // Render the watched videos list
      const listElement = document.getElementById("video-list");
      const messageElement = document.getElementById("no-videos-message");

      listElement.innerHTML = ""; // Clear previous items

      if (watchedVideos.length > 0) {
        messageElement.style.display = "none";
        listElement.style.display = "flex";

        watchedVideos.forEach((video, index) => {
          const listItem = document.createElement("li");
          listItem.className = "video-item";

          listItem.innerHTML = `
          <div class="video-number">${index + 1}</div>
          <a href="https://www.youtube.com/watch?v=${video.id}"
             target="_blank"
             title="${video.title}"
             class="video-link">${video.title}</a>
          <button class="delete-btn"
                  title="Remove video"
                  data-video-id="${video.id}">
            <svg class="delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        `;

          listElement.appendChild(listItem);
        });

        // Add event listeners to delete buttons
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
    },
  );
}

// Initialize popup
document.addEventListener("DOMContentLoaded", () => {
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
      changes.extensionEnabled ||
      changes.darkMode
    ) {
      updatePopup();
    }
  }
});
