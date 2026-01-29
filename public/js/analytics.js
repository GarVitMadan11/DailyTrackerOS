class AnalyticsManager {
    constructor(app) {
        this.app = app;
        this.charts = {
            trend: null,
            breakdown: null,
            heatmap: null
        };
        this.timeRange = '7'; // '7', '30'
        
        console.log('[Analytics] Initialized');
        this.bindEvents();
    }

    bindEvents() {
        // Bind range selectors if they exist
        document.querySelectorAll('.analytics-range-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Update active state
                document.querySelectorAll('.analytics-range-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Update range and re-render
                this.timeRange = e.target.dataset.range;
                this.render();
            });
        });
    }

    render() {
        console.log(`[Analytics] Rendering view for last ${this.timeRange} days`);
        const data = this.processData(this.timeRange);
        
        this.renderTrendChart(data);
        this.renderBreakdownChart(data);
        this.renderHeatmap(data);
        this.renderKPIS(data);
    }

    processData(days) {
        const result = {
            labels: [],
            deepWork: [],
            shallowWork: [],
            efficiency: [],
            categoryTotals: { DEEP_WORK: 0, SHALLOW: 0, DISTRACTION: 0, REST: 0, SLEEP: 0, EXERCISE: 0 },
            hourlyDistribution: Array(24).fill(0).map(() => Array(7).fill(0)), // 24 hours x 7 days
            totalDeepWork: 0,
            avgEfficiency: 0,
            totalLogs: 0
        };

        const today = new Date();
        const dates = [];
        
        // Generate dates
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dates.push(d);
            result.labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        let totalEfficiency = 0;
        let daysWithLogs = 0;

        dates.forEach(date => {
            const dateKey = this.app.getDateKey(date);
            const dayLog = this.app.data[dateKey] || {};
            
            let dayDeep = 0;
            let dayShallow = 0;
            let dayPoints = 0;
            let dayCount = 0;

            Object.entries(dayLog).forEach(([hour, entry]) => {
                const h = parseInt(hour);
                
                // Heatmap data (Deep work only)
                if (entry.category === 'DEEP_WORK') {
                    // Map day of week (0-6, Sun-Sat) to our grid (Mon=0, Sun=6)
                    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
                    result.hourlyDistribution[h][dayIndex]++;
                }

                // Category totals
                if (result.categoryTotals[entry.category] !== undefined) {
                    result.categoryTotals[entry.category]++;
                }

                // Daily stats
                dayCount++;
                if (entry.category === 'DEEP_WORK') {
                    dayDeep++;
                    dayPoints += 100;
                } else if (entry.category === 'SHALLOW') {
                    dayShallow++;
                    dayPoints += 50;
                } else if (entry.category === 'DISTRACTION') {
                    dayPoints -= 50;
                } else if (entry.category === 'EXERCISE') {
                    dayPoints += 50;
                } else if (entry.category === 'SLEEP') {
                    dayCount--; // Don't count sleep in denominator
                }
            });

            const dayEfficiency = dayCount > 0 ? Math.max(0, Math.round(dayPoints / dayCount)) : 0;
            
            result.deepWork.push(dayDeep);
            result.shallowWork.push(dayShallow);
            result.efficiency.push(dayEfficiency);
            
            result.totalDeepWork += dayDeep;
            result.totalLogs += dayCount;
            
            if (dayCount > 0) {
                totalEfficiency += dayEfficiency;
                daysWithLogs++;
            }
        });

        result.avgEfficiency = daysWithLogs > 0 ? Math.round(totalEfficiency / daysWithLogs) : 0;

        return result;
    }

    renderTrendChart(data) {
        const ctx = document.getElementById('analytics-trend-chart');
        if (!ctx) return;

        if (this.charts.trend) this.charts.trend.destroy();

        this.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Deep Work (h)',
                        data: data.deepWork,
                        borderColor: 'hsl(18, 75%, 55%)',
                        backgroundColor: 'hsla(18, 75%, 55%, 0.1)',
                        fill: true,
                        tension: 0.4,
                        borderWidth: 2
                    },
                    {
                        label: 'Efficiency (%)',
                        data: data.efficiency,
                        borderColor: 'hsl(145, 65%, 45%)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.4,
                        borderWidth: 2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Hours' },
                        grid: { color: 'hsl(var(--border) / 0.5)' }
                    },
                    y1: {
                        position: 'right',
                        beginAtZero: true,
                        max: 100,
                        title: { display: true, text: 'Efficiency Score' },
                        grid: { display: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: 'hsl(var(--foreground-muted))' }
                    }
                }
            }
        });
    }

    renderBreakdownChart(data) {
        const ctx = document.getElementById('analytics-breakdown-chart');
        if (!ctx) return;

        if (this.charts.breakdown) this.charts.breakdown.destroy();

        const totals = data.categoryTotals;
        // Don't show sleep/rest if they are overwhelming, or maybe show all?
        // Let's standardise the order
        const values = [
            totals.DEEP_WORK, 
            totals.SHALLOW, 
            totals.DISTRACTION, 
            totals.REST, 
            totals.EXERCISE
        ];

        this.charts.breakdown = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Deep Work', 'Shallow', 'Distraction', 'Rest', 'Exercise'],
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'hsl(18, 75%, 55%)',  // Deep
                        'hsl(38, 90%, 55%)',  // Shallow
                        'hsl(0, 65%, 55%)',   // Distraction
                        'hsl(145, 35%, 45%)', // Rest
                        'hsl(280, 65%, 60%)'  // Exercise
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { 
                            color: 'hsl(var(--foreground-muted))',
                            boxWidth: 12
                        }
                    }
                }
            }
        });
    }

    renderHeatmap(data) {
        const container = document.getElementById('analytics-heatmap');
        if (!container) return;
        
        container.innerHTML = '';
        
        // Structure: 24 rows (hours), 7 cols (days of week)
        // Actually, usually heatmap is Day x Hour. Let's do Day (Rows) x Hour (Cols) for easier scrolling if needed, or stick to standard GitHub style grid.
        // Let's do: Columns = Hours (0-23), Rows = Days (Mon-Sun).
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        
        // Header Row (Hours)
        const headerRow = document.createElement('div');
        headerRow.className = 'heatmap-row header';
        headerRow.innerHTML = '<div class="heatmap-label"></div>'; // Empty corner
        for (let h = 0; h < 24; h += 3) { // Show every 3rd hour for space
            // 3 cols span
             headerRow.innerHTML += `<div class="heatmap-col-header" style="grid-column: span 3">${h}</div>`;
        }
        // container.appendChild(headerRow); // CSS Grid handling might be better 

        // Let's build a CSS Grid approach
        // grid-template-columns: auto (label) repeat(24, 1fr)
        
        container.style.display = 'grid';
        container.style.gridTemplateColumns = '40px repeat(24, 1fr)';
        container.style.gap = '2px';
        
        // Header (Hours)
        container.appendChild(this.createCell(''));
        for(let h=0; h<24; h++) {
            const cell = this.createCell(h % 6 === 0 ? h : '', 'heatmap-header');
            cell.style.fontSize = '0.6rem';
            container.appendChild(cell);
        }

        // Rows
        days.forEach((dayName, dayIndex) => {
            // Day Label
            const label = this.createCell(dayName, 'heatmap-day-label');
            label.style.fontWeight = 'bold';
            label.style.fontSize = '0.7rem';
            container.appendChild(label);

            // Hour Cells
            for (let h = 0; h < 24; h++) {
                const count = data.hourlyDistribution[h][dayIndex]; // Count of deep work sessions for this hour/day combo
                const intensity = this.getIntensity(count);
                const cell = document.createElement('div');
                cell.className = `heatmap-cell intensity-${intensity}`;
                cell.title = `${dayName} ${h}:00 - ${count} sessions`;
                container.appendChild(cell);
            }
        });
    }

    createCell(content, className = '') {
        const div = document.createElement('div');
        div.className = className;
        div.textContent = content;
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        return div;
    }

    getIntensity(count) {
        if (count === 0) return 0;
        if (count === 1) return 1;
        if (count === 2) return 2;
        if (count <= 4) return 3;
        return 4;
    }

    renderKPIS(data) {
        this.updateKPI('analytics-total-deep', `${data.totalDeepWork}h`);
        this.updateKPI('analytics-avg-efficiency', `${data.avgEfficiency}%`);
        this.updateKPI('analytics-focus-sessions', data.deepWork.reduce((a,b) => a+b, 0)); // Same as total deep for now assuming 1h blocks
    }

    updateKPI(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = value;
            // Add subtle animation logic here if needed
        }
    }
}
