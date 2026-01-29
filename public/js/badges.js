// Badge System for pyTron
class BadgeSystem {
    constructor(app) {
        this.app = app;
        this.unlockedBadges = this.loadUnlockedBadges();
        
        // Define all available badges
        this.badges = {
            // Streak Badges
            'fire_starter': {
                id: 'fire_starter',
                name: 'Fire Starter',
                icon: '🔥',
                description: 'Maintain a 7-day streak',
                category: 'streak',
                condition: () => this.app.currentStreak >= 7,
                rarity: 'common'
            },
            'hot_streak': {
                id: 'hot_streak',
                name: 'Hot Streak',
                icon: '🔥🔥',
                description: 'Maintain a 30-day streak',
                category: 'streak',
                condition: () => this.app.currentStreak >= 30,
                rarity: 'rare'
            },
            'inferno': {
                id: 'inferno',
                name: 'Inferno',
                icon: '🔥🔥🔥',
                description: 'Maintain a 100-day streak',
                category: 'streak',
                condition: () => this.app.currentStreak >= 100,
                rarity: 'legendary'
            },
            
            // Deep Work Badges
            'focused': {
                id: 'focused',
                name: 'Focused',
                icon: '🎯',
                description: 'Log 10 hours of deep work',
                category: 'deepwork',
                condition: () => this.getTotalDeepWorkHours() >= 10,
                rarity: 'common'
            },
            'deep_diver': {
                id: 'deep_diver',
                name: 'Deep Diver',
                icon: '🎯🎯',
                description: 'Log 50 hours of deep work',
                category: 'deepwork',
                condition: () => this.getTotalDeepWorkHours() >= 50,
                rarity: 'rare'
            },
            'flow_master': {
                id: 'flow_master',
                name: 'Flow Master',
                icon: '🎯🎯🎯',
                description: 'Log 100 hours of deep work',
                category: 'deepwork',
                condition: () => this.getTotalDeepWorkHours() >= 100,
                rarity: 'legendary'
            },
            
            // Task Badges
            'starter': {
                id: 'starter',
                name: 'Starter',
                icon: '✅',
                description: 'Complete 10 tasks',
                category: 'tasks',
                condition: () => this.getCompletedTasksCount() >= 10,
                rarity: 'common'
            },
            'achiever': {
                id: 'achiever',
                name: 'Achiever',
                icon: '✅✅',
                description: 'Complete 50 tasks',
                category: 'tasks',
                condition: () => this.getCompletedTasksCount() >= 50,
                rarity: 'rare'
            },
            'completionist': {
                id: 'completionist',
                name: 'Completionist',
                icon: '✅✅✅',
                description: 'Complete 100 tasks',
                category: 'tasks',
                condition: () => this.getCompletedTasksCount() >= 100,
                rarity: 'legendary'
            },
            
            // Special Badges
            'early_bird': {
                id: 'early_bird',
                name: 'Early Bird',
                icon: '⭐',
                description: 'Log deep work between 5-7 AM',
                category: 'special',
                condition: () => this.hasEarlyMorningWork(),
                rarity: 'rare'
            },
            'night_owl': {
                id: 'night_owl',
                name: 'Night Owl',
                icon: '🌙',
                description: 'Log deep work between 10 PM-12 AM',
                category: 'special',
                condition: () => this.hasLateNightWork(),
                rarity: 'rare'
            },
            'perfect_week': {
                id: 'perfect_week',
                name: 'Perfect Week',
                icon: '📅',
                description: 'Log deep work every day for a week',
                category: 'special',
                condition: () => this.hasPerfectWeek(),
                rarity: 'epic'
            },
            'century': {
                id: 'century',
                name: 'Century',
                icon: '💯',
                description: 'Log 100 total hours tracked',
                category: 'special',
                condition: () => this.getTotalHoursTracked() >= 100,
                rarity: 'epic'
            }
        };
    }

    loadUnlockedBadges() {
        const stored = localStorage.getItem('pytron_unlocked_badges');
        return stored ? JSON.parse(stored) : [];
    }

    saveUnlockedBadges() {
        localStorage.setItem('pytron_unlocked_badges', JSON.stringify(this.unlockedBadges));
    }

    checkAllBadges() {
        const newlyUnlocked = [];

        for (const [id, badge] of Object.entries(this.badges)) {
            // Skip already unlocked
            if (this.unlockedBadges.includes(id)) continue;

            // Check condition
            if (badge.condition()) {
                this.unlockBadge(id);
                newlyUnlocked.push(badge);
            }
        }

        return newlyUnlocked;
    }

