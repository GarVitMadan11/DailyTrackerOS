// Badge System UI - Both Modal and Full Page
(function () {
  "use strict";

  // Render badges to a specific container
  function renderBadges(category, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !window.badgeSystem) return;

    const badges = window.badgeSystem.getAllBadges();
    const filtered =
      category === "all"
        ? badges
        : badges.filter((b) => b.category === category);

    container.innerHTML = filtered
      .map((badge, index) => {
        const lockedClass = badge.unlocked ? "" : "locked";
        const progress = Math.round(badge.progress);
        const rarityClass = `rarity-${badge.rarity.toLowerCase()}`;

        return `
          <div class="achievement-badge-card ${lockedClass}" data-rarity="${badge.rarity}" style="animation-delay: ${index * 0.08}s">
            <div class="achievement-badge-top">
              <div class="achievement-badge-icon">
                ${badge.icon}
              </div>
              <div class="achievement-badge-rarity ${rarityClass}">
                ${badge.rarity}
              </div>
            </div>
            
            <div class="achievement-badge-middle">
              <h3 class="achievement-badge-name">${badge.name}</h3>
              <p class="achievement-badge-description">${badge.description}</p>
            </div>

            <div class="achievement-badge-bottom">
              ${
                !badge.unlocked
                  ? `
                  <div class="achievement-progress-container">
                    <div class="achievement-progress-bar">
                      <div class="achievement-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="achievement-progress-text">${progress}% Complete</div>
                  </div>
                `
                  : '<div class="achievement-unlocked-badge"><i data-lucide="check-circle-2"></i> Unlocked</div>'
              }
            </div>
          </div>
        `;
      })
      .join("");

    lucide.createIcons();
  }

  // Update stats for a specific section
  function updateAchievementStats(unlockedId, totalId, progressId) {
    if (!window.badgeSystem) return;

    const badges = window.badgeSystem.getAllBadges();
    const unlocked = badges.filter((b) => b.unlocked).length;
    const total = badges.length;
    const progress = Math.round((unlocked / total) * 100);

    const unlockedEl = document.getElementById(unlockedId);
    const totalEl = document.getElementById(totalId);
    const progressEl = document.getElementById(progressId);

    if (unlockedEl) unlockedEl.textContent = unlocked;
    if (totalEl) totalEl.textContent = total;
    if (progressEl) progressEl.textContent = progress + "%";
  }

  // Render full achievements page
  window.renderAchievementsPage = function () {
    if (!window.badgeSystem) {
      console.log("Badge system not ready yet");
      return;
    }

    renderBadges("all", "achievements-container");
    updateAchievementStats(
      "achievements-unlocked-count",
      "achievements-total-count",
      "achievements-progress",
    );

    // Setup category filtering for full page
    const categoryBtns = document.querySelectorAll(
      "#view-achievements .achievement-category-btn",
    );
    categoryBtns.forEach((btn) => {
      btn.onclick = (e) => {
        categoryBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderBadges(btn.dataset.category, "achievements-container");
      };
    });
  };

  // Create and inject badge modal HTML for quick access
  function createBadgeModal() {
    const modal = document.createElement("div");
    modal.id = "badge-modal";
    modal.className = "badge-modal";
    modal.style.display = "none";
    modal.innerHTML = `
      <div class="badge-modal-overlay" onclick="window.closeBadgeModal()"></div>
      <div class="badge-modal-content">
        <!-- Header -->
        <div class="achievement-header">
          <div class="achievement-header-content">
            <div class="achievement-header-icon">
              <i data-lucide="trophy"></i>
            </div>
            <div>
              <h2>Your Achievements</h2>
              <p class="achievement-header-subtitle">Unlock badges by reaching milestones</p>
            </div>
          </div>
          <button class="badge-modal-close" onclick="window.closeBadgeModal()">
            <i data-lucide="x"></i>
          </button>
        </div>
        
        <!-- Stats Section -->
        <div class="achievement-stats-grid">
          <div class="achievement-stat-card">
            <div class="stat-card-icon unlocked">
              <i data-lucide="star"></i>
            </div>
            <div class="stat-card-content">
              <p class="stat-card-value" id="modal-unlocked-count">0</p>
              <p class="stat-card-label">Unlocked</p>
            </div>
          </div>
          <div class="achievement-stat-card">
            <div class="stat-card-icon total">
              <i data-lucide="target"></i>
            </div>
            <div class="stat-card-content">
              <p class="stat-card-value" id="modal-total-count">13</p>
              <p class="stat-card-label">Total Badges</p>
            </div>
          </div>
          <div class="achievement-stat-card">
            <div class="stat-card-icon progress">
              <i data-lucide="zap"></i>
            </div>
            <div class="stat-card-content">
              <p class="stat-card-value" id="modal-progress">0%</p>
              <p class="stat-card-label">Complete</p>
            </div>
          </div>
        </div>

        <!-- Category Filters -->
        <div class="achievement-category-filters">
          <button class="achievement-category-btn active" data-category="all">All Badges</button>
          <button class="achievement-category-btn" data-category="streak">Streaks</button>
          <button class="achievement-category-btn" data-category="deepwork">Deep Work</button>
          <button class="achievement-category-btn" data-category="tasks">Tasks</button>
          <button class="achievement-category-btn" data-category="special">Special</button>
        </div>

        <!-- Badges Showcase -->
        <div class="achievement-showcase">
          <div id="badges-container" class="badges-showcase-grid">
            <!-- Badges will be rendered here -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  // Open modal for quick badge access
  window.openBadgeModal = function () {
    if (!window.badgeSystem) {
      console.log("Badge system not ready yet");
      return;
    }

    const modal = document.getElementById("badge-modal");
    if (!modal) {
      createBadgeModal();
    }

    document.getElementById("badge-modal").style.display = "flex";
    renderBadges("all", "badges-container");
    updateAchievementStats(
      "modal-unlocked-count",
      "modal-total-count",
      "modal-progress",
    );

    // Setup category filtering for modal
    const categoryBtns = document.querySelectorAll(
      "#badge-modal .achievement-category-btn",
    );
    categoryBtns.forEach((btn) => {
      btn.onclick = (e) => {
        categoryBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderBadges(btn.dataset.category, "badges-container");
      };
    });

    // Refresh icons
    setTimeout(() => lucide.createIcons(), 50);
  };

  // Close modal
  window.closeBadgeModal = function () {
    document.getElementById("badge-modal").style.display = "none";
  };

  // Update dashboard badge count
  window.updateDashboardBadgeCount = function () {
    if (!window.badgeSystem) return;

    const badges = window.badgeSystem.getAllBadges();
    const unlocked = badges.filter((b) => b.unlocked).length;
    const total = badges.length;

    const badgeCounter = document.getElementById("qs-badges");
    if (badgeCounter) {
      badgeCounter.textContent = `${unlocked}/${total}`;
    }
  };

  // Initialize on load
  document.addEventListener("DOMContentLoaded", function () {
    createBadgeModal();

    // Update badge count every 2 seconds
    setInterval(() => {
      if (window.badgeSystem) {
        window.updateDashboardBadgeCount();
      }
    }, 2000);
  });
})();
