// Pomodoro Timer Module for pyTron
class PomodoroTimer {
    constructor(app) {
        this.app = app;
        this.state = this.loadState();
        this.timerId = null;
        this.audioContext = null;
        
        this.init();
    }

    loadState() {
        const stored = localStorage.getItem('pytron_pomodoro_state');
        if (stored) {
            return JSON.parse(stored);
        }
        
        return {
            workDuration: 25, // minutes
            breakDuration: 5,
            longBreakDuration: 15,
            sessionsUntilLongBreak: 4,
            currentSession: 0,
            isRunning: false,
            isPaused: false,
            isBreak: false,
            timeRemaining: 25 * 60, // seconds
            totalWorkSessions: 0,
            sessionsToday: [],
            soundEnabled: true
        };
    }

    saveState() {
        localStorage.setItem('pytron_pomodoro_state', JSON.stringify(this.state));
    }

    init() {
        // Wait a bit for DOM to be fully ready
        setTimeout(() => {
            this.createUI();
            this.bindEvents();
            this.updateDisplay();
        }, 200);
    }

    createUI() {
        // Try to find the quick stats container
        let container = document.getElementById('quick-stats');
        
        if (!container) {
            // Fallback: try to find page-header
            container = document.getElementById('page-header');
        }
        
        if (!container) {
            console.warn('[Pomodoro] Could not find container for timer widget');
            return;
        }

        const timerWidget = document.createElement('div');
        timerWidget.id = 'pomodoro-widget';
        timerWidget.className = 'pomodoro-widget';
        timerWidget.innerHTML = `
            <div class="pomodoro-display">
                <div class="pomodoro-ring">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                        <circle cx="40" cy="40" r="36" class="ring-bg"></circle>
                        <circle cx="40" cy="40" r="36" class="ring-progress" id="pomodoro-progress"></circle>
                    </svg>
                    <div class="pomodoro-time" id="pomodoro-time">25:00</div>
                </div>
                <div class="pomodoro-info">
                    <div class="pomodoro-status" id="pomodoro-status">Ready to focus</div>
                    <div class="pomodoro-session" id="pomodoro-session">Session 0/4</div>
                </div>
            </div>
            <div class="pomodoro-controls">
                <button class="pomodoro-btn pomodoro-btn-start" id="pomodoro-start">
                    <i data-lucide="play"></i>
                </button>
                <button class="pomodoro-btn pomodoro-btn-pause hidden" id="pomodoro-pause">
                    <i data-lucide="pause"></i>
                </button>
                <button class="pomodoro-btn pomodoro-btn-reset" id="pomodoro-reset">
                    <i data-lucide="rotate-ccw"></i>
                </button>
                <button class="pomodoro-btn pomodoro-btn-settings" id="pomodoro-settings">
                    <i data-lucide="settings"></i>
                </button>
            </div>
        `;

        container.parentElement.insertBefore(timerWidget, container.nextSibling);
        
        // Re-initialize icons after adding new elements
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        
        console.log('[Pomodoro] Timer widget created successfully');
    }

    bindEvents() {
        const startBtn = document.getElementById('pomodoro-start');
        const pauseBtn = document.getElementById('pomodoro-pause');
        const resetBtn = document.getElementById('pomodoro-reset');
        const settingsBtn = document.getElementById('pomodoro-settings');

        if (startBtn) startBtn.addEventListener('click', () => this.start());
        if (pauseBtn) pauseBtn.addEventListener('click', () => this.pause());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (settingsBtn) settingsBtn.addEventListener('click', () => this.showSettings());
    }

    start() {
        this.state.isRunning = true;
        this.state.isPaused = false;
        
        document.getElementById('pomodoro-start').classList.add('hidden');
        document.getElementById('pomodoro-pause').classList.remove('hidden');
        
        if (this.timerId) clearInterval(this.timerId);
        
        this.timerId = setInterval(() => this.tick(), 1000);
        this.updateStatus();
        this.saveState();
    }

    pause() {
        this.state.isRunning = false;
        this.state.isPaused = true;
        
        document.getElementById('pomodoro-start').classList.remove('hidden');
        document.getElementById('pomodoro-pause').classList.add('hidden');
        
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        
        this.updateStatus();
        this.saveState();
    }

