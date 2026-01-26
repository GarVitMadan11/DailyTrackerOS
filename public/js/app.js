// --- Application Logic ---
const STORAGE_KEY = 'daily_tracker_data_v1';

// Global Error Handler for Manual Testing
window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert(`Error: ${msg}\nLine: ${lineNo}`);
    return false;
};

class DailyTracker {
    constructor() {
        try {
            this.currentDate = this.getDateKey(new Date()); // Use local date key
            this.data = this.loadData();
            this.tasks = this.loadTasks(); // Load tasks
            this.settings = this.loadSettings();
            this.charts = {};
            
            this.init();
        } catch (e) {
            alert('Initialization Failed: ' + e.message);
        }
    }

    // Generate YYYY-MM-DD in Local Timezone
    getDateKey(date) {
        const offset = date.getTimezoneOffset();
        const local = new Date(date.getTime() - (offset * 60 * 1000));
        return local.toISOString().split('T')[0];
    }

    init() {
        // 1. Views first (Critical for UI)
        try { this.initViews(); } catch(e) { console.error('View Init Failed', e); }
        
        // 2. Settings
        try { this.initSettings(); } catch(e) { console.error('Settings Init Failed', e); }

        // 2.5 Tasks (Sidebar)
        try { this.initTasks(); } catch(e) { console.error('Tasks Init Failed', e); }
        
        // 3. Render Initial State
        try { this.renderDailyView(); } catch(e) { console.error('Daily View Render Failed', e); }
        try { this.renderDashboard(); } catch(e) { console.error('Dashboard Render Failed', e); }
        try { this.initModal(); } catch(e) { console.error('Modal Init Failed', e); }

        // 4. Heavy/External stuff last
        try { this.initCharts(); } catch(e) { 
            console.error('Chart Init Failed', e); 
            // Silent fail for charts, don't break app
        }
    }

    loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        // Initialize if empty
        if (!stored) return {};
        return JSON.parse(stored);
    }

    loadTasks() {
        const stored = localStorage.getItem(STORAGE_KEY + '_tasks');
        return stored ? JSON.parse(stored) : [];
    }

    loadSettings() {
        const stored = localStorage.getItem(STORAGE_KEY + '_settings');
        return stored ? JSON.parse(stored) : { targetHours: 4, streakThreshold: 80 };
    }

    saveSettings() {
        localStorage.setItem(STORAGE_KEY + '_settings', JSON.stringify(this.settings));
        this.renderDashboard();
    }

    saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.renderDashboard(); // Update stats whenever data changes
    }

    saveTasks() {
        localStorage.setItem(STORAGE_KEY + '_tasks', JSON.stringify(this.tasks));
        this.renderDashboard(); // Update counts
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

    // --- Tasks Logic (Dedicated View) ---
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

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAdd();
        });

        addBtn.addEventListener('click', handleAdd);

        // Initialize custom dropdowns
        this.initCustomDropdowns();

        this.renderTasksView();
    }

    initCustomDropdowns() {
        const dropdowns = document.querySelectorAll('.custom-dropdown');
        
        dropdowns.forEach(dropdown => {
            const trigger = dropdown.querySelector('.dropdown-trigger');
            const menu = dropdown.querySelector('.dropdown-menu');
            const items = dropdown.querySelectorAll('.dropdown-item');
            const valueDisplay = dropdown.querySelector('.dropdown-value');
            const targetId = dropdown.dataset.target;
            const hiddenInput = document.getElementById(targetId);
            
            // Toggle dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other dropdowns
                document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                    if (d !== dropdown) d.classList.remove('open');
                });
                dropdown.classList.toggle('open');
            });
            
            // Select item
            items.forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.dataset.value;
                    const text = item.textContent.trim();
                    
                    // Update display
                    valueDisplay.textContent = text;
                    
                    // Update hidden input
                    if (hiddenInput) hiddenInput.value = value;
                    
                    // Mark selected
                    items.forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                    
                    // Close dropdown
                    dropdown.classList.remove('open');
                });
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                d.classList.remove('open');
            });
            document.querySelectorAll('.custom-time-picker.open').forEach(d => {
                d.classList.remove('open');
            });
        });

        // Initialize custom time pickers
        this.initTimePickers();

        // Re-initialize icons for dropdown arrows
        lucide.createIcons();
    }

    initTimePickers() {
        const pickers = document.querySelectorAll('.custom-time-picker');
        
        pickers.forEach(picker => {
            const trigger = picker.querySelector('.time-trigger');
            const menu = picker.querySelector('.time-menu');
            const options = picker.querySelectorAll('.time-option');
            const valueDisplay = picker.querySelector('.time-value');
            const clearBtn = picker.querySelector('.time-clear');
            const targetId = picker.dataset.target;
            const hiddenInput = document.getElementById(targetId);
            
            // Toggle picker
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.custom-time-picker.open').forEach(p => {
                    if (p !== picker) p.classList.remove('open');
                });
                document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                    d.classList.remove('open');
                });
                picker.classList.toggle('open');
            });
            
            // Select time option
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const hour = option.dataset.hour;
                    const text = option.textContent.trim();
                    
                    valueDisplay.textContent = text;
                    if (hiddenInput) hiddenInput.value = `${hour}:00`;
                    
                    options.forEach(o => o.classList.remove('selected'));
                    option.classList.add('selected');
                    
                    picker.classList.remove('open');
                });
            });
            
            // Clear button
            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    valueDisplay.textContent = '--:--';
                    if (hiddenInput) hiddenInput.value = '';
                    options.forEach(o => o.classList.remove('selected'));
                    picker.classList.remove('open');
                });
            }
        });
    }

    addTask(text) {
        // Get optional properties from form
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
        
        // Reset form options
        if (document.getElementById('task-due-time')) document.getElementById('task-due-time').value = '';
        if (document.getElementById('task-priority')) document.getElementById('task-priority').value = '';
        if (document.getElementById('task-duration')) document.getElementById('task-duration').value = '';
        if (document.getElementById('task-tag')) document.getElementById('task-tag').value = '';
        
        // Reset custom dropdown displays
        document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
            const valueDisplay = dropdown.querySelector('.dropdown-value');
            const items = dropdown.querySelectorAll('.dropdown-item');
            items.forEach(i => i.classList.remove('selected'));
            items[0]?.classList.add('selected');
            if (valueDisplay && items[0]) valueDisplay.textContent = items[0].textContent.trim();
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
        if (!container) return; // Guard
        container.innerHTML = '';

        // Sort: Incomplete first, then completed
        const sortedTasks = [...this.tasks].sort((a, b) => {
            if (a.completed === b.completed) return 0;
            return a.completed ? 1 : -1;
        });

        if (sortedTasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">
                        <i data-lucide="check-square" size="24"></i>
                    </div>
                    <p class="empty-state-text">No tasks yet. Stay focused!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        sortedTasks.forEach(task => {
            const el = document.createElement('div');
            el.className = 'task-item';
            
            // Build badges HTML
            let badgesHtml = '';
            
            if (task.dueTime) {
                const [h, m] = task.dueTime.split(':');
                const hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                const hour12 = hour % 12 || 12;
                badgesHtml += `<span class="task-badge badge-time"><i data-lucide="clock" size="12"></i> ${hour12}:${m} ${ampm}</span>`;
            }
            
            if (task.priority) {
                badgesHtml += `<span class="task-badge badge-priority-${task.priority}">${task.priority}</span>`;
            }
            
            if (task.duration) {
                const mins = parseInt(task.duration);
                const label = mins >= 60 ? `${mins/60}h` : `${mins}m`;
                badgesHtml += `<span class="task-badge badge-duration"><i data-lucide="timer" size="12"></i> ${label}</span>`;
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

            // Event Listeners
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
        const navItems = document.querySelectorAll('.nav-item');
        const views = {
            'Dashboard': document.getElementById('view-dashboard'),
            'Tasks': document.getElementById('view-tasks'),
            'Daily View': document.getElementById('view-daily'),
            'Settings': document.getElementById('view-settings')
        };

        // Date Display
        document.getElementById('current-date-display').textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Check if it's the Tasks section (which is in nav but not a link) or just ignore clicks on non-a tags
                if (item.tagName !== 'A') return;

                const targetName = item.querySelector('span').textContent.trim();

                if (views[targetName]) {
                    // Update Nav
                    navItems.forEach(nav => {
                        if (nav.tagName === 'A') nav.classList.remove('active')
                    });
                    item.classList.add('active');

                    // Update View
                    Object.values(views).forEach(el => el && el.classList.add('hidden'));
                    views[targetName].classList.remove('hidden');
                } else {
                    // Fallback for 'AI Coach' etc
                    alert(`${targetName} is coming soon!`);
                }
            });
        });
    }

    // --- Daily View (Stack of Boxes) ---
    renderDailyView() {
        const container = document.getElementById('hour-stack');
        container.innerHTML = '';
        const todayData = this.getTodayLog();
        const now = new Date();
        const currentHour = now.getHours();

        for (let i = 0; i < 24; i++) {
            const hour = i;
            const log = todayData[hour];
            const isLogged = !!log;
            
            // Check if future
            const isFuture = hour > currentHour;

            // Format time (e.g., 09:00 AM)
            const timeLabel = new Date(0, 0, 0, hour).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const box = document.createElement('div');
            // Add 'future' class if applicable
            box.className = `hour-box ${isLogged ? log.category.toLowerCase().replace('_', '-') : ''} ${isFuture ? 'future' : ''}`;
            
            // Only allow click if not future
            if (!isFuture) {
                box.onclick = () => this.openModal(hour, log);
            } else {
                box.title = "Cannot log future hours";
            }

            let contentHtml = '';
            if (isLogged) {
                const icon = this.getCategoryIcon(log.category);
                contentHtml = `
                    <div class="p-2 rounded-lg bg-white/50 text-[hsl(var(--color-${this.getCategoryColorVar(log.category)}))]">
                        <i data-lucide="${icon}" size="18"></i>
                    </div>
                    <div>
                        <p class="text-sm font-bold text-foreground">${this.formatCategory(log.category)}</p>
                        ${log.note ? `<p class="text-xs text-muted truncate">${log.note}</p>` : ''}
                    </div>
                `;
            } else {
                contentHtml = `<div class="hour-content empty">Log activity...</div>`;
            }

            box.innerHTML = `
                <div class="hour-time">${timeLabel}</div>
                ${contentHtml}
            `;

            // Add Current Time Line
            const now = new Date();
            if (hour === now.getHours()) {
                const minutes = now.getMinutes();
                const percent = (minutes / 60) * 100;
                
                const line = document.createElement('div');
                line.className = 'current-time-line';
                line.style.top = `${percent}%`;
                line.title = `Current Time: ${now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
                box.appendChild(line);
            }

            container.appendChild(box);
        }
        
        // Re-initialize icons
        lucide.createIcons();
    }

    // --- Modal Logic ---
    initModal() {
        const modal = document.getElementById('log-modal');
        const closeBtn = document.getElementById('close-modal');
        const form = document.getElementById('log-form');

        closeBtn.onclick = () => this.closeModal();
        
        // Close on click outside
        modal.onclick = (e) => {
            if (e.target === modal) this.closeModal();
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            const hour = document.getElementById('log-hour').value;
            const category = form.querySelector('input[name="category"]:checked').value;
            const note = document.getElementById('log-note').value;
            
            this.logHour(hour, category, note);
        };
    }

    // --- Settings Logic ---
    initSettings() {
        const form = document.getElementById('settings-form');
        const targetInput = document.getElementById('setting-target-hours');
        const thresholdInput = document.getElementById('setting-streak-threshold');
        const thresholdDisplay = document.getElementById('streak-threshold-value');

        // Load current values
        targetInput.value = this.settings.targetHours;
        thresholdInput.value = this.settings.streakThreshold;
        thresholdDisplay.textContent = `${this.settings.streakThreshold}%`;

        // Update display on slide
        thresholdInput.oninput = (e) => {
            thresholdDisplay.textContent = `${e.target.value}%`;
        };

        form.onsubmit = (e) => {
            e.preventDefault();
            this.settings.targetHours = parseInt(targetInput.value);
            this.settings.streakThreshold = parseInt(thresholdInput.value);
            this.saveSettings();
            
            // Show Feedback (could be a toast, but simple alert/log for now)
            alert('Settings saved!');
        };
    }

    openModal(hour, existingLog) {
        const modal = document.getElementById('log-modal');
        document.getElementById('log-hour').value = hour;
        document.getElementById('log-note').value = existingLog ? existingLog.note : '';
        
        // Select correct radio
        const category = existingLog ? existingLog.category : 'DEEP_WORK';
        const radio = document.querySelector(`input[name="category"][value="${category}"]`);
        if (radio) radio.checked = true;

        modal.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('log-modal').classList.add('hidden');
    }

    // --- Dashboard & Charts ---
    renderDashboard() {
        // Calculate Stats
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
            }
            // Sleep is neutral/excluded from efficiency denominator
            if (log.category === 'SLEEP') {
                totalLogged--; 
            } else if (log.category === 'EXERCISE') {
                efficiencyPoints += 50;
            }
        });

        const efficiency = totalLogged > 0 ? Math.max(0, Math.round(efficiencyPoints / totalLogged)) : 0;
        
        // Count Tasks Completed Today
        const todayKey = this.getDateKey(new Date());
        const tasksCompleted = this.tasks.filter(t => t.completed && t.completedAt === todayKey).length;

        // Update DOM
        document.getElementById('stat-deep-work').textContent = `${deepWorkHours}h`;
        document.querySelector('#stat-deep-work + p').textContent = `Target: ${this.settings.targetHours}h`;
        
        document.getElementById('stat-tasks').textContent = tasksCompleted;
        document.getElementById('stat-efficiency').textContent = `${efficiency}%`;
        
        // Dynamic Streak Label
        document.getElementById('stat-streak-label').textContent = `Days above ${this.settings.streakThreshold}%`;
        
        const streak = this.calculateStreak();
        document.getElementById('stat-streak').textContent = streak;

        const weeklyStats = this.getWeeklyStats();
        
        // Update Charts
        this.updateCharts(counts, weeklyStats);
    }

    calculateStreak() {
        // Get all dates with data
        const sortedDates = Object.keys(this.data).sort((a, b) => new Date(b) - new Date(a));
        if (sortedDates.length === 0) return 0;

        let streak = 0;
        const targetHours = this.settings.targetHours;
        const thresholdPercent = this.settings.streakThreshold / 100;
        const requiredHours = targetHours * thresholdPercent;

        // Check from today backwards
        // If today is not in list (not logged yet), check yesterday.
        // But the user might be logging today right now.
        
        // Use a simple day-by-day check starting from today
        const today = new Date();
        today.setHours(0,0,0,0);
        
        for (let i = 0; i < 365; i++) { // Check up to a year back
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateStr = this.getDateKey(date);
            
            const dayLog = this.data[dateStr];
            if (!dayLog && i === 0) continue; // Skip today if empty, don't break streak yet
            if (!dayLog) break; // Break if day is missing (gap)

            // Calculate Deep Work for this day
            let deepWork = 0;
            Object.values(dayLog).forEach(log => {
                if (log.category === 'DEEP_WORK') deepWork++;
            });

            if (deepWork >= requiredHours) {
                streak++;
            } else {
                if (i === 0) continue; // If today fails, it just doesn't add to streak yet (don't reset unless yesterday failed)
                break; 
            }
        }
        return streak;
    }

    initCharts() {
        // ... (existing initCharts code) ...
        const weeklyCtx = document.getElementById('weeklyChart').getContext('2d');
        const distCtx = document.getElementById('distributionChart').getContext('2d');
        
        this.charts.weekly = new Chart(weeklyCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Deep Work',
                    data: [0,0,0,0,0,0,0], 
                    backgroundColor: 'hsl(14, 70%, 60%)',
                    borderRadius: 4
                }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) { return value + 'h'; }
                        },
                        grid: {
                            color: 'hsl(var(--glass-border))'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        this.charts.distribution = new Chart(distCtx, {
            type: 'doughnut',
            data: {
                labels: ['Deep Work', 'Shallow', 'Distraction', 'Rest', 'Sleep', 'Exercise'],
                datasets: [{
                    data: [0,0,0,0,0,0],
                    backgroundColor: [
                        'hsl(14, 70%, 60%)',  // Deep Work
                        'hsl(35, 80%, 60%)',  // Shallow
                        'hsl(5, 60%, 60%)',   // Distraction
                        'hsl(140, 30%, 50%)', // Rest
                        'hsl(220, 20%, 40%)', // Sleep
                        'hsl(25, 90%, 60%)'   // Exercise
                    ],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });
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
            this.charts.distribution.update();
        }

        if (this.charts.weekly && weeklyData) {
            this.charts.weekly.data.datasets[0].data = weeklyData;
            this.charts.weekly.update();
        }
    }

    getWeeklyStats() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 is Sunday
        const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(today);
        monday.setDate(today.getDate() + diffToMon);
        
        const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
        
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
        return map[cat];
    }

    formatCategory(cat) {
        return cat.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    window.app = new DailyTracker();
});
