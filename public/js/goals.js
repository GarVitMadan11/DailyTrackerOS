// Goals Manager for pyTron
class GoalsManager {
    constructor(app) {
        this.app = app;
        this.goals = this.loadGoals();
    }

    loadGoals() {
        const stored = localStorage.getItem('pytron_goals');
        return stored ? JSON.parse(stored) : [];
    }

    saveGoals() {
        localStorage.setItem('pytron_goals', JSON.stringify(this.goals));
    }

    createGoal(goalData) {
        const goal = {
            id: Date.now().toString(),
            title: goalData.title,
            type: goalData.type, // 'hours', 'streak', 'tasks', 'custom'
            target: goalData.target,
            current: 0,
            category: goalData.category || null,
            deadline: goalData.deadline || null,
            createdAt: new Date().toISOString(),
            completedAt: null,
            milestones: {
                25: false,
                50: false,
                75: false,
                100: false
            }
        };

        this.goals.push(goal);
        this.saveGoals();
        
        this.app.showToast(`Goal created: ${goal.title}! 🎯`, 'success');
        return goal;
    }

    updateGoal(goalId, updates) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        Object.assign(goal, updates);
        this.saveGoals();
    }

    deleteGoal(goalId) {
        const index = this.goals.findIndex(g => g.id === goalId);
        if (index !== -1) {
            this.goals.splice(index, 1);
            this.saveGoals();
            this.app.showToast('Goal deleted', 'info');
        }
    }

    calculateProgress(goal) {
        switch (goal.type) {
            case 'hours':
                if (goal.category) {
                    // Count hours of specific category
                    goal.current = this.countHoursByCategory(goal.category);
                } else {
                    // Total hours
                    goal.current = this.getTotalHours();
                }
                break;

            case 'streak':
                goal.current = this.app.currentStreak;
                break;

            case 'tasks':
                goal.current = this.app.tasks.filter(t => t.completed).length;
                break;

            case 'custom':
                // Custom goals must be manually updated
                break;
        }

        this.saveGoals();
        return goal.current;
    }

    countHoursByCategory(category) {
        let count = 0;
        for (const [date, hours] of Object.entries(this.app.data)) {
            for (const [hour, entry] of Object.entries(hours)) {
                if (entry.category === category) {
                    count++;
                }
            }
        }
        return count;
    }

    getTotalHours() {
        let count = 0;
        for (const [date, hours] of Object.entries(this.app.data)) {
            count += Object.keys(hours).length;
        }
        return count;
    }

    checkMilestones(goal) {
        const progress = this.getProgress(goal);
        const newMilestones = [];

        // Check each milestone
        [25, 50, 75, 100].forEach(milestone => {
            if (progress >= milestone && !goal.milestones[milestone]) {
                goal.milestones[milestone] = true;
                newMilestones.push(milestone);
                
                // Show notification
                if (milestone === 100) {
                    this.completeGoal(goal);
                } else {
                    this.app.showToast(
                        `${milestone}% milestone reached for "${goal.title}"! 🎉`,
                        'success'
                    );
                }
            }
        });

        if (newMilestones.length > 0) {
            this.saveGoals();
        }

        return newMilestones;
    }

    completeGoal(goal) {
        goal.completedAt = new Date().toISOString();
        goal.current = goal.target;
        goal.milestones[100] = true;
        
        this.saveGoals();
        
        // Show celebration
        this.showGoalCompletion(goal);
        
        // Send notification
        if (window.notificationService) {
            window.notificationService.sendNotification(
                'Goal Completed! 🎯',
                `"${goal.title}" - Great job!`,
                { icon: '/icons/icon-192.png', tag: `goal-${goal.id}` }
            );
        }
    }

    showGoalCompletion(goal) {
        const modal = document.createElement('div');
        modal.className = 'goal-complete-modal';
        modal.innerHTML = `
            <div class="goal-complete-content">
                <div class="goal-complete-icon">🎯</div>
                <h2>Goal Completed!</h2>
                <h3>${goal.title}</h3>
                <p>You reached your target of ${goal.target}!</p>
                <button class="btn-primary mt-4" onclick="this.closest('.goal-complete-modal').remove()">
                    Celebrate! 🎉
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            if (modal.parentElement) {
                modal.remove();
            }
        }, 10000);
    }

    getProgress(goal) {
        if (goal.target === 0) return 0;
        return Math.min(100, (goal.current / goal.target) * 100);
    }

    getActiveGoals() {
        return this.goals.filter(g => !g.completedAt);
    }

    getCompletedGoals() {
        return this.goals.filter(g => g.completedAt);
    }

    updateAllGoalProgress() {
        this.goals.forEach(goal => {
            if (!goal.completedAt) {
                this.calculateProgress(goal);
                this.checkMilestones(goal);
            }
        });
    }

    getGoalById(goalId) {
        return this.goals.find(g => g.id === goalId);
    }
}