    unlockBadge(badgeId) {
        if (this.unlockedBadges.includes(badgeId)) return;

        this.unlockedBadges.push(badgeId);
        this.saveUnlockedBadges();

        const badge = this.badges[badgeId];
        
        // Show celebration
        this.showBadgeUnlock(badge);
        
        // Send notification
        if (window.notificationService) {
            window.notificationService.sendNotification(
                'Badge Unlocked! 🏆',
                `${badge.icon} ${badge.name} - ${badge.description}`,
                { icon: '/icons/icon-192.png', tag: `badge-${badgeId}` }
            );
        }

        console.log(`[Badges] Unlocked: ${badge.name}`);
    }

    showBadgeUnlock(badge) {
        // Create celebration modal
        const modal = document.createElement('div');
        modal.className = 'badge-unlock-modal';
        modal.innerHTML = `
            <div class="badge-unlock-content">
                <div class="badge-unlock-icon">${badge.icon}</div>
                <h2>Badge Unlocked!</h2>
                <h3>${badge.name}</h3>
                <p>${badge.description}</p>
                <div class="badge-rarity badge-rarity-${badge.rarity}">${badge.rarity.toUpperCase()}</div>
                <button class="btn-primary mt-4" onclick="this.closest('.badge-unlock-modal').remove()">
                    Awesome!
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 10000);
    }

    // Helper methods for badge conditions
    getTotalDeepWorkHours() {
        let total = 0;
        for (const [date, hours] of Object.entries(this.app.data)) {
            for (const [hour, entry] of Object.entries(hours)) {
                if (entry.category === 'DEEP_WORK') {
                    total++;
                }
            }
        }
        return total;
    }

    getCompletedTasksCount() {
        return this.app.tasks.filter(t => t.completed).length;
    }

    getTotalHoursTracked() {
        let total = 0;
        for (const [date, hours] of Object.entries(this.app.data)) {
            total += Object.keys(hours).length;
        }
        return total;
    }

    hasEarlyMorningWork() {
        for (const [date, hours] of Object.entries(this.app.data)) {
            for (const [hour, entry] of Object.entries(hours)) {
                const h = parseInt(hour);
                if (entry.category === 'DEEP_WORK' && h >= 5 && h < 7) {
                    return true;
                }
            }
        }
        return false;
    }

    hasLateNightWork() {
        for (const [date, hours] of Object.entries(this.app.data)) {
            for (const [hour, entry] of Object.entries(hours)) {
                const h = parseInt(hour);
                if (entry.category === 'DEEP_WORK' && h >= 22 && h < 24) {
                    return true;
                }
            }
        }
        return false;
    }

    hasPerfectWeek() {
        const dates = Object.keys(this.app.data).sort().reverse();
        if (dates.length < 7) return false;

        // Check last 7 consecutive days
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateKey = this.app.getDateKey(date);
            
            const dayData = this.app.data[dateKey];
            if (!dayData) return false;
            
            const hasDeepWork = Object.values(dayData).some(
                entry => entry.category === 'DEEP_WORK'
            );
            
            if (!hasDeepWork) return false;
        }
        
        return true;
    }

    getProgress(badgeId) {
        const badge = this.badges[badgeId];
        if (!badge) return 0;

        // Calculate progress based on category
        let progress = 0;
        
        try {
            switch (badge.category) {
                case 'streak':
                    const streakMatch = badge.description.match(/(\d+)-day/);
                    const streakTarget = streakMatch ? parseInt(streakMatch[1]) : 100;
                    progress = Math.min(100, (this.app.currentStreak / streakTarget) * 100);
                    break;
                
                case 'deepwork':
                    const dwMatch = badge.description.match(/(\d+) hours/);
                    const dwTarget = dwMatch ? parseInt(dwMatch[1]) : 100;
                    progress = Math.min(100, (this.getTotalDeepWorkHours() / dwTarget) * 100);
                    break;
                
                case 'tasks':
                    const taskMatch = badge.description.match(/(\d+) tasks/);
                    const taskTarget = taskMatch ? parseInt(taskMatch[1]) : 100;
                    progress = Math.min(100, (this.getCompletedTasksCount() / taskTarget) * 100);
                    break;
                
                case 'special':
                    if (badge.id === 'century') {
                        progress = Math.min(100, (this.getTotalHoursTracked() / 100) * 100);
                    } else if (badge.id === 'perfect_week') {
                        // Estimate progress based on consecutive days?
                        // For now, simpler boolean logic
                        progress = badge.condition() ? 100 : 0;
                    } else {
                        progress = badge.condition() ? 100 : 0;
                    }
                    break;
                
                default:
                    progress = badge.condition() ? 100 : 0;
            }
        } catch (e) {
            console.warn(`[Badges] Error calc progress for ${badgeId}:`, e);
            progress = 0;
        }

        return isNaN(progress) ? 0 : Math.round(progress);
    }

    getBadgesByCategory(category) {
        return Object.values(this.badges).filter(b => b.category === category);
    }

    getAllBadges() {
        return Object.values(this.badges).map(badge => ({
            ...badge,
            unlocked: this.unlockedBadges.includes(badge.id),
            progress: this.getProgress(badge.id)
        }));
    }
}
