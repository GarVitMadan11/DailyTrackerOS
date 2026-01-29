// Notification Service for pyTron
class NotificationService {
    constructor(app) {
        this.app = app;
        this.settings = this.loadSettings();
        this.scheduledTimers = [];
        
        this.init();
    }

    loadSettings() {
        const stored = localStorage.getItem('pytron_notification_settings');
        if (stored) {
            return JSON.parse(stored);
        }
        
        return {
            enabled: false,
            dailyReminderEnabled: true,
            dailyReminderTime: '18:00', // 6 PM default
            taskDeadlinesEnabled: true,
            streakAlertsEnabled: true,
            weeklySummaryEnabled: true,
            quietHoursEnabled: false,
            quietHoursStart: '22:00', // 10 PM
            quietHoursEnd: '08:00' // 8 AM
        };
    }

    saveSettings() {
        localStorage.setItem('pytron_notification_settings', JSON.stringify(this.settings));
    }

    init() {
        // Check if browser supports notifications
        if (!('Notification' in window)) {
            console.warn('[Notifications] Browser does not support notifications');
            return;
        }

        // If already granted, start scheduling
        if (Notification.permission === 'granted' && this.settings.enabled) {
            this.startScheduling();
        }
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            this.app.showToast('Your browser doesn\'t support notifications', 'error');
            return false;
        }

