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
        const container = document.getElementById('pomodoro-view-container');
        if (!container) {
            console.warn('[Pomodoro] Could not find #pomodoro-view-container');
            return;
        }

        container.innerHTML = `
          <div class="pomo-view-layout">
            <!-- Left: Big ring -->
            <div class="pomo-ring-card glass">
              <div class="pomo-mode-pills" id="pomo-mode-pills">
                <button class="pomo-pill active" data-mode="work">Focus</button>
                <button class="pomo-pill" data-mode="break">Short Break</button>
                <button class="pomo-pill" data-mode="longbreak">Long Break</button>
              </div>

              <div class="pomo-ring-wrap">
                <svg class="pomo-svg" viewBox="0 0 160 160">
                  <defs>
                    <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="hsl(var(--color-primary))" />
                      <stop offset="100%" stop-color="hsl(var(--color-secondary))" />
                    </linearGradient>
                  </defs>
                  <circle cx="80" cy="80" r="68" class="pomo-ring-track" />
                  <circle cx="80" cy="80" r="68" class="pomo-ring-fill" id="pomodoro-progress" />
                </svg>
                <div class="pomo-ring-inner">
                  <div class="pomo-time" id="pomodoro-time">25:00</div>
                  <div class="pomo-label" id="pomodoro-status">Ready to focus</div>
                </div>
              </div>

              <div class="pomo-controls">
                <button class="pomo-ctrl-btn pomo-ctrl-reset" id="pomodoro-reset" title="Reset">
                  <i data-lucide="rotate-ccw"></i>
                </button>
                <button class="pomo-ctrl-btn pomo-ctrl-play" id="pomodoro-start" title="Start">
                  <i data-lucide="play"></i>
                </button>
                <button class="pomo-ctrl-btn pomo-ctrl-play hidden" id="pomodoro-pause" title="Pause">
                  <i data-lucide="pause"></i>
                </button>
                <button class="pomo-ctrl-btn pomo-ctrl-settings" id="pomodoro-settings" title="Settings">
                  <i data-lucide="settings-2"></i>
                </button>
              </div>

              <div class="pomo-session-dots" id="pomodoro-session">
                Session 0/4
              </div>
            </div>

            <!-- Right: Stats -->
            <div class="pomo-stats-col">
              <div class="pomo-stat-card glass">
                <div class="pomo-stat-icon primary"><i data-lucide="zap"></i></div>
                <div>
                  <div class="pomo-stat-value" id="pomo-today-sessions">0</div>
                  <div class="pomo-stat-label">Sessions Today</div>
                </div>
              </div>
              <div class="pomo-stat-card glass">
                <div class="pomo-stat-icon success"><i data-lucide="clock"></i></div>
                <div>
                  <div class="pomo-stat-value" id="pomo-today-minutes">0m</div>
                  <div class="pomo-stat-label">Focus Time Today</div>
                </div>
              </div>
              <div class="pomo-stat-card glass">
                <div class="pomo-stat-icon accent"><i data-lucide="flame"></i></div>
                <div>
                  <div class="pomo-stat-value" id="pomo-total-sessions">0</div>
                  <div class="pomo-stat-label">Total Sessions</div>
                </div>
              </div>

              <div class="pomo-tip-card glass">
                <div class="pomo-tip-title"><i data-lucide="lightbulb" style="width:14px;height:14px"></i> Focus tip</div>
                <p class="pomo-tip-text" id="pomo-tip">Work in 25-minute sprints for peak concentration. Your brain thrives on focused bursts.</p>
              </div>
            </div>
          </div>
        `;

        // Mode pill switching
        container.querySelectorAll('.pomo-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                container.querySelectorAll('.pomo-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const mode = pill.dataset.mode;
                if (mode === 'work') {
                    this.state.isBreak = false;
                    this.state.timeRemaining = this.state.workDuration * 60;
                } else if (mode === 'break') {
                    this.state.isBreak = true;
                    this.state.timeRemaining = this.state.breakDuration * 60;
                } else {
                    this.state.isBreak = true;
                    this.state.timeRemaining = this.state.longBreakDuration * 60;
                }
                this.reset();
            });
        });

        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
        this.updateStatsDisplay();
        console.log('[Pomodoro] View section created successfully');
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
        
        // Circumference for r=68: 2*π*68 ≈ 427.3
        const circ = 427.3;
        const progress = (this.state.timeRemaining / totalSeconds) * circ;
        const progressEl = document.getElementById('pomodoro-progress');
        if (progressEl) {
            progressEl.style.strokeDasharray = circ;
            progressEl.style.strokeDashoffset = circ - progress;
        }
        
        // Update session counter
        const sessionEl = document.getElementById('pomodoro-session');
        if (sessionEl) {
            const sessNum = this.state.currentSession % this.state.sessionsUntilLongBreak;
            sessionEl.textContent = `Session ${sessNum}/${this.state.sessionsUntilLongBreak}`;
        }

        this.updateStatsDisplay();
    }

    updateStatsDisplay() {
        const stats = this.getTodayStats();
        const todayEl = document.getElementById('pomo-today-sessions');
        const minsEl = document.getElementById('pomo-today-minutes');
        const totalEl = document.getElementById('pomo-total-sessions');
        if (todayEl) todayEl.textContent = stats.sessionsCompleted;
        if (minsEl) minsEl.textContent = stats.totalMinutes + 'm';
        if (totalEl) totalEl.textContent = this.state.totalWorkSessions;
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