    reset() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
        }
        
        this.state.isRunning = false;
        this.state.isPaused = false;
        this.state.isBreak = false;
        this.state.timeRemaining = this.state.workDuration * 60;
        
        document.getElementById('pomodoro-start').classList.remove('hidden');
        document.getElementById('pomodoro-pause').classList.add('hidden');
        
        this.updateDisplay();
        this.updateStatus();
        this.saveState();
    }

    tick() {
        if (this.state.timeRemaining > 0) {
            this.state.timeRemaining--;
            this.updateDisplay();
            this.saveState();
        } else {
            this.onSessionComplete();
        }
    }

    onSessionComplete() {
        this.playNotification();
        
        if (!this.state.isBreak) {
            // Work session completed
            this.state.currentSession++;
            this.state.totalWorkSessions++;
            
            // Log this session
            this.logWorkSession();
            
            // Check if it's time for long break
            const isLongBreak = this.state.currentSession % this.state.sessionsUntilLongBreak === 0;
            
            if (isLongBreak) {
                this.state.timeRemaining = this.state.longBreakDuration * 60;
                this.showToast('Great job! Time for a long break! 🎉', 'success');
            } else {
                this.state.timeRemaining = this.state.breakDuration * 60;
                this.showToast('Work session complete! Take a short break. ☕', 'success');
            }
            
            this.state.isBreak = true;
        } else {
            // Break completed
            this.state.timeRemaining = this.state.workDuration * 60;
            this.state.isBreak = false;
            this.showToast('Break over! Ready to focus? 🚀', 'info');
        }
        
        this.pause();
        this.updateDisplay();
        this.updateStatus();
        this.saveState();
    }

    logWorkSession() {
        // Auto-log as deep work in current hour
        const now = new Date();
        const hour = now.getHours();
        const dateKey = this.app.getDateKey(now);
        
        // Record session
        this.state.sessionsToday.push({
            timestamp: now.toISOString(),
            duration: this.state.workDuration
        });
        
        // Only auto-log if hour not already logged
        if (!this.app.data[dateKey]) {
            this.app.data[dateKey] = {};
        }
        
        if (!this.app.data[dateKey][hour]) {
            this.app.data[dateKey][hour] = {
                category: 'DEEP_WORK',
                note: `Pomodoro session (${this.state.workDuration} min)`
            };
            this.app.saveData();
            this.app.renderDailyView();
        }
    }

    updateDisplay() {
        const minutes = Math.floor(this.state.timeRemaining / 60);
        const seconds = this.state.timeRemaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const timeEl = document.getElementById('pomodoro-time');
        if (timeEl) timeEl.textContent = timeString;
        
        // Update progress ring
        const totalSeconds = this.state.isBreak 
            ? (this.state.currentSession % this.state.sessionsUntilLongBreak === 0 
                ? this.state.longBreakDuration : this.state.breakDuration) * 60
            : this.state.workDuration * 60;
        
        const progress = (this.state.timeRemaining / totalSeconds) * 226; // circumference
        const progressEl = document.getElementById('pomodoro-progress');
        if (progressEl) {
            progressEl.style.strokeDashoffset = 226 - progress;
        }
        
        // Update session counter
        const sessionEl = document.getElementById('pomodoro-session');
        if (sessionEl) {
            sessionEl.textContent = `Session ${this.state.currentSession % this.state.sessionsUntilLongBreak}/${this.state.sessionsUntilLongBreak}`;
        }
    }

    updateStatus() {
        const statusEl = document.getElementById('pomodoro-status');
        if (!statusEl) return;
        
        if (this.state.isRunning) {
            statusEl.textContent = this.state.isBreak ? '☕ Break time' : '🎯 Focus mode';
            statusEl.style.color = this.state.isBreak ? 'hsl(var(--color-success))' : 'hsl(var(--color-primary))';
        } else if (this.state.isPaused) {
            statusEl.textContent = '⏸️ Paused';
            statusEl.style.color = 'hsl(var(--foreground-muted))';
        } else {
            statusEl.textContent = 'Ready to focus';
            statusEl.style.color = 'hsl(var(--foreground-muted))';
        }
    }

    playNotification() {
        if (!this.state.soundEnabled) return;
        
        // Simple beep using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Audio notification failed:', e);
        }
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('pyTron Pomodoro', {
                body: this.state.isBreak ? 'Break time is over!' : 'Work session complete!',
                icon: '/icons/icon-192.png',
                badge: '/icons/icon-72.png'
            });
        }
    }

    showSettings() {
        // Create modal for Pomodoro settings
        let modal = document.getElementById('pomodoro-settings-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'pomodoro-settings-modal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>⏱️ Pomodoro Settings</h3>
                        <button class="modal-close" onclick="document.getElementById('pomodoro-settings-modal').classList.add('hidden')">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold mb-2">Work Duration (minutes)</label>
                            <input type="number" id="pomodoro-work-duration" class="settings-input" value="${this.state.workDuration}" min="1" max="60">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold mb-2">Break Duration (minutes)</label>
                            <input type="number" id="pomodoro-break-duration" class="settings-input" value="${this.state.breakDuration}" min="1" max="30">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold mb-2">Long Break (minutes)</label>
                            <input type="number" id="pomodoro-long-break" class="settings-input" value="${this.state.longBreakDuration}" min="1" max="60">
                        </div>
                        <div class="mb-4">
                            <label class="flex items-center gap-2">
                                <input type="checkbox" id="pomodoro-sound" ${this.state.soundEnabled ? 'checked' : ''}>
                                <span class="text-sm">Enable sound notifications</span>
                            </label>
                        </div>
                        <button class="btn-primary w-full" onclick="window.pomodoroTimer.saveSettings()">
                            Save Settings
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            lucide.createIcons();
        }
        modal.classList.remove('hidden');
    }

    saveSettings() {
        const workDuration = parseInt(document.getElementById('pomodoro-work-duration').value);
        const breakDuration = parseInt(document.getElementById('pomodoro-break-duration').value);
        const longBreakDuration = parseInt(document.getElementById('pomodoro-long-break').value);
        const soundEnabled = document.getElementById('pomodoro-sound').checked;
        
        this.state.workDuration = workDuration;
        this.state.breakDuration = breakDuration;
        this.state.longBreakDuration = longBreakDuration;
        this.state.soundEnabled = soundEnabled;
        
        // Reset timer with new duration
        this.reset();
        
        this.saveState();
        document.getElementById('pomodoro-settings-modal').classList.add('hidden');
        this.showToast('Settings saved!', 'success');
    }

    showToast(message, type = 'info') {
        if (this.app && this.app.showToast) {
            this.app.showToast(message, type);
        }
    }

    getTodayStats() {
        const today = this.app.getDateKey(new Date());
        const todaySessions = this.state.sessionsToday.filter(s => 
            s.timestamp.startsWith(today)
        );
        
        return {
            sessionsCompleted: todaySessions.length,
            totalMinutes: todaySessions.reduce((sum, s) => sum + s.duration, 0)
        };
    }
}
