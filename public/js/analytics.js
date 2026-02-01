class AnalyticsManager {
  constructor(app) {
    this.app = app;
    this.charts = {
      trend: null,
      breakdown: null,
      heatmap: null, // this is DOM, not Chart.js
      priority: null,
      tag: null,
      categoryHistory: null,
    };
    this.timeRange = "7"; // '7', '30'

    console.log("[Analytics] Initialized");
    this.bindEvents();
  }

  bindEvents() {
    // Bind range selectors if they exist
    document.querySelectorAll(".analytics-range-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Update active state
        document
          .querySelectorAll(".analytics-range-btn")
          .forEach((b) => b.classList.remove("active"));
        e.target.classList.add("active");

        // Update range and re-render
        this.timeRange = e.target.dataset.range;
        this.render();
      });
    });

    // Observe all chart canvases with improved lazy loading
    const chartIds = [
      "analytics-trend-chart",
      "analytics-breakdown-chart",
      "analytics-priority-chart",
      "analytics-tag-chart",
      "analytics-category-history-chart",
    ];

    // Use IntersectionObserver for better performance
    if ("IntersectionObserver" in window) {
      const observerOptions = {
        root: null,
        rootMargin: "50px",
        threshold: 0.1,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const chartId = entry.target.id;
            this.renderChartIfVisible(chartId);
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      chartIds.forEach((id) => {
        const chartEl = document.getElementById(id);
        if (chartEl) {
          observer.observe(chartEl);
        }
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      chartIds.forEach((id) => {
        const chartEl = document.getElementById(id);
        if (chartEl) {
          this.renderChartIfVisible(id);
        }
      });
    }
  }

  render() {
    console.log(`[Analytics] Rendering view for last ${this.timeRange} days`);
    const { data, taskData } = this.getProcessedData();

    // Update KPIs with enhanced styling
    this.renderKPIS(data);

    // Render insights
    this.renderInsights(data);

    // Render task performance stats
    this.renderTaskStats(taskData);

    // Render heatmap
    this.renderHeatmap(data);

    // Trigger lazy loading for charts
    this.renderChartIfVisible("analytics-trend-chart");
    this.renderChartIfVisible("analytics-breakdown-chart");
    this.renderChartIfVisible("analytics-priority-chart");
    this.renderChartIfVisible("analytics-tag-chart");
    this.renderChartIfVisible("analytics-category-history-chart");

    // Bind export button
    this.bindExportButton();

    // Render Lucide icons after content is added
    setTimeout(() => {
      if (window.lucide) {
        lucide.createIcons();
      }
    }, 0);
  }

  getProcessedData() {
    const data = this.processData(this.timeRange);
    const taskData = this.processTaskData(this.timeRange);
    return { data, taskData };
  }

  processData(days) {
    const result = {
      labels: [],
      deepWork: [],
      shallowWork: [],
      efficiency: [],
      categoryTotals: {
        DEEP_WORK: 0,
        SHALLOW: 0,
        DISTRACTION: 0,
        REST: 0,
        SLEEP: 0,
        EXERCISE: 0,
      },
      categoryHistory: {
        DEEP_WORK: [],
        SHALLOW: [],
        DISTRACTION: [],
        REST: [],
        EXERCISE: [],
      },
      hourlyDistribution: Array(24)
        .fill(0)
        .map(() => Array(7).fill(0)), // 24 hours x 7 days
      totalDeepWork: 0,
      avgEfficiency: 0,
      totalLogs: 0,
      hourlyTotals: Array(24).fill(0),
      dayTotals: Array(7).fill(0),
    };

    const today = new Date();
    const dates = [];

    // Generate dates
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d);
      result.labels.push(
        d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      );
    }

    let totalEfficiency = 0;
    let daysWithLogs = 0;

    dates.forEach((date) => {
      const dateKey = this.app.getDateKey(date);
      const dayLog = this.app.data[dateKey] || {};

      let dayDeep = 0;
      let dayShallow = 0;
      let dayDistraction = 0;
      let dayRest = 0;
      let dayExercise = 0;
      let dayPoints = 0;
      let dayCount = 0;

      Object.entries(dayLog).forEach(([hour, entry]) => {
        const h = parseInt(hour);
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;

        if (entry.category === "DEEP_WORK") {
          result.hourlyDistribution[h][dayIndex]++;
          dayDeep++;
          dayPoints += 100;
        } else if (entry.category === "SHALLOW") {
          dayShallow++;
          dayPoints += 50;
        } else if (entry.category === "DISTRACTION") {
          dayDistraction++;
          dayPoints -= 50;
        } else if (entry.category === "REST") {
          dayRest++;
        } else if (entry.category === "EXERCISE") {
          dayExercise++;
          dayPoints += 50;
        } else if (entry.category === "SLEEP") {
          dayCount--;
        }

        if (result.categoryTotals[entry.category] !== undefined) {
          result.categoryTotals[entry.category]++;
        }

        // Track hourly and daily totals
        result.hourlyTotals[h]++;
        result.dayTotals[dayIndex]++;

        dayCount++;
      });

      // Store category history for stacked chart
      result.categoryHistory.DEEP_WORK.push(dayDeep);
      result.categoryHistory.SHALLOW.push(dayShallow);
      result.categoryHistory.DISTRACTION.push(dayDistraction);
      result.categoryHistory.REST.push(dayRest);
      result.categoryHistory.EXERCISE.push(dayExercise);

      const dayEfficiency =
        dayCount > 0 ? Math.max(0, Math.round(dayPoints / dayCount)) : 0;

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

    result.avgEfficiency =
      daysWithLogs > 0 ? Math.round(totalEfficiency / daysWithLogs) : 0;

    return result;
  }

  processTaskData(days) {
    const taskCounts = {}; // { taskId: { total: N, deep: M, shallow: K, distraction: L } }
    const priorityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
    const tagCounts = {}; // { tag: count }

    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = this.app.getDateKey(d);
      const dayLog = this.app.data[dateKey] || {};

      Object.values(dayLog).forEach((entry) => {
        if (entry.taskId) {
          if (!taskCounts[entry.taskId]) {
            taskCounts[entry.taskId] = {
              total: 0,
              deep: 0,
              shallow: 0,
              distraction: 0,
            };
          }
          taskCounts[entry.taskId].total++;
          if (entry.category === "DEEP_WORK") taskCounts[entry.taskId].deep++;
          else if (entry.category === "SHALLOW")
            taskCounts[entry.taskId].shallow++;
          else if (entry.category === "DISTRACTION")
            taskCounts[entry.taskId].distraction++;
        }

        if (entry.taskPriority) {
          priorityCounts[entry.taskPriority]++;
        } else if (
          entry.taskId &&
          this.app.tasks[entry.taskId] &&
          this.app.tasks[entry.taskId].priority
        ) {
          priorityCounts[this.app.tasks[entry.taskId].priority]++;
        } else {
          priorityCounts.NONE++;
        }

        if (entry.taskTags && entry.taskTags.length > 0) {
          entry.taskTags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        } else if (
          entry.taskId &&
          this.app.tasks[entry.taskId] &&
          this.app.tasks[entry.taskId].tags &&
          this.app.tasks[entry.taskId].tags.length > 0
        ) {
          this.app.tasks[entry.taskId].tags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
    }

    return { taskCounts, priorityCounts, tagCounts };
  }

  renderChartIfVisible(chartId) {
    const chartEl = document.getElementById(chartId);
    if (chartEl) {
      // Render the chart even if it's hidden, it will display when visible
      const { data, taskData } = this.getProcessedData(); // Re-process data to ensure it's fresh
      switch (chartId) {
        case "analytics-trend-chart":
          this.renderTrendChart(data);
          break;
        case "analytics-breakdown-chart":
          this.renderBreakdownChart(data);
          break;
        case "analytics-priority-chart":
          this.renderPriorityChart(taskData);
          break;
        case "analytics-tag-chart":
          this.renderTagChart(taskData);
          break;
        case "analytics-category-history-chart":
          this.renderCategoryHistoryChart(data);
          break;
      }
    }
  }

  renderTrendChart(data) {
    const ctx = document.getElementById("analytics-trend-chart");
    if (!ctx) return;

    if (this.charts.trend) this.charts.trend.destroy();

    this.charts.trend = new Chart(ctx, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Deep Work (h)",
            data: data.deepWork,
            borderColor: "hsl(18, 75%, 55%)",
            backgroundColor: "hsla(18, 75%, 55%, 0.1)",
            fill: true,
            tension: 0.4,
            borderWidth: 2,
          },
          {
            label: "Efficiency (%)",
            data: data.efficiency,
            borderColor: "hsl(145, 65%, 45%)",
            backgroundColor: "transparent",
            borderDash: [5, 5],
            tension: 0.4,
            borderWidth: 2,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Hours" },
            grid: { color: "hsl(var(--border) / 0.5)" },
          },
          y1: {
            position: "right",
            beginAtZero: true,
            max: 100,
            title: { display: true, text: "Efficiency Score" },
            grid: { display: false },
          },
          x: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: {
            labels: { color: "hsl(var(--foreground-muted))" },
          },
        },
      },
    });
  }

  renderBreakdownChart(data) {
    const ctx = document.getElementById("analytics-breakdown-chart");
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
      totals.EXERCISE,
    ];

    this.charts.breakdown = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Deep Work", "Shallow", "Distraction", "Rest", "Exercise"],
        datasets: [
          {
            data: values,
            backgroundColor: [
              "hsl(18, 75%, 55%)", // Deep
              "hsl(38, 90%, 55%)", // Shallow
              "hsl(0, 65%, 55%)", // Distraction
              "hsl(145, 35%, 45%)", // Rest
              "hsl(280, 65%, 60%)", // Exercise
            ],
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "hsl(var(--foreground-muted))",
              boxWidth: 12,
            },
          },
        },
      },
    });
  }

  renderPriorityChart(taskData) {
    const ctx = document.getElementById("analytics-priority-chart");
    if (!ctx) return;

    if (this.charts.priority) this.charts.priority.destroy();

    const priorityLabels = ["HIGH", "MEDIUM", "LOW", "NONE"];
    const priorityValues = priorityLabels.map(
      (p) => taskData.priorityCounts[p] || 0,
    );

    this.charts.priority = new Chart(ctx, {
      type: "bar",
      data: {
        labels: priorityLabels,
        datasets: [
          {
            label: "Sessions by Priority",
            data: priorityValues,
            backgroundColor: [
              "hsl(0, 70%, 60%)", // High
              "hsl(38, 90%, 55%)", // Medium
              "hsl(145, 65%, 45%)", // Low
              "hsl(210, 10%, 60%)", // None
            ],
            borderColor: "hsl(var(--border))",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Number of Sessions" },
            grid: { color: "hsl(var(--border) / 0.5)" },
          },
          x: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Sessions by Task Priority",
            color: "hsl(var(--foreground))",
          },
        },
      },
    });
  }

  renderTagChart(taskData) {
    const ctx = document.getElementById("analytics-tag-chart");
    if (!ctx) return;

    if (this.charts.tag) this.charts.tag.destroy();

    const sortedTags = Object.entries(taskData.tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10 tags

    const labels = sortedTags.map(([tag]) => tag);
    const values = sortedTags.map(([, count]) => count);

    this.charts.tag = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Sessions by Tag",
            data: values,
            backgroundColor: "hsl(210, 70%, 60%)",
            borderColor: "hsl(210, 70%, 50%)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: "y", // Horizontal bar chart
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: "Number of Sessions" },
            grid: { color: "hsl(var(--border) / 0.5)" },
          },
          y: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: "Top 10 Tags",
            color: "hsl(var(--foreground))",
          },
        },
      },
    });
  }

  renderCategoryHistoryChart(data) {
    const ctx = document.getElementById("analytics-category-history-chart");
    if (!ctx) return;

    if (this.charts.categoryHistory) this.charts.categoryHistory.destroy();

    this.charts.categoryHistory = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Deep Work",
            data: data.categoryHistory.DEEP_WORK,
            backgroundColor: "hsl(18, 75%, 55%)",
          },
          {
            label: "Shallow",
            data: data.categoryHistory.SHALLOW,
            backgroundColor: "hsl(38, 90%, 55%)",
          },
          {
            label: "Distraction",
            data: data.categoryHistory.DISTRACTION,
            backgroundColor: "hsl(0, 65%, 55%)",
          },
          {
            label: "Rest",
            data: data.categoryHistory.REST,
            backgroundColor: "hsl(145, 35%, 45%)",
          },
          {
            label: "Exercise",
            data: data.categoryHistory.EXERCISE,
            backgroundColor: "hsl(280, 65%, 60%)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            title: { display: true, text: "Hours" },
            grid: { color: "hsl(var(--border) / 0.5)" },
          },
        },
        plugins: {
          legend: {
            labels: { color: "hsl(var(--foreground-muted))" },
          },
          title: {
            display: true,
            text: "Daily Category Breakdown",
            color: "hsl(var(--foreground))",
          },
        },
      },
    });
  }

  renderHeatmap(data) {
    const container = document.getElementById("analytics-heatmap");
    if (!container) return;

    container.innerHTML = "";

    // Structure: 24 rows (hours), 7 cols (days of week)
    // Actually, usually heatmap is Day x Hour. Let's do Day (Rows) x Hour (Cols) for easier scrolling if needed, or stick to standard GitHub style grid.
    // Let's do: Columns = Hours (0-23), Rows = Days (Mon-Sun).

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Header Row (Hours)
    const headerRow = document.createElement("div");
    headerRow.className = "heatmap-row header";
    headerRow.innerHTML = '<div class="heatmap-label"></div>'; // Empty corner
    for (let h = 0; h < 24; h += 3) {
      // Show every 3rd hour for space
      // 3 cols span
      headerRow.innerHTML += `<div class="heatmap-col-header" style="grid-column: span 3">${h}</div>`;
    }
    // container.appendChild(headerRow); // CSS Grid handling might be better

    // Let's build a CSS Grid approach
    // grid-template-columns: auto (label) repeat(24, 1fr)

    container.style.display = "grid";
    container.style.gridTemplateColumns = "40px repeat(24, 1fr)";
    container.style.gap = "2px";

    // Header (Hours)
    container.appendChild(this.createCell(""));
    for (let h = 0; h < 24; h++) {
      const cell = this.createCell(h % 6 === 0 ? h : "", "heatmap-header");
      cell.style.fontSize = "0.6rem";
      container.appendChild(cell);
    }

    // Rows
    days.forEach((dayName, dayIndex) => {
      // Day Label
      const label = this.createCell(dayName, "heatmap-day-label");
      label.style.fontWeight = "bold";
      label.style.fontSize = "0.7rem";
      container.appendChild(label);

      // Hour Cells
      for (let h = 0; h < 24; h++) {
        const count = data.hourlyDistribution[h][dayIndex]; // Count of deep work sessions for this hour/day combo
        const intensity = this.getIntensity(count);
        const cell = document.createElement("div");
        cell.className = `heatmap-cell intensity-${intensity}`;
        cell.title = `${dayName} ${h}:00 - ${count} sessions`;
        container.appendChild(cell);
      }
    });
  }

  createCell(content, className = "") {
    const div = document.createElement("div");
    div.className = className;
    div.textContent = content;
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
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
    this.updateKPI("analytics-total-deep", `${data.totalDeepWork}h`);
    this.updateKPI("analytics-avg-efficiency", `${data.avgEfficiency}%`);
    this.updateKPI(
      "analytics-focus-sessions",
      data.deepWork.reduce((a, b) => a + b, 0),
    ); // Same as total deep for now assuming 1h blocks

    // Calculate and display productivity score
    const productivityScore = this.calculateProductivityScore(data);
    this.updateKPI("analytics-productivity-score", productivityScore);
  }

  calculateProductivityScore(data) {
    // Example calculation: (Deep Work Hours * 10 + Average Efficiency * 0.5) / (Total Logs / 10)
    // This is a simplified example, can be made more complex.
    const deepWorkScore = data.totalDeepWork * 10;
    const efficiencyScore = data.avgEfficiency * 0.5;
    const activityFactor = data.totalLogs > 0 ? data.totalLogs / 10 : 1; // Avoid division by zero

    let score = (deepWorkScore + efficiencyScore) / activityFactor;
    score = Math.min(100, Math.max(0, Math.round(score))); // Cap between 0 and 100

    return score;
  }

  renderTaskStats(taskData) {
    const container = document.getElementById("analytics-task-stats");
    if (!container) return;

    container.innerHTML = ""; // Clear previous stats

    const sortedTasks = Object.entries(taskData.taskCounts)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 5); // Top 5 tasks

    if (sortedTasks.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="clipboard-list" style="width: 48px; height: 48px; color: hsl(var(--foreground-muted));"></i>
                    <p class="empty-message">No task data available for this period</p>
                    <p class="empty-subtitle">Start logging time against tasks to see performance insights</p>
                </div>
            `;
      lucide.createIcons();
      return;
    }

    const statsGrid = document.createElement("div");
    statsGrid.className = "task-stats-grid";

    sortedTasks.forEach(([taskId, counts]) => {
      const task = this.app.tasks[taskId];
      if (task) {
        const statCard = document.createElement("div");
        statCard.className = "task-stat-card";

        const totalHours = Math.round((counts.total / 60) * 10) / 10; // Convert minutes to hours
        const deepPercentage =
          counts.total > 0 ? Math.round((counts.deep / counts.total) * 100) : 0;

        statCard.innerHTML = `
                    <div class="task-stat-header">
                        <h5 class="task-name">${task.title}</h5>
                        <div class="task-priority priority-${task.priority?.toLowerCase() || "none"}">
                            ${task.priority || "NONE"}
                        </div>
                    </div>
                    <div class="task-stat-metrics">
                        <div class="metric">
                            <span class="metric-value">${totalHours}h</span>
                            <span class="metric-label">Total Time</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${counts.total}</span>
                            <span class="metric-label">Sessions</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${deepPercentage}%</span>
                            <span class="metric-label">Deep Work</span>
                        </div>
                    </div>
                    <div class="task-progress-bar">
                        <div class="progress-fill" style="width: ${deepPercentage}%"></div>
                    </div>
                `;

        statsGrid.appendChild(statCard);
      }
    });

    container.appendChild(statsGrid);
  }

  renderInsights(data) {
    const container = document.getElementById("analytics-insights");
    if (!container) return;

    container.innerHTML = ""; // Clear previous insights

    const insights = [];

    // Insight 1: Peak productivity hour
    const maxHourly = Math.max(...data.hourlyTotals);
    if (maxHourly > 0) {
      const peakHours = data.hourlyTotals
        .map((count, h) => (count === maxHourly ? h : -1))
        .filter((h) => h !== -1);
      if (peakHours.length > 0) {
        insights.push({
          icon: "clock",
          title: "Peak Productivity Hours",
          description: `You're most active around <strong>${peakHours.map((h) => `${h}:00`).join(" and ")}</strong>`,
          type: "positive",
        });
      }
    }

    // Insight 2: Most active day
    const maxDaily = Math.max(...data.dayTotals);
    if (maxDaily > 0) {
      const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];
      const peakDays = data.dayTotals
        .map((count, d) => (count === maxDaily ? daysOfWeek[d] : null))
        .filter((d) => d !== null);
      if (peakDays.length > 0) {
        insights.push({
          icon: "calendar",
          title: "Most Active Days",
          description: `You get the most done on <strong>${peakDays.join(" and ")}</strong>`,
          type: "info",
        });
      }
    }

    // Insight 3: Deep work vs. Distraction ratio
    const totalDeep = data.categoryTotals.DEEP_WORK || 0;
    const totalDistraction = data.categoryTotals.DISTRACTION || 0;
    if (totalDeep > 0 && totalDistraction > 0) {
      if (totalDeep > totalDistraction * 2) {
        insights.push({
          icon: "trending-up",
          title: "Excellent Focus",
          description: `You have <strong>${Math.round(totalDeep / totalDistraction)}x more deep work</strong> than distractions`,
          type: "positive",
        });
      } else if (totalDistraction > totalDeep) {
        insights.push({
          icon: "alert-triangle",
          title: "Distraction Alert",
          description: `Consider reducing distractions - you have <strong>${Math.round(totalDistraction / totalDeep)}x more</strong> than deep work`,
          type: "warning",
        });
      }
    } else if (totalDeep > 0 && totalDistraction === 0) {
      insights.push({
        icon: "target",
        title: "Perfect Focus",
        description: `Outstanding! <strong>No distractions</strong> recorded in this period`,
        type: "positive",
      });
    }

    // Insight 4: Efficiency trend
    if (data.efficiency.length >= 2) {
      const recent = data.efficiency.slice(-3);
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgEarlier =
        data.efficiency.slice(0, -3).reduce((a, b) => a + b, 0) /
        Math.max(1, data.efficiency.length - 3);

      if (avgRecent > avgEarlier + 5) {
        insights.push({
          icon: "zap",
          title: "Efficiency Improving",
          description: `Your recent efficiency is <strong>${Math.round(avgRecent - avgEarlier)}% higher</strong> than before`,
          type: "positive",
        });
      } else if (avgEarlier > avgRecent + 5) {
        insights.push({
          icon: "trending-down",
          title: "Efficiency Declining",
          description: `Your recent efficiency is <strong>${Math.round(avgEarlier - avgRecent)}% lower</strong> than before`,
          type: "warning",
        });
      }
    }

    if (insights.length === 0) {
      container.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="brain" style="width: 48px; height: 48px; color: hsl(var(--foreground-muted));"></i>
                    <p class="empty-message">No insights available yet</p>
                    <p class="empty-subtitle">Continue logging your activities to unlock personalized insights</p>
                </div>
            `;
      lucide.createIcons();
      return;
    }

    const insightsGrid = document.createElement("div");
    insightsGrid.className = "insights-grid";

    insights.forEach((insight) => {
      const insightCard = document.createElement("div");
      insightCard.className = `insight-card insight-${insight.type}`;

      insightCard.innerHTML = `
                <div class="insight-icon">
                    <i data-lucide="${insight.icon}"></i>
                </div>
                <div class="insight-content">
                    <h5 class="insight-title">${insight.title}</h5>
                    <p class="insight-description">${insight.description}</p>
                </div>
            `;

      insightsGrid.appendChild(insightCard);
    });

    container.appendChild(insightsGrid);
    lucide.createIcons();
  }

  updateKPI(id, value) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = value;
      // Add subtle animation logic here if needed
    }
  }

  bindExportButton() {
    const exportBtn = document.getElementById("export-analytics-pdf");
    if (exportBtn) {
      exportBtn.onclick = () => this.exportToPDF();
    }
  }

  async exportToPDF() {
    const exportBtn = document.getElementById("export-analytics-pdf");
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.innerHTML =
        '<i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i> Generating...';
    }

    try {
      const analyticsView = document.getElementById("view-analytics");
      if (!analyticsView) {
        console.error("Analytics view not found");
        return;
      }

      // Use html2canvas to capture the analytics view
      const canvas = await html2canvas(analyticsView, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Get jsPDF from the global window object
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF("p", "mm", "a4");

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

      const dateStr = new Date().toISOString().split("T")[0];
      pdf.save(`analytics-report-${dateStr}.pdf`);

      console.log("[Analytics] PDF exported successfully");
    } catch (error) {
      console.error("[Analytics] PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML =
          '<i data-lucide="download" style="width: 14px; height: 14px;"></i> Export PDF';
        lucide.createIcons();
      }
    }
  }
}
