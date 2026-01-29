// Badge Modal UI
(function() {
    'use strict';

    // Create and inject badge modal HTML
    function createBadgeModal() {
        const modal = document.createElement('div');
        modal.id = 'badge-modal';
        modal.className = 'badge-modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="badge-modal-overlay" onclick="window.closeBadgeModal()"></div>
            <div class="badge-modal-content">
                <div class="badge-modal-header">
                    <h2>🏆 Your Achievements</h2>
                    <button class="badge-modal-close" onclick="window.closeBadgeModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="badge-modal-stats">
                    <div class="badge-stat">
                        <span class="badge-stat-value" id="modal-unlocked-count">0</span>
                        <span class="badge-stat-label">Unlocked</span>
                    </div>
                    <div class="badge-stat">
                        <span class="badge-stat-value" id="modal-total-count">13</span>
                        <span class="badge-stat-label">Total Badges</span>
                    </div>
                    <div class="badge-stat">
                        <span class="badge-stat-value" id="modal-progress">0%</span>
                        <span class="badge-stat-label">Complete</span>
                    </div>
                </div>

                <div class="badge-categories">
                    <button class="badge-category-btn active" data-category="all">All</button>
                    <button class="badge-category-btn" data-category="streak">Streaks</button>
                    <button class="badge-category-btn" data-category="deepwork">Deep Work</button>
                    <button class="badge-category-btn" data-category="tasks">Tasks</button>
                    <button class="badge-category-btn" data-category="special">Special</button>
                </div>

                <div id="badges-container" class="badges-grid">
                    <!-- Badges will be rendered here -->
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    // Open modal
    window.openBadgeModal = function() {
        if (!window.badgeSystem) {
            console.log('Badge system not ready yet');
            return;
        }

        const modal = document.getElementById('badge-modal');
        if (!modal) {
            createBadgeModal();
        }

        document.getElementById('badge-modal').style.display = 'flex';
        renderBadges('all');
        updateBadgeStats();
        
        // Refresh icons
        setTimeout(() => lucide.createIcons(), 50);
    };

    // Close modal
    window.closeBadgeModal = function() {
        document.getElementById('badge-modal').style.display = 'none';
    };

    // Render badges
    function renderBadges(category) {
        const container = document.getElementById('badges-container');
        if (!container || !window.badgeSystem) return;

        const badges = window.badgeSystem.getAllBadges();
        const filtered = category === 'all' 
            ? badges 
            : badges.filter(b => b.category === category);

        container.innerHTML = filtered.map(badge => {
            const lockedClass = badge.unlocked ? '' : 'locked';
            const progress = Math.round(badge.progress);
            
            return `
                <div class="badge-card ${lockedClass}" data-rarity="${badge.rarity}">
                    <div class="badge-card-header">
                        <div class="badge-icon">${badge.icon}</div>
                        <div class="badge-name">${badge.name}</div>
                        <div class="badge-description">${badge.description}</div>
                    </div>
                    
                    <div class="badge-card-footer">
                        ${!badge.unlocked ? `
                            <div class="badge-progress-wrapper">
                                <div class="badge-progress-bar">
                                    <div class="badge-progress-fill" style="width: ${progress}%"></div>
                                </div>
                                <div class="badge-progress-text">
                                    ${progress}% Complete
                                </div>
                            </div>
                        ` : '<div class="badge-spacer"></div>'}
                        <div class="badge-rarity">${badge.rarity}</div>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    }

    // Update stats
    function updateBadgeStats() {
        if (!window.badgeSystem) return;

        const badges = window.badgeSystem.getAllBadges();
        const unlocked = badges.filter(b => b.unlocked).length;
        const total = badges.length;
        const progress = Math.round((unlocked / total) * 100);

        document.getElementById('modal-unlocked-count').textContent = unlocked;
        document.getElementById('modal-total-count').textContent = total;
        document.getElementById('modal-progress').textContent = progress + '%';
    }

    // Category filtering
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('badge-category-btn')) {
            document.querySelectorAll('.badge-category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            e.target.classList.add('active');
            renderBadges(e.target.dataset.category);
        }
    });

    // Update dashboard badge count
    window.updateDashboardBadgeCount = function() {
        if (!window.badgeSystem) return;

        const badges = window.badgeSystem.getAllBadges();
        const unlocked = badges.filter(b => b.unlocked).length;
        const total = badges.length;

        const badgeCounter = document.getElementById('qs-badges');
        if (badgeCounter) {
            badgeCounter.textContent = `${unlocked}/${total}`;
        }
    };

    // Initialize on load
    document.addEventListener('DOMContentLoaded', function() {
        createBadgeModal();
        
        // Update badge count every 2 seconds
        setInterval(() => {
            if (window.badgeSystem) {
                window.updateDashboardBadgeCount();
            }
        }, 2000);
    });
})();