        if (Notification.permission === 'granted') {
            this.app.showToast('Notifications already enabled!', 'success');
            this.settings.enabled = true;
            this.saveSettings();
            this.startScheduling();
            return true;
        }

        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.app.showToast('Notifications enabled! 🔔', 'success');
                this.settings.enabled = true;
                this.saveSettings();
                this.startScheduling();
                return true;
            } else {
                this.app.showToast('Notifications blocked. Enable in browser settings.', 'info');
                return false;
            }
        } catch (error) {
            console.error('[Notifications] Permission error:', error);
            return false;
        }
    }

    startScheduling() {
        // Clear existing timers
        this.scheduledTimers.forEach(timer => clearTimeout(timer));
        this.scheduledTimers = [];

        if (!this.settings.enabled) return;

        // Schedule daily reminder
        if (this.settings.dailyReminderEnabled) {
            this.scheduleDailyReminder();
        }

        // Check tasks every hour for upcoming deadlines
        if (this.settings.taskDeadlinesEnabled) {
            this.scheduleTaskDeadlineChecks();
        }

        // Check streak risk in evening
        if (this.settings.streakAlertsEnabled) {
            this.scheduleStreakCheck();
        }

        console.log('[Notifications] Scheduling started');
    }

    scheduleDailyReminder() {
        const now = new Date();
        const [hours, minutes] = this.settings.dailyReminderTime.split(':').map(Number);
        
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (scheduledTime <= now) {
            scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        const delay = scheduledTime - now;
        
        const timer = setTimeout(() => {
            this.sendDailyReminder();
            // Reschedule for next day
            this.scheduleDailyReminder();
        }, delay);

        this.scheduledTimers.push(timer);
        
        const timeString = scheduledTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        console.log(`[Notifications] Daily reminder scheduled for ${timeString}`);
    }

    scheduleTaskDeadlineChecks() {
        // Check every hour
        const checkInterval = 60 * 60 * 1000;
        
        const check = () => {
            this.checkTaskDeadlines();
            const timer = setTimeout(check, checkInterval);
            this.scheduledTimers.push(timer);
        };
        
        // Initial check
        this.checkTaskDeadlines();
        
        // Schedule hourly checks
        const timer = setTimeout(check, checkInterval);
        this.scheduledTimers.push(timer);
    }

    scheduleStreakCheck() {
        const now = new Date();
        const checkTime = new Date();
        checkTime.setHours(20, 0, 0, 0); // 8 PM

        // If time has passed today, schedule for tomorrow
        if (checkTime <= now) {
            checkTime.setDate(checkTime.getDate() + 1);
        }

        const delay = checkTime - now;
        
        const timer = setTimeout(() => {
            this.checkStreakRisk();
            // Reschedule for next day
            this.scheduleStreakCheck();
        }, delay);

        this.scheduledTimers.push(timer);
    }

    sendDailyReminder() {
        if (this.isQuietHours()) return;

        const today = this.app.getDateKey(new Date());
        const todayData = this.app.data[today] || {};
        const hoursLogged = Object.keys(todayData).length;

        let body = hoursLogged > 0 
            ? `You've logged ${hoursLogged} hours today. Keep it up!`
            : 'Time to log your hours for today! 📝';

        this.sendNotification('Daily Log Reminder', body, {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            tag: 'daily-reminder',
            requireInteraction: false
        });
    }

    checkTaskDeadlines() {
        if (this.isQuietHours()) return;

        const now = new Date();
        const nowTime = now.getTime();

        this.app.tasks.forEach(task => {
            if (task.completed || !task.dueTime) return;

            // Parse due time (assumes format like "14:30")
            const [hours, minutes] = task.dueTime.split(':').map(Number);
            const dueDate = new Date();
            dueDate.setHours(hours, minutes, 0, 0);

            const timeUntilDue = dueDate - now;
            const minutesUntilDue = Math.floor(timeUntilDue / 60000);

            // Notify 30 minutes before
            if (minutesUntilDue === 30) {
                this.sendNotification('Task Deadline Approaching', 
                    `"${task.text}" is due in 30 minutes!`, {
                    icon: '/icons/icon-192.png',
                    tag: `task-${task.id}`,
                    data: { taskId: task.id }
                });
            }
            
            // Notify when overdue
            if (minutesUntilDue === -5 && !task.notifiedOverdue) {
                this.sendNotification('Task Overdue!', 
                    `"${task.text}" is now overdue!`, {
                    icon: '/icons/icon-192.png',
                    tag: `task-overdue-${task.id}`,
                    data: { taskId: task.id }
                });
                task.notifiedOverdue = true;
            }
        });
    }

    checkStreakRisk() {
        if (this.isQuietHours()) return;

        const today = this.app.getDateKey(new Date());
        const todayData = this.app.data[today] || {};
        
        // Check if any deep work logged today
        const hasDeepWork = Object.values(todayData).some(
            entry => entry.category === 'DEEP_WORK'
        );

        if (!hasDeepWork) {
            this.sendNotification('Streak at Risk! 🔥', 
                'You haven\'t logged any deep work today. Keep your streak alive!', {
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png',
                tag: 'streak-risk',
                requireInteraction: true
            });
        }
    }

    isQuietHours() {
        if (!this.settings.quietHoursEnabled) return false;

        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = this.settings.quietHoursStart.split(':').map(Number);
        const [endHour, endMin] = this.settings.quietHoursEnd.split(':').map(Number);

        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;

        // Handle overnight quiet hours (e.g., 22:00 to 08:00)
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime < endTime;
        } else {
            return currentTime >= startTime && currentTime < endTime;
        }
    }

    sendNotification(title, body, options = {}) {
        if (!this.settings.enabled || Notification.permission !== 'granted') {
            return;
        }

        if (this.isQuietHours()) {
            console.log('[Notifications] Skipped (quiet hours):', title);
            return;
        }

        const defaultOptions = {
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-72.png',
            vibrate: [200, 100, 200],
            ...options
        };

        try {
            const notification = new Notification(title, {
                body,
                ...defaultOptions
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
                
                // Handle notification click based on data
                if (options.data?.taskId) {
                    this.app.switchView('tasks');
                }
            };

            console.log('[Notifications] Sent:', title);
        } catch (error) {
            console.error('[Notifications] Send error:', error);
        }
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveSettings();
        
        // Restart scheduling with new settings
        if (this.settings.enabled) {
            this.startScheduling();
        } else {
            // Clear all timers if disabled
            this.scheduledTimers.forEach(timer => clearTimeout(timer));
            this.scheduledTimers = [];
        }
    }

    // Test notification (for settings UI)
    sendTestNotification() {
        this.sendNotification('Test Notification', 
            'pyTron notifications are working! 🎉', {
            icon: '/icons/icon-192.png',
            tag: 'test'
        });
    }
}
