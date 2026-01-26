// --- DailyTracker Premium Application ---
const STORAGE_KEY = 'daily_tracker_data_v1';

// Global Error Handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error(`Error: ${msg}\nLine: ${lineNo}`);
    return false;
};

class DailyTracker {
    constructor() {
        try {
            this.currentDate = this.getDateKey(new Date());
            this.data = this.loadData();
            this.tasks = this.loadTasks();
            this.settings = this.loadSettings();
            this.charts = {};
            
            this.init();
        } catch (e) {
            console.error('Initialization Failed:', e);
        }
    }

    // Generate YYYY-MM-DD in Local Timezone
    getDateKey(date) {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    }

    init() {
        // Initialize in order
        try { this.initViews(); } catch(e) { console.error('View Init Failed', e); }
        try { this.initSettings(); } catch(e) { console.error('Settings Init Failed', e); }
        try { this.initTasks(); } catch(e) { console.error('Tasks Init Failed', e); }
        try { this.renderDailyView(); } catch(e) { console.error('Daily View Render Failed', e); }
        try { this.renderDashboard(); } catch(e) { console.error('Dashboard Render Failed', e); }
        try { this.initModal(); } catch(e) { console.error('Modal Init Failed', e); }
        try { this.updateWelcomeHeader(); } catch(e) { console.error('Welcome Header Failed', e); }

        // Charts last (heavy)
        setTimeout(() => {
            try { this.initCharts(); } catch(e) { 
                console.error('Chart Init Failed', e); 
            }
        }, 100);
    }

    loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
    }

    loadTasks() {
        const stored = localStorage.getItem(STORAGE_KEY + '_tasks');
        return stored ? JSON.parse(stored) : [];
    }

    loadSettings() {
        const stored = localStorage.getItem(STORAGE_KEY + '_settings');
        return stored ? JSON.parse(stored) : { 
            targetHours: 8, 
            streakThreshold: 80,
            userName: ''
        };
    }

    saveSettings() {
        localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(this.settings));
        this.updateWelcomeHeader();
        this.renderDashboard();
    }

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.renderDashboard();
    }

    saveTasks() {
        localStorage.setItem(STORAGE_KEY + '_tasks', JSON.stringify(this.tasks));
        this.renderDashboard();
    }

    getTodayLog() {
        if (!this.data[this.currentDate]) {
            this.data[this.currentDate] = {};
        }
        return this.data[this.currentDate];
    }

    logHour(hour, category, note) {
        const today = this.getTodayLog();
        today[hour] = { category, note };
        this.saveData();
        this.renderDailyView();
        this.closeModal();
    }

    // --- Welcome Header & Avatar ---
    updateWelcomeHeader() {
        const userName = this.settings.userName || 'Champion';
        const avatarStyle = this.settings.avatarStyle || 'initials';
        
        const welcomeEl = document.getElementById('header-user-name');
        const userInitialEl = document.getElementById('user-initial');
        const sidebarNameEl = document.getElementById('user-name');
        const avatarImg = document.getElementById('user-avatar-img');
        
        if (welcomeEl) welcomeEl.textContent = userName;
        if (sidebarNameEl) sidebarNameEl.textContent = userName;

        // Handle avatar
        if (avatarStyle === 'initials') {
            // Show initial, hide image
            if (userInitialEl) {
                userInitialEl.textContent = userName.charAt(0).toUpperCase();
                userInitialEl.style.display = 'flex';
            }
            if (avatarImg) avatarImg.style.display = 'none';
        } else {
            // Show generated avatar image
            if (userInitialEl) userInitialEl.style.display = 'none';
            if (avatarImg) {
                avatarImg.src = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodeURIComponent(userName)}`;
                avatarImg.style.display = 'block';
            }
        }

        // Update greeting based on time of day
        const hour = new Date().getHours();
        const welcomeMsgEl = document.getElementById('welcome-message');
        let greeting = 'Welcome back';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 17) greeting = 'Good afternoon';
        else greeting = 'Good evening';
        
        if (welcomeMsgEl) {
            welcomeMsgEl.innerHTML = `${greeting}, <span class="gradient-text" id="header-user-name">${userName}</span>`;
        }
    }

    // --- Tasks Logic ---
    initTasks() {
        const input = document.getElementById('new-task-input');
        const addBtn = document.getElementById('add-task-btn');
        
        const handleAdd = () => {
            const text = input.value.trim();
            if (text) {
                this.addTask(text);
                input.value = '';
            }
        };

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleAdd();
            });
        }

        if (addBtn) {
            addBtn.addEventListener('click', handleAdd);
        }

        this.initCustomDropdowns();
        this.renderTasksView();
    }

    initCustomDropdowns() {
        const dropdowns = document.querySelectorAll('.custom-dropdown');
        
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const items = dropdown.querySelectorAll('.dropdown-item');
            const valueDisplay = dropdown.querySelector('.dropdown-value');
            const targetId = dropdown.dataset.target;
            const hiddenInput = document.getElementById(targetId);
            
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                        if (d !== dropdown) d.classList.remove('open');
                    });
                    dropdown.classList.toggle('open');
                });
            }
            
            items.forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.dataset.value;
                    const text = item.textContent.trim();
                    
                    if (valueDisplay) valueDisplay.textContent = text;
                    if (hiddenInput) hiddenInput.value = value;
                    
                    items.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    dropdown.classList.remove('open');
                });
            });
        });
        
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
            document.querySelectorAll('.custom-time-picker.open').forEach(d => d.classList.remove('open'));
        });

        this.initTimePickers();
        lucide.createIcons();
    }

    initTimePickers() {
        const pickers = document.querySelectorAll('.custom-time-picker');
        
        pickers.forEach(picker => {
            const trigger = picker.querySelector('.time-trigger');
            const options = picker.querySelectorAll('.time-option');
            const valueDisplay = picker.querySelector('.time-value');
            const targetId = picker.dataset.target;
            const hiddenInput = document.getElementById(targetId);
            
            if (trigger) {
                trigger.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('.custom-time-picker.open').forEach(p => {
                        if (p !== picker) p.classList.remove('open');
                    });
                    document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
                    picker.classList.toggle('open');
                });
            }
            
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const hour = option.dataset.hour;
                    const text = option.textContent.trim();
                    
                    if (valueDisplay) valueDisplay.textContent = text;
                    if (hiddenInput) hiddenInput.value = `${hour}:00`;
                    
                    options.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    picker.classList.remove('open');
                });
            });
        });
    }

    addTask(text) {
        const dueTime = document.getElementById('task-due-time')?.value || '';
        const priority = document.getElementById('task-priority')?.value || '';
        const duration = document.getElementById('task-duration')?.value || '';
        const tag = document.getElementById('task-tag')?.value || '';

        const task = {
            id: Date.now(),
            text: text,
            completed: false,
            completedAt: null,
            dueTime: dueTime,
            priority: priority,
            duration: duration,
            tag: tag
        };
        this.tasks.push(task);
        this.saveTasks();
        
        // Reset form
        ['task-due-time', 'task-priority', 'task-duration', 'task-tag'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        
        // Reset dropdown displays
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            const valueDisplay = dropdown.querySelector('.dropdown-value');
            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(i => i.classList.remove('selected'));
            items[0]?.classList.add('selected');
            if (valueDisplay && items[0]) valueDisplay.textContent = items[0].textContent.trim();
        });

        // Reset time picker
        document.querySelectorAll('.custom-time-picker').forEach(picker => {
            const valueDisplay = picker.querySelector('.time-value');
            if (valueDisplay) valueDisplay.textContent = '--:--';
        });
        
        this.renderTasksView();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? this.getDateKey(new Date()) : null;
            this.saveTasks();
            this.renderTasksView();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasksView();
    }

    renderTasksView() {
        const container = document.getElementById('tasks-list-container');
        if (!container) return;
        container.innerHTML = '';

        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });

        // Update completed count
        const tasksCompletedEl = document.getElementById('tasks-completed-count');
        if (tasksCompletedEl) {
            tasksCompletedEl.textContent = this.tasks.filter(t => t.completed).length;
        }

        if (sortedTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i data-lucide="check-circle-2"></i>
                    </div>
                    <p class="empty-state-text">No tasks yet. Add one to get started!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        sortedTasks.forEach((task, index) => {
            const el = document.createElement('div');
            el.className = 'task-item';
            el.style.animationDelay = `${index * 0.05}s`;
            
            let badgesHtml = '';
            
            if (task.dueTime) {
                const [h, m] = task.dueTime.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                badgesHtml += `<span class="task-badge badge-time"><i data-lucide="clock" size="10"></i> ${hour12}:${m || '00'} ${ampm}</span>`;
            }
            
            if (task.priority) {
                const priorityLabels = { low: 'Low', medium: 'Med', high: 'High' };
                badgesHtml += `<span class="task-badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>`;
            }
            
            if (task.duration) {
                const mins = parseInt(task.duration);
                const label = mins >= 60 ? `${mins/60}h` : `${mins}m`;
                badgesHtml += `<span class="task-badge badge-duration"><i data-lucide="timer" size="10"></i> ${label}</span>`;
            }
            
            if (task.tag) {
                badgesHtml += `<span class="task-badge badge-tag-${task.tag}">${task.tag}</span>`;
            }
            
            el.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    ${badgesHtml ? `<div class="task-badges">${badgesHtml}</div>` : ''}
                </div>
                <button class="delete-task-btn">
                    <i data-lucide="trash-2" size="16"></i>
                </button>
            `;

            const checkbox = el.querySelector('.task-checkbox');
            checkbox.onclick = () => this.toggleTask(task.id);

            const deleteBtn = el.querySelector('.delete-task-btn');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                this.deleteTask(task.id);
            };

            container.appendChild(el);
        });
        
        lucide.createIcons();
    }

    // --- Views ---
    initViews() {
        const navItems = document.querySelectorAll('.nav-item[data-view]');
        const quickActions = document.querySelectorAll('[data-view]');
        
        const views = {
            'dashboard': document.getElementById('view-dashboard'),
            'tasks': document.getElementById('view-tasks'),
            'daily': document.getElementById('view-daily'),
            'settings': document.getElementById('view-settings')
        };

        // Date Display
        const dateDisplay = document.getElementById('current-date-display');
        if (dateDisplay) {
            const dateSpan = dateDisplay.querySelector('span') || dateDisplay;
            dateSpan.textContent = new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        const switchView = (viewName) => {
            if (views[viewName]) {
                // Update Nav
                navItems.forEach(nav => nav.classList.remove('active'));
                const activeNav = document.querySelector(`.nav-item[data-view="${viewName}"]`);
                if (activeNav) activeNav.classList.add('active');

                // Update Views
                Object.values(views).forEach(el => el && el.classList.add('hidden'));
                views[viewName].classList.remove('hidden');

                // Update Header
                this.updateHeaderForView(viewName);
            } else if (viewName === 'ai-coach') {
                alert('AI Coach coming soon! 🤖');
            }
        };

        // Nav items
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const viewName = item.dataset.view;
                switchView(viewName);
            });
        });

        // Quick action cards
        quickActions.forEach(item => {
            if (!item.classList.contains('nav-item')) {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const viewName = item.dataset.view;
                    switchView(viewName);
                });
            }
        });
    }

    updateHeaderForView(viewName) {
        const header = document.getElementById('page-header');
        const quickStats = document.getElementById('quick-stats');
        
        if (viewName === 'dashboard') {
            if (header) header.style.display = 'block';
            if (quickStats) quickStats.style.display = 'flex';
        } else {
            if (quickStats) quickStats.style.display = 'none';
        }
    }

    // --- Daily View ---
    renderDailyView() {
        const container = document.getElementById('hour-stack');
        if (!container) return;
        container.innerHTML = '';
        
        const todayData = this.getTodayLog();
        const now = new Date();
        const currentHour = now.getHours();

        for (let i = 0; i < 24; i++) {
            const hour = i;
            const log = todayData[hour];
            const isLogged = !!log;
            const isFuture = hour > currentHour;

            const timeLabel = new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            const box = document.createElement('div');
            box.className = `hour-box ${isLogged ? log.category.toLowerCase().replace('_', '-') : ''} ${isFuture ? 'future' : ''}`;
            
            if (!isFuture) {
                box.onclick = () => this.openModal(hour, log);
            } else {
                box.title = "Cannot log future hours";
            }

            let contentHtml = '';
            if (isLogged) {
                const icon = this.getCategoryIcon(log.category);
                const colorVar = this.getCategoryColorVar(log.category);
                contentHtml = `
                    <div class="hour-content">
                        <div style="width: 2.25rem; height: 2.25rem; border-radius: 10px; background: hsl(var(--color-${colorVar}) / 0.15); display: flex; align-items: center; justify-content: center; color: hsl(var(--color-${colorVar}));">
                            <i data-lucide="${icon}" style="width: 18px; height: 18px;"></i>
                        </div>
                        <div style="flex: 1;">
                            <p style="font-weight: 600; font-size: 0.9375rem; color: hsl(var(--foreground));">${this.formatCategory(log.category)}</p>
                            ${log.note ? `<p style="font-size: 0.8125rem; color: hsl(var(--foreground-muted)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">${log.note}</p>` : ''}
                        </div>
                    </div>
                `;
            } else {
                contentHtml = `<div class="hour-content empty">Click to log activity...</div>`;
            }

            box.innerHTML = `
                <div class="hour-time">${timeLabel}</div>
                ${contentHtml}
            `;

            // Current time indicator
            if (hour === currentHour) {
                const minutes = now.getMinutes();
                const percent = (minutes / 60) * 100;
                
                const line = document.createElement('div');
                line.className = 'current-time-line';
                line.style.top = `${percent}%`;
                box.appendChild(line);
            }

            container.appendChild(box);
        }
        
        lucide.createIcons();
    }

    // --- Modal ---
    initModal() {
        const modal = document.getElementById('log-modal');
        const closeBtn = document.getElementById('close-modal');
        const form = document.getElementById('log-form');

        if (closeBtn) closeBtn.onclick = () => this.closeModal();
        
        if (modal) {
            modal.onclick = (e) => {
                if (e.target === modal) this.closeModal();
            };
        }

        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                const hour = document.getElementById('log-hour').value;
                const category = form.querySelector('input[name="category"]:checked').value;
                const note = document.getElementById('log-note').value;
                this.logHour(hour, category, note);
            };
        }
    }

    openModal(hour, existingLog) {
        const modal = document.getElementById('log-modal');
        const hourInput = document.getElementById('log-hour');
        const noteInput = document.getElementById('log-note');
        
        if (hourInput) hourInput.value = hour;
        if (noteInput) noteInput.value = existingLog ? existingLog.note : '';
        
        const category = existingLog ? existingLog.category : 'DEEP_WORK';
        const radio = document.querySelector(`input[name="category"][value="${category}"]`);
        if (radio) radio.checked = true;

        if (modal) modal.classList.remove('hidden');
    }

    closeModal() {
        const modal = document.getElementById('log-modal');
        if (modal) modal.classList.add('hidden');
    }

    // --- Settings ---
    initSettings() {
        const form = document.getElementById('settings-form');
        const userNameInput = document.getElementById('setting-user-name');
        const targetInput = document.getElementById('setting-target-hours');
        const thresholdInput = document.getElementById('setting-streak-threshold');
        const thresholdDisplay = document.getElementById('streak-threshold-value');

        // Load values
        if (userNameInput) userNameInput.value = this.settings.userName || '';
        if (targetInput) targetInput.value = this.settings.targetHours;
        if (thresholdInput) thresholdInput.value = this.settings.streakThreshold;
        if (thresholdDisplay) thresholdDisplay.textContent = `${this.settings.streakThreshold}%`;

        if (thresholdInput) {
            thresholdInput.oninput = (e) => {
                if (thresholdDisplay) thresholdDisplay.textContent = `${e.target.value}%`;
            };
        }

        // Avatar style selection
        const avatarOptions = document.querySelectorAll('input[name="avatar-style"]');
        const savedStyle = this.settings.avatarStyle || 'initials';
        avatarOptions.forEach(option => {
            if (option.value === savedStyle) option.checked = true;
        });

        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                if (userNameInput) this.settings.userName = userNameInput.value.trim();
                if (targetInput) this.settings.targetHours = parseInt(targetInput.value) || 8;
                if (thresholdInput) this.settings.streakThreshold = parseInt(thresholdInput.value) || 80;
                
                // Save avatar style
                const selectedAvatar = document.querySelector('input[name="avatar-style"]:checked');
                if (selectedAvatar) this.settings.avatarStyle = selectedAvatar.value;
                
                this.saveSettings();
                
                // Visual feedback
                const btn = form.querySelector('button[type="submit"]');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<i data-lucide="check" style="width: 18px; height: 18px;"></i> Saved!';
                    btn.style.background = 'hsl(var(--color-success))';
                    lucide.createIcons();
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                        lucide.createIcons();
                    }, 2000);
                }
            };
        }
    }

    // --- Dashboard ---
    renderDashboard() {
        const todayData = this.getTodayLog();
        let deepWorkHours = 0;
        let totalLogged = 0;
        let efficiencyPoints = 0;
        
        const counts = { DEEP_WORK: 0, SHALLOW: 0, DISTRACTION: 0, REST: 0, SLEEP: 0, EXERCISE: 0 };
        
        Object.values(todayData).forEach(log => {
            totalLogged++;
            if (counts[log.category] !== undefined) counts[log.category]++;
            
            if (log.category === 'DEEP_WORK') {
                deepWorkHours++;
                efficiencyPoints += 100;
            } else if (log.category === 'SHALLOW') {
                efficiencyPoints += 50;
            } else if (log.category === 'DISTRACTION') {
                efficiencyPoints -= 50;
            } else if (log.category === 'SLEEP') {
                totalLogged--;
            } else if (log.category === 'EXERCISE') {
                efficiencyPoints += 50;
            }
        });

        const efficiency = totalLogged > 0 ? Math.max(0, Math.round(efficiencyPoints / totalLogged)) : 0;
        
        // Tasks completed today
        const todayKey = this.getDateKey(new Date());
        const tasksCompletedToday = this.tasks.filter(t => t.completed && t.completedAt === todayKey).length;
        const streak = this.calculateStreak();

        // Animate stats
        this.animateValue('stat-efficiency', efficiency, '%');
        this.animateValue('stat-deep-work', deepWorkHours, 'h');
        this.animateValue('stat-streak', streak, '');
        this.animateValue('stat-tasks', tasksCompletedToday, '');

        // Quick stats
        const totalHoursLogged = Object.keys(this.data).reduce((acc, date) => {
            return acc + Object.keys(this.data[date]).length;
        }, 0);
        
        this.updateQuickStat('qs-hours', totalHoursLogged);
        this.updateQuickStat('qs-streak', streak);
        this.updateQuickStat('qs-tasks', this.tasks.filter(t => t.completed).length);

        // Progress bar
        const progressBar = document.getElementById('deep-work-progress');
        if (progressBar) {
            const progressPercent = Math.min(100, (deepWorkHours / this.settings.targetHours) * 100);
            progressBar.style.width = `${progressPercent}%`;
        }

        // Update target hours display
        const targetDisplay = document.getElementById('deep-work-target');
        if (targetDisplay) targetDisplay.textContent = `/ ${this.settings.targetHours}h`;

        // Streak label
        const streakLabel = document.getElementById('stat-streak-label');
        if (streakLabel) streakLabel.textContent = `Days above ${this.settings.streakThreshold}%`;

        // Update charts
        const weeklyStats = this.getWeeklyStats();
        this.updateCharts(counts, weeklyStats);
    }

    animateValue(elementId, endValue, suffix) {
        const el = document.getElementById(elementId);
        if (!el) return;
        
        const startValue = parseInt(el.textContent) || 0;
        const duration = 800;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);
            
            el.textContent = currentValue + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    updateQuickStat(elementId, value) {
        const el = document.getElementById(elementId);
        if (el) el.textContent = value;
    }

    calculateStreak() {
        const sortedDates = Object.keys(this.data).sort((a, b) => new Date(b) - new Date(a));
        if (sortedDates.length === 0) return 0;

        let streak = 0;
        const targetHours = this.settings.targetHours;
        const thresholdPercent = this.settings.streakThreshold / 100;
        const requiredHours = targetHours * thresholdPercent;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 365; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = this.getDateKey(date);
            
            const dayLog = this.data[dateStr];
            if (!dayLog && i === 0) continue;
            if (!dayLog) break;

            let deepWork = 0;
            Object.values(dayLog).forEach(log => {
                if (log.category === 'DEEP_WORK') deepWork++;
            });

            if (deepWork >= requiredHours) {
                streak++;
            } else {
                if (i === 0) continue;
                break;
            }
        }
        return streak;
    }

    initCharts() {
        const weeklyCtx = document.getElementById('weeklyChart')?.getContext('2d');
        const distCtx = document.getElementById('distributionChart')?.getContext('2d');
        
        if (weeklyCtx) {
            this.charts.weekly = new Chart(weeklyCtx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [{
                        label: 'Deep Work Hours',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        backgroundColor: (ctx) => {
                            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
                            gradient.addColorStop(0, 'hsl(18, 75%, 55%)');
                            gradient.addColorStop(1, 'hsl(42, 85%, 55%)');
                            return gradient;
                        },
                        borderRadius: 8,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1000,
                        easing: 'easeOutQuart'
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 12,
                            ticks: {
                                stepSize: 2,
                                callback: (value) => value + 'h',
                                color: 'hsl(25, 10%, 50%)',
                                font: { weight: 500 }
                            },
                            grid: {
                                color: 'hsl(38, 25%, 92%)',
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: {
                                color: 'hsl(25, 10%, 50%)',
                                font: { weight: 500 }
                            }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'hsl(25, 15%, 12%)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            cornerRadius: 8,
                            padding: 12
                        }
                    }
                }
            });
        }

        if (distCtx) {
            this.charts.distribution = new Chart(distCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Deep Work', 'Shallow', 'Distraction', 'Rest', 'Sleep', 'Exercise'],
                    datasets: [{
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: [
                            'hsl(18, 75%, 55%)',
                            'hsl(38, 90%, 55%)',
                            'hsl(0, 65%, 55%)',
                            'hsl(145, 35%, 45%)',
                            'hsl(235, 30%, 35%)',
                            'hsl(28, 95%, 55%)'
                        ],
                        borderWidth: 0,
                        borderRadius: 4,
                        spacing: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '72%',
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                color: 'hsl(25, 10%, 40%)',
                                font: { size: 12, weight: 500 },
                                padding: 16,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'hsl(25, 15%, 12%)',
                            titleColor: 'white',
                            bodyColor: 'white',
                            cornerRadius: 8,
                            padding: 12
                        }
                    }
                }
            });
        }

        // Initial render
        this.renderDashboard();
    }

    updateCharts(counts, weeklyData) {
        if (this.charts.distribution) {
            this.charts.distribution.data.datasets[0].data = [
                counts.DEEP_WORK,
                counts.SHALLOW,
                counts.DISTRACTION,
                counts.REST,
                counts.SLEEP,
                counts.EXERCISE
            ];
            this.charts.distribution.update('none');
        }

        if (this.charts.weekly && weeklyData) {
            this.charts.weekly.data.datasets[0].data = weeklyData;
            this.charts.weekly.update('none');
        }
    }

    getWeeklyStats() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMon);
        
        const weeklyData = [0, 0, 0, 0, 0, 0, 0];
        
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(monday);
            currentDay.setDate(monday.getDate() + i);
            const dateStr = this.getDateKey(currentDay);
            
            const dayLog = this.data[dateStr] || {};
            let deepWorkCount = 0;
            
            Object.values(dayLog).forEach(log => {
                if (log.category === 'DEEP_WORK') deepWorkCount++;
            });
            
            weeklyData[i] = deepWorkCount;
        }
        
        return weeklyData;
    }

    // --- Helpers ---
    getCategoryIcon(cat) {
        const map = {
            'DEEP_WORK': 'zap',
            'SHALLOW': 'check-square',
            'DISTRACTION': 'alert-circle',
            'REST': 'coffee',
            'SLEEP': 'moon',
            'EXERCISE': 'dumbbell'
        };
        return map[cat] || 'circle';
    }

    getCategoryColorVar(cat) {
        const map = {
            'DEEP_WORK': 'primary',
            'SHALLOW': 'warning',
            'DISTRACTION': 'danger',
            'REST': 'accent',
            'SLEEP': 'sleep',
            'EXERCISE': 'exercise'
        };
        return map[cat] || 'primary';
    }

    formatCategory(cat) {
        return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DailyTracker();
});
