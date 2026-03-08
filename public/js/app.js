// --- DailyTracker Premium Application ---
const STORAGE_KEY = "daily_tracker_data_v1";

// Global Error Handler
window.onerror = function (msg, url, lineNo, columnNo, error) {
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
      this.activeTaskFilter = "all";
      this.currentViewName = "dashboard";
      this.isTaskModalOpen = false;
      this.charts = {};

      this.init();
    } catch (e) {
      console.error("Initialization Failed:", e);
    }
  }

  // Generate YYYY-MM-DD in Local Timezone
  getDateKey(date) {
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
  }

  init() {
    // Initialize in order
    try {
      this.initPWA();
    } catch (e) {
      console.error("PWA Init Failed", e);
    }
    try {
      this.initTheme();
    } catch (e) {
      console.error("Theme Init Failed", e);
    }
    try {
      this.initViews();
    } catch (e) {
      console.error("View Init Failed", e);
    }

    // Hide FAB by default — only shown on Tasks view
    const fab = document.getElementById("task-fab-btn");
    if (fab) fab.style.display = "none";
    try {
      this.initMobileNav();
    } catch (e) {
      console.error("Mobile Nav Init Failed", e);
    }
    try {
      this.initSettings();
    } catch (e) {
      console.error("Settings Init Failed", e);
    }
    try {
      this.initTasks();
    } catch (e) {
      console.error("Tasks Init Failed", e);
    }
    // try { this.initKeyboardShortcuts(); } catch(e) { console.error('Keyboard Init Failed', e); }
    try {
      this.renderDailyView();
    } catch (e) {
      console.error("Daily View Render Failed", e);
    }
    try {
      this.renderDashboard();
    } catch (e) {
      console.error("Dashboard Render Failed", e);
    }
    try {
      this.initModal();
    } catch (e) {
      console.error("Modal Init Failed", e);
    }
    try {
      this.updateWelcomeHeader();
    } catch (e) {
      console.error("Welcome Header Failed", e);
    }

    // Charts last (heavy)
    setTimeout(() => {
      try {
        this.initCharts();
      } catch (e) {
        console.error("Chart Init Failed", e);
      }
    }, 100);
  }

  // --- PWA Support ---
  initPWA() {
    this.deferredPrompt = null;

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[PWA] Service worker registered"))
        .catch((err) =>
          console.log("[PWA] Service worker registration failed:", err),
        );
    }

    // Handle install prompt
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
      console.log("[PWA] Install prompt captured");
    });

    window.addEventListener("appinstalled", () => {
      console.log("[PWA] App installed successfully");
      this.hideInstallButton();
      this.showToast("App installed successfully!", "success");
    });

    // Bind install button in Settings
    const installBtn = document.getElementById("install-app-btn");
    if (installBtn) {
      installBtn.addEventListener("click", () => this.installApp());
    }
  }

  installApp() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("[PWA] User accepted install");
        }
        this.deferredPrompt = null;
      });
    } else {
      // Show instructions if install prompt not available
      this.showToast("Use your browser menu to install this app", "info");
      console.log(
        "[PWA] Install prompt not available. Browser may not support PWA or app is already installed.",
      );
    }
  }

  showInstallButton() {
    const installSection = document.getElementById("install-app-section");
    const installBtn = document.getElementById("install-app-btn");

    if (installSection) {
      installSection.classList.remove("hidden");
    }

    if (installBtn) {
      installBtn.disabled = false;
    }

    console.log("[PWA] Install available — shown in Settings");
  }

  hideInstallButton() {
    const installSection = document.getElementById("install-app-section");
    const installBtn = document.getElementById("install-app-btn");

    if (installBtn) {
      installBtn.disabled = true;
    }

    if (installSection) {
      installSection.classList.add("hidden");
    }
  }

  // --- Theme / Dark Mode ---
  initTheme() {
    const savedTheme = localStorage.getItem("dailytracker_theme") || "light";
    this.setTheme(savedTheme);
  }

  setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("dailytracker_theme", theme);

    // Update theme-color meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.content = theme === "dark" ? "#1a1a1a" : "#D97741";
    }
  }

  toggleTheme() {
    const current =
      document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = current === "light" ? "dark" : "light";
    this.setTheme(newTheme);
    return newTheme;
  }

  // --- Keyboard Shortcuts ---
  initKeyboardShortcuts() {
    console.log("[Shortcuts] Initializing keyboard shortcuts...");

    document.addEventListener("keydown", (e) => {
      // Ignore if typing in input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")
        return;

      console.log(
        "[Shortcuts] Key pressed:",
        e.key,
        "Alt:",
        e.altKey,
        "Ctrl:",
        e.ctrlKey,
      );

      // Ctrl+E for export (the only Ctrl shortcut that doesn't conflict)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "e") {
        e.preventDefault();
        this.exportData();
        return;
      }

      // Alt key shortcuts (don't conflict with browser)
      if (e.altKey && !e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "d":
            e.preventDefault();
            console.log("[Shortcuts] Switching to Dashboard");
            this.switchView("dashboard");
            return;
          case "t":
            e.preventDefault();
            console.log("[Shortcuts] Switching to Tasks");
            this.switchView("tasks");
            setTimeout(
              () => document.getElementById("new-task-input")?.focus(),
              100,
            );
            return;
          case "l":
            e.preventDefault();
            console.log("[Shortcuts] Switching to Daily");
            this.switchView("daily");
            return;
          case "s":
            e.preventDefault();
            console.log("[Shortcuts] Switching to Settings");
            this.switchView("settings");
            return;
        }
      }

      // Number key shortcuts (quick navigation) - no modifier keys
      if (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) {
        switch (e.key) {
          case "1":
            console.log("[Shortcuts] Switching to Dashboard via 1");
            this.switchView("dashboard");
            return;
          case "2":
            console.log("[Shortcuts] Switching to Tasks via 2");
            this.switchView("tasks");
            return;
          case "3":
            console.log("[Shortcuts] Switching to Daily via 3");
            this.switchView("daily");
            return;
          case "4":
            console.log("[Shortcuts] Switching to Settings via 4");
            this.switchView("settings");
            return;
          case "?":
            console.log("[Shortcuts] Opening shortcuts modal");
            this.showShortcutsModal();
            return;
          case "Escape":
            this.closeModal();
            this.closeShortcutsModal();
            return;
        }
      }
    });

    console.log("[Shortcuts] Keyboard shortcuts initialized successfully");
  }

  showShortcutsModal() {
    let modal = document.getElementById("shortcuts-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "shortcuts-modal";
      modal.className = "modal";
      modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>Keyboard Shortcuts</h3>
                        <button class="modal-close" onclick="document.getElementById('shortcuts-modal').classList.add('hidden')">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="shortcut-list">
                            <div class="shortcut-item"><kbd>1</kbd> or <kbd>Alt</kbd>+<kbd>D</kbd> <span>Dashboard</span></div>
                            <div class="shortcut-item"><kbd>2</kbd> or <kbd>Alt</kbd>+<kbd>T</kbd> <span>Tasks</span></div>
                            <div class="shortcut-item"><kbd>3</kbd> or <kbd>Alt</kbd>+<kbd>L</kbd> <span>Daily Log</span></div>
                            <div class="shortcut-item"><kbd>4</kbd> or <kbd>Alt</kbd>+<kbd>S</kbd> <span>Settings</span></div>
                            <div class="shortcut-item"><kbd>Ctrl</kbd>+<kbd>E</kbd> <span>Export Data</span></div>
                            <div class="shortcut-item"><kbd>?</kbd> <span>Show Shortcuts</span></div>
                            <div class="shortcut-item"><kbd>Esc</kbd> <span>Close Modal</span></div>
                        </div>
                    </div>
                </div>
            `;
      document.body.appendChild(modal);
      lucide.createIcons();
    }
    modal.classList.remove("hidden");
  }

  closeShortcutsModal() {
    const modal = document.getElementById("shortcuts-modal");
    if (modal) modal.classList.add("hidden");
  }

  // --- Data Export ---
  exportData() {
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      data: this.data,
      tasks: this.tasks,
      settings: this.settings,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dailytracker-backup-${this.getDateKey(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);

    // Show success feedback
    this.showToast("Data exported successfully!", "success");
  }

  importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (imported.data) this.data = imported.data;
        if (imported.tasks) this.tasks = imported.tasks;
        if (imported.settings) this.settings = imported.settings;

        this.saveData();
        this.saveTasks();
        this.saveSettings();

        this.showToast("Data imported successfully! Refreshing...", "success");
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        this.showToast("Failed to import data. Invalid file format.", "error");
      }
    };
    reader.readAsText(file);
  }

  showToast(message, type = "info") {
    let toast = document.getElementById("toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `toast toast-${type} show`;

    setTimeout(() => toast.classList.remove("show"), 3000);
  }

  loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  loadTasks() {
    const stored = localStorage.getItem(STORAGE_KEY + "_tasks");
    return stored ? JSON.parse(stored) : [];
  }

  loadSettings() {
    const stored = localStorage.getItem(STORAGE_KEY + "_settings");
    return stored
      ? JSON.parse(stored)
      : {
          targetHours: 8,
          streakThreshold: 80,
          userName: "",
        };
  }

  saveSettings() {
    localStorage.setItem(
      STORAGE_KEY + "_settings",
      JSON.stringify(this.settings),
    );
    this.updateWelcomeHeader();
    this.renderDashboard();
  }

  saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.renderDashboard();
  }

  saveTasks() {
    localStorage.setItem(STORAGE_KEY + "_tasks", JSON.stringify(this.tasks));
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
    const userName = this.settings.userName || "Champion";
    const avatarStyle = this.settings.avatarStyle || "initials";

    const welcomeEl = document.getElementById("header-user-name");
    const userInitialEl = document.getElementById("user-initial");
    const sidebarNameEl = document.getElementById("user-name");
    const avatarImg = document.getElementById("user-avatar-img");

    if (welcomeEl) welcomeEl.textContent = userName;
    if (sidebarNameEl) sidebarNameEl.textContent = userName;

    // Handle avatar
    if (avatarStyle === "initials") {
      // Show initial, hide image
      if (userInitialEl) {
        userInitialEl.textContent = userName.charAt(0).toUpperCase();
        userInitialEl.style.display = "flex";
      }
      if (avatarImg) avatarImg.style.display = "none";
    } else {
      // Show generated avatar image with style-specific parameters
      if (userInitialEl) userInitialEl.style.display = "none";
      if (avatarImg) {
        const avatarUrl = this.getAvatarUrl(avatarStyle, userName);
        avatarImg.src = avatarUrl;
        avatarImg.style.display = "block";
      }
    }

    // Update greeting based on time of day
    const hour = new Date().getHours();
    const welcomeMsgEl = document.getElementById("welcome-message");
    let greeting = "Welcome back";
    if (hour < 12) greeting = "Good morning";
    else if (hour < 17) greeting = "Good afternoon";
    else greeting = "Good evening";

    if (welcomeMsgEl) {
      welcomeMsgEl.innerHTML = `${greeting}, <span class="gradient-text" id="header-user-name">${userName}</span>`;
    }
  }

  getAvatarUrl(style, seed) {
    const baseUrl = "https://api.dicebear.com/7.x";
    const encodedSeed = encodeURIComponent(seed);

    // Style-specific parameters for consistent look
    const styleParams = {
      adventurer: `backgroundColor=ffd5dc,c0aede,d1d4f9`,
      "big-smile": `backgroundColor=ffd5dc`,
      personas: ``,
      "fun-emoji": ``,
      micah: `backgroundColor=ffd5dc,c0aede`,
    };

    const params = styleParams[style] || "";
    return `${baseUrl}/${style}/svg?seed=${encodedSeed}${params ? "&" + params : ""}`;
  }

  // --- Tasks Logic ---
  initTasks() {
    const input = document.getElementById("new-task-input");
    const addBtn = document.getElementById("add-task-btn");
    const fabBtn = document.getElementById("task-fab-btn");
    const modalOverlay = document.getElementById("task-modal-overlay");
    const modalCloseBtn = document.getElementById("task-modal-close");
    const filterButtons = document.querySelectorAll(".task-filter-btn");

    const handleAdd = () => {
      if (!input) return;

      const text = input.value.trim();
      if (text) {
        this.addTask(text);
        input.value = "";
        this.closeTaskModal();
      }
    };

    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") handleAdd();
      });
    }

    if (addBtn) {
      addBtn.addEventListener("click", handleAdd);
    }

    if (fabBtn) {
      fabBtn.addEventListener("click", () => this.openTaskModal());
    }

    const headerAddBtn = document.getElementById("task-add-header-btn");
    if (headerAddBtn) {
      headerAddBtn.addEventListener("click", () => this.openTaskModal());
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener("click", () => this.closeTaskModal());
    }

    if (modalOverlay) {
      modalOverlay.addEventListener("click", (event) => {
        if (event.target === modalOverlay) {
          this.closeTaskModal();
        }
      });
    }

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const { filter } = button.dataset;
        this.setTaskFilter(filter || "all");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isTaskModalOpen) {
        this.closeTaskModal();
      }
    });

    this.initCustomDropdowns();
    this.updateTaskFilterUI();
    this.renderTasksView();
  }

  initCustomDropdowns() {
    const dropdowns = document.querySelectorAll(".custom-dropdown");

    dropdowns.forEach((dropdown) => {
      const trigger = dropdown.querySelector(".dropdown-trigger");
      const items = dropdown.querySelectorAll(".dropdown-item");
      const valueDisplay = dropdown.querySelector(".dropdown-value");
      const { target: targetId } = dropdown.dataset;
      const hiddenInput = document.getElementById(targetId);

      if (trigger) {
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".custom-dropdown.open").forEach((d) => {
            if (d !== dropdown) d.classList.remove("open");
          });
          dropdown.classList.toggle("open");
        });
      }

      items.forEach((item) => {
        item.addEventListener("click", () => {
          const { value } = item.dataset;
          const text = item.textContent.trim();

          if (valueDisplay) valueDisplay.textContent = text;
          if (hiddenInput) hiddenInput.value = value;

          items.forEach((i) => i.classList.remove("selected"));
          item.classList.add("selected");
          dropdown.classList.remove("open");
        });
      });
    });

    document.addEventListener("click", () => {
      document
        .querySelectorAll(".custom-dropdown.open")
        .forEach((d) => d.classList.remove("open"));
      document
        .querySelectorAll(".custom-time-picker.open")
        .forEach((d) => d.classList.remove("open"));
    });

    this.initTimePickers();
    lucide.createIcons();
  }

  initTimePickers() {
    const pickers = document.querySelectorAll(".custom-time-picker");

    pickers.forEach((picker) => {
      const trigger = picker.querySelector(".time-trigger");
      const options = picker.querySelectorAll(".time-option");
      const valueDisplay = picker.querySelector(".time-value");
      const { target: targetId } = picker.dataset;
      const hiddenInput = document.getElementById(targetId);

      if (trigger) {
        trigger.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll(".custom-time-picker.open").forEach((p) => {
            if (p !== picker) p.classList.remove("open");
          });
          document
            .querySelectorAll(".custom-dropdown.open")
            .forEach((d) => d.classList.remove("open"));
          picker.classList.toggle("open");
        });
      }

      options.forEach((option) => {
        option.addEventListener("click", (e) => {
          e.stopPropagation();
          const { hour } = option.dataset;
          const text = option.textContent.trim();

          if (valueDisplay) valueDisplay.textContent = text;
          if (hiddenInput) hiddenInput.value = `${hour}:00`;

          options.forEach((o) => o.classList.remove("selected"));
          option.classList.add("selected");
          picker.classList.remove("open");
        });
      });
    });
  }

  openTaskModal() {
    const modalOverlay = document.getElementById("task-modal-overlay");
    if (!modalOverlay) return;

    modalOverlay.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");
    this.isTaskModalOpen = true;

    requestAnimationFrame(() => {
      document.getElementById("new-task-input")?.focus();
    });
  }

  closeTaskModal() {
    const modalOverlay = document.getElementById("task-modal-overlay");
    if (!modalOverlay) return;

    modalOverlay.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    this.isTaskModalOpen = false;
  }

  setTaskFilter(filter) {
    this.activeTaskFilter = filter;
    this.updateTaskFilterUI();
    this.renderTasksView();
  }

  updateTaskFilterUI() {
    document.querySelectorAll(".task-filter-btn").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.filter === this.activeTaskFilter,
      );
    });
  }

  getFilteredTasks() {
    switch (this.activeTaskFilter) {
      case "today":
        return this.tasks.filter((task) => !task.completed);
      case "high":
        return this.tasks.filter(
          (task) => task.priority === "high" && !task.completed,
        );
      case "done":
        return this.tasks.filter((task) => task.completed);
      case "all":
      default:
        return [...this.tasks];
    }
  }

  sortTasks(tasks) {
    const priorityOrder = { high: 0, medium: 1, low: 2 };

    return [...tasks].sort((taskA, taskB) => {
      if (taskA.completed !== taskB.completed) {
        return taskA.completed ? 1 : -1;
      }

      const taskAPriority = priorityOrder[taskA.priority] ?? 3;
      const taskBPriority = priorityOrder[taskB.priority] ?? 3;
      if (taskAPriority !== taskBPriority) {
        return taskAPriority - taskBPriority;
      }

      if (taskA.dueTime && taskB.dueTime && taskA.dueTime !== taskB.dueTime) {
        return taskA.dueTime.localeCompare(taskB.dueTime);
      }

      if (taskA.dueTime || taskB.dueTime) {
        return taskA.dueTime ? -1 : 1;
      }

      return taskB.id - taskA.id;
    });
  }

  updateTaskProgress() {
    const totalTasks = this.tasks.length;
    const completedTasks = this.tasks.filter((task) => task.completed).length;
    const completionPercent = totalTasks
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const tasksCompletedEl = document.getElementById("tasks-completed-count");
    const progressFill = document.getElementById("task-progress-fill");
    const progressText = document.getElementById("task-progress-text");

    if (tasksCompletedEl) {
      tasksCompletedEl.textContent = completedTasks;
    }

    if (progressFill) {
      progressFill.style.width = `${completionPercent}%`;
    }

    if (progressText) {
      progressText.textContent = totalTasks
        ? `${completionPercent}% complete`
        : "No tasks yet";
    }
  }

  renderTaskEmptyState(container) {
    const emptyCopy = {
      all: {
        title: "All clear!",
        subtitle: "Add your first task and start structuring the day.",
      },
      today: {
        title: "Today's queue is clear",
        subtitle: "No active tasks are waiting right now.",
      },
      high: {
        title: "No high-priority items",
        subtitle: "Nothing urgent is currently marked high priority.",
      },
      done: {
        title: "No completed tasks yet",
        subtitle: "Check tasks off to build visible momentum here.",
      },
    };

    const copy = emptyCopy[this.activeTaskFilter] || emptyCopy.all;

    container.innerHTML = `
      <div class="empty-state">
        <img src="/illustrations/empty-tasks.png" alt="No tasks" class="empty-state-illustration" />
        <p class="empty-state-title">${copy.title}</p>
        <p class="empty-state-subtitle">${copy.subtitle}</p>
      </div>
    `;
  }

  resetTaskComposer() {
    ["task-due-time", "task-priority", "task-duration", "task-tag"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      },
    );

    document.querySelectorAll(".custom-dropdown").forEach((dropdown) => {
      const valueDisplay = dropdown.querySelector(".dropdown-value");
      const items = dropdown.querySelectorAll(".dropdown-item");
      items.forEach((item) => item.classList.remove("selected"));
      items[0]?.classList.add("selected");
      if (valueDisplay && items[0]) {
        valueDisplay.textContent = items[0].textContent.trim();
      }
    });

    document.querySelectorAll(".custom-time-picker").forEach((picker) => {
      const valueDisplay = picker.querySelector(".time-value");
      if (valueDisplay) valueDisplay.textContent = "--:--";
    });
  }

  addTask(text) {
    const dueTime = document.getElementById("task-due-time")?.value || "";
    const priority = document.getElementById("task-priority")?.value || "";
    const duration = document.getElementById("task-duration")?.value || "";
    const tag = document.getElementById("task-tag")?.value || "";

    const task = {
      id: Date.now(),
      text: text,
      completed: false,
      completedAt: null,
      dueTime: dueTime,
      priority: priority,
      duration: duration,
      tag: tag,
    };
    this.tasks.push(task);
    this.saveTasks();
    this.resetTaskComposer();
    this.renderTasksView();
  }

  toggleTask(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? this.getDateKey(new Date()) : null;
      this.saveTasks();
      this.renderTasksView();
    }
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((t) => t.id !== id);
    this.saveTasks();
    this.renderTasksView();
  }

  renderTasksView() {
    const container = document.getElementById("tasks-list-container");
    if (!container) return;

    this.updateTaskProgress();
    container.innerHTML = "";

    const filteredTasks = this.getFilteredTasks();
    const sortedTasks = this.sortTasks(filteredTasks);

    if (sortedTasks.length === 0) {
      this.renderTaskEmptyState(container);
      lucide.createIcons();
      return;
    }

    sortedTasks.forEach((task, index) => {
      const el = document.createElement("div");
      el.className = "task-item";
      el.style.animationDelay = `${index * 0.05}s`;

      let badgesHtml = "";

      if (task.dueTime) {
        const [h, m] = task.dueTime.split(":");
        const hour = parseInt(h);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        badgesHtml += `<span class="task-badge badge-time"><i data-lucide="clock" size="10"></i> ${hour12}:${m || "00"} ${ampm}</span>`;
      }

      if (task.priority) {
        const priorityLabels = { low: "Low", medium: "Med", high: "High" };
        badgesHtml += `<span class="task-badge badge-priority-${task.priority}">${priorityLabels[task.priority]}</span>`;
      }

      if (task.duration) {
        const mins = parseInt(task.duration);
        const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
        badgesHtml += `<span class="task-badge badge-duration"><i data-lucide="timer" size="10"></i> ${label}</span>`;
      }

      if (task.tag) {
        badgesHtml += `<span class="task-badge badge-tag-${task.tag}">${task.tag}</span>`;
      }

      el.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? "checked" : ""}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    ${badgesHtml ? `<div class="task-badges">${badgesHtml}</div>` : ""}
                </div>
                <button class="delete-task-btn">
                    <i data-lucide="trash-2" size="16"></i>
                </button>
            `;

      const checkbox = el.querySelector(".task-checkbox");
      checkbox.onclick = () => this.toggleTask(task.id);

      const deleteBtn = el.querySelector(".delete-task-btn");
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
    const navItems = document.querySelectorAll(".nav-item[data-view]");
    const quickActions = document.querySelectorAll("[data-view]");

    const views = {
      dashboard: document.getElementById("view-dashboard"),
      tasks: document.getElementById("view-tasks"),
      daily: document.getElementById("view-daily"),
      settings: document.getElementById("view-settings"),
      analytics: document.getElementById("view-analytics"),
      achievements: document.getElementById("view-achievements"),
      pomodoro: document.getElementById("view-pomodoro"),
    };

    // Date Display
    const dateDisplay = document.getElementById("current-date-display");
    if (dateDisplay) {
      const dateSpan = dateDisplay.querySelector("span") || dateDisplay;
      dateSpan.textContent = new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    }

    const switchView = (viewName) => {
      if (views[viewName]) {
        // Update Nav — mark active on ALL matching items (sidebar + bottom nav)
        navItems.forEach((nav) => nav.classList.remove("active"));
        document
          .querySelectorAll(`.nav-item[data-view="${viewName}"]`)
          .forEach((nav) => nav.classList.add("active"));

        // Find the currently visible view
        const currentView = Object.values(views).find(
          (el) => el && !el.classList.contains("hidden"),
        );

        const showNewView = () => {
          Object.values(views).forEach((el) => {
            if (el) {
              el.classList.add("hidden");
              el.classList.remove("view-exit");
            }
          });
          views[viewName].classList.remove("hidden");
          this.currentViewName = viewName;

          // Show FAB only on tasks view
          const fab = document.getElementById("task-fab-btn");
          if (fab) fab.style.display = viewName === "tasks" ? "flex" : "none";

          if (viewName === "tasks") {
            this.renderTasksView();
          }

          if (viewName === "daily") {
            this.renderDailyView();
            requestAnimationFrame(() => {
              this.scrollDailyTimelineToCurrentHour();
            });
          }

          // Re-trigger entrance animation
          views[viewName].style.animation = "none";
          views[viewName].offsetHeight; // force reflow
          views[viewName].style.animation = "";
        };

        // If there's a visible view that's different, play exit anim
        if (currentView && currentView !== views[viewName]) {
          currentView.classList.add("view-exit");
          setTimeout(showNewView, 200);
        } else {
          showNewView();
        }

        // Header is now scoped inside Dashboard — no need to update it per view

        // Initialize Achievements if needed
        if (viewName === "achievements" && window.renderAchievementsPage) {
          window.renderAchievementsPage();
        }

        // Initialize Analytics if needed
        if (viewName === "analytics" && window.analyticsManager) {
          window.analyticsManager.render();
        }
        // Close sidebar on mobile
        this.closeMobileSidebar();

        // Enhance view with illustrations
        if (window.celebrationManager) {
          window.celebrationManager.enhanceView(viewName);
        }
      }
    };

    this.switchView = switchView;

    // Nav items
    navItems.forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const viewName = item.dataset.view;
        switchView(viewName);
      });
    });

    // Quick action cards
    quickActions.forEach((item) => {
      if (!item.classList.contains("nav-item")) {
        item.addEventListener("click", (e) => {
          e.preventDefault();
          const viewName = item.dataset.view;
          switchView(viewName);
        });
      }
    });
  }

  // --- Mobile Navigation ---
  initMobileNav() {
    const menuBtn = document.getElementById("mobile-menu-btn");
    const closeBtn = document.getElementById("sidebar-close-btn");
    const overlay = document.getElementById("sidebar-overlay");
    const sidebar = document.getElementById("sidebar");

    if (menuBtn) {
      menuBtn.addEventListener("click", () => {
        sidebar?.classList.add("open");
        overlay?.classList.add("active");
        document.body.style.overflow = "hidden";
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeMobileSidebar());
    }

    if (overlay) {
      overlay.addEventListener("click", () => this.closeMobileSidebar());
    }

    // Close on resize above mobile breakpoint
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        this.closeMobileSidebar();
      }
    });
  }

  closeMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    sidebar?.classList.remove("open");
    overlay?.classList.remove("active");
    document.body.style.overflow = "";
  }

  updateHeaderForView() {
    // Header is scoped to the dashboard markup.
  }

  // --- Daily View ---
  renderDailyView() {
    const container = document.getElementById("hour-stack");
    const futurePanel = document.getElementById("future-hours-panel");
    const futureList = document.getElementById("future-hours-list");
    const futureCount = document.getElementById("future-hours-count");

    if (!container || !futureList || !futurePanel) return;

    container.innerHTML = "";
    futureList.innerHTML = "";

    const todayData = this.getTodayLog();
    const now = new Date();
    const currentHour = now.getHours();
    let futureHours = 0;

    for (let i = 0; i < 24; i++) {
      const hour = i;
      const log = todayData[hour];
      const isLogged = !!log;
      const isFuture = hour > currentHour;

      const timeLabel = new Date(0, 0, 0, hour).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      const box = document.createElement("div");
      box.className =
        `hour-box ${isLogged ? log.category.toLowerCase().replace("_", "-") : ""} ${isFuture ? "future" : ""} ${hour === currentHour ? "current-hour" : ""}`.trim();
      box.dataset.hour = String(hour);

      if (!isFuture) {
        box.onclick = () => this.openModal(hour, log);
      } else {
        box.title = "Cannot log future hours";
      }

      let contentHtml = "";
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
                            ${log.note ? `<p style="font-size: 0.8125rem; color: hsl(var(--foreground-muted)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px;">${log.note}</p>` : ""}
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

        const line = document.createElement("div");
        line.className = "current-time-line";
        line.style.top = `${percent}%`;
        box.appendChild(line);
      }

      if (isFuture) {
        futureHours++;
        futureList.appendChild(box);
      } else {
        container.appendChild(box);
      }
    }

    if (futureHours === 0) {
      futurePanel.classList.add("hidden");
    } else {
      futurePanel.classList.remove("hidden");
      futurePanel.open = false;
      if (futureCount) {
        futureCount.textContent = `${futureHours} upcoming hour${futureHours === 1 ? "" : "s"}`;
      }
    }

    lucide.createIcons();
  }

  scrollDailyTimelineToCurrentHour() {
    if (this.currentViewName !== "daily") return;

    const currentHourBox = document.querySelector(
      "#hour-stack .hour-box.current-hour",
    );

    if (currentHourBox) {
      // Calculate target scroll so the element is centered in the viewport
      const boxRect = currentHourBox.getBoundingClientRect();
      const targetScrollY =
        window.scrollY +
        boxRect.top -
        window.innerHeight / 2 +
        boxRect.height / 2;

      window.scrollTo({ top: Math.max(0, targetScrollY), behavior: "smooth" });
    }
  }

  // --- Modal ---
  initModal() {
    const modal = document.getElementById("log-modal");
    const closeBtn = document.getElementById("close-modal");
    const form = document.getElementById("log-form");

    if (closeBtn) closeBtn.onclick = () => this.closeModal();

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) this.closeModal();
      };
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const hour = document.getElementById("log-hour").value;
        const category = form.querySelector(
          'input[name="category"]:checked',
        ).value;
        const note = document.getElementById("log-note").value;
        this.logHour(hour, category, note);
      };
    }
  }

  openModal(hour, existingLog) {
    const modal = document.getElementById("log-modal");
    const hourInput = document.getElementById("log-hour");
    const noteInput = document.getElementById("log-note");

    if (hourInput) hourInput.value = hour;
    if (noteInput) noteInput.value = existingLog ? existingLog.note : "";

    const category = existingLog ? existingLog.category : "DEEP_WORK";
    const radio = document.querySelector(
      `input[name="category"][value="${category}"]`,
    );
    if (radio) radio.checked = true;

    if (modal) modal.classList.remove("hidden");
  }

  closeModal() {
    const modal = document.getElementById("log-modal");
    if (modal) modal.classList.add("hidden");
  }

  // --- Settings ---
  initSettings() {
    const form = document.getElementById("settings-form");
    const userNameInput = document.getElementById("setting-user-name");
    const targetInput = document.getElementById("setting-target-hours");
    const thresholdInput = document.getElementById("setting-streak-threshold");
    const thresholdDisplay = document.getElementById("streak-threshold-value");

    // Load values
    if (userNameInput) userNameInput.value = this.settings.userName || "";
    if (targetInput) targetInput.value = this.settings.targetHours;
    if (thresholdInput) thresholdInput.value = this.settings.streakThreshold;
    if (thresholdDisplay)
      thresholdDisplay.textContent = `${this.settings.streakThreshold}%`;

    if (thresholdInput) {
      thresholdInput.oninput = (e) => {
        if (thresholdDisplay)
          thresholdDisplay.textContent = `${e.target.value}%`;
      };
    }

    // Avatar style selection
    const avatarOptions = document.querySelectorAll(
      'input[name="avatar-style"]',
    );
    const savedStyle = this.settings.avatarStyle || "initials";
    avatarOptions.forEach((option) => {
      if (option.value === savedStyle) option.checked = true;
    });

    // Update avatar previews based on user name
    const updateAvatarPreviews = (name) => {
      const seed = name || "User";
      const previewImages = document.querySelectorAll(
        ".avatar-style-option img.avatar-style-preview",
      );
      previewImages.forEach((img) => {
        const input = img.previousElementSibling;
        if (input && input.value && input.value !== "initials") {
          img.src = this.getAvatarUrl(input.value, seed);
        }
      });
      // Update initial letter preview
      const initialPreview = document.querySelector(
        ".avatar-style-option .avatar-style-preview:not(img)",
      );
      if (initialPreview) {
        initialPreview.textContent = seed.charAt(0).toUpperCase();
      }
    };

    // Initialize previews with saved name
    updateAvatarPreviews(this.settings.userName);

    // Update previews when name changes
    if (userNameInput) {
      userNameInput.addEventListener("input", (e) => {
        updateAvatarPreviews(e.target.value.trim());
      });
    }

    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        if (userNameInput) this.settings.userName = userNameInput.value.trim();
        if (targetInput)
          this.settings.targetHours = parseInt(targetInput.value) || 8;
        if (thresholdInput)
          this.settings.streakThreshold = parseInt(thresholdInput.value) || 80;

        // Save avatar style
        const selectedAvatar = document.querySelector(
          'input[name="avatar-style"]:checked',
        );
        if (selectedAvatar) this.settings.avatarStyle = selectedAvatar.value;

        this.saveSettings();

        // Visual feedback
        const btn = form.querySelector('button[type="submit"]');
        if (btn) {
          const originalText = btn.innerHTML;
          btn.innerHTML =
            '<i data-lucide="check" style="width: 18px; height: 18px;"></i> Saved!';
          btn.style.background = "hsl(var(--color-success))";
          lucide.createIcons();
          setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = "";
            lucide.createIcons();
          }, 2000);
        }
      };
    }

    // Theme toggle
    const themeSwitch = document.getElementById("theme-switch");
    const themeLabel = document.getElementById("theme-label");
    const themeIconLight = document.getElementById("theme-icon-light");
    const themeIconDark = document.getElementById("theme-icon-dark");

    const updateThemeUI = () => {
      const isDark =
        document.documentElement.getAttribute("data-theme") === "dark";
      if (themeSwitch) themeSwitch.classList.toggle("active", isDark);
      if (themeLabel)
        themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
      if (themeIconLight) themeIconLight.classList.toggle("active", !isDark);
      if (themeIconDark) themeIconDark.classList.toggle("active", isDark);
    };

    updateThemeUI();

    if (themeSwitch) {
      themeSwitch.addEventListener("click", () => {
        this.toggleTheme();
        updateThemeUI();
      });
    }

    // Export data button
    const exportBtn = document.getElementById("export-data-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportData());
    }

    // Import data input
    const importInput = document.getElementById("import-data-input");
    if (importInput) {
      importInput.addEventListener("change", (e) => {
        if (e.target.files[0]) {
          this.importData(e.target.files[0]);
        }
      });
    }

    // Shortcuts button
    const shortcutsBtn = document.getElementById("show-shortcuts-btn");
    if (shortcutsBtn) {
      shortcutsBtn.addEventListener("click", () => this.showShortcutsModal());
    }
  }

  // --- Dashboard ---
  renderDashboard() {
    const todayData = this.getTodayLog();
    let deepWorkHours = 0;
    let totalLogged = 0;
    let efficiencyPoints = 0;

    const counts = {
      DEEP_WORK: 0,
      SHALLOW: 0,
      DISTRACTION: 0,
      REST: 0,
      SLEEP: 0,
      EXERCISE: 0,
    };

    Object.values(todayData).forEach((log) => {
      totalLogged++;
      if (counts[log.category] !== undefined) counts[log.category]++;

      if (log.category === "DEEP_WORK") {
        deepWorkHours++;
        efficiencyPoints += 100;
      } else if (log.category === "SHALLOW") {
        efficiencyPoints += 50;
      } else if (log.category === "DISTRACTION") {
        efficiencyPoints -= 50;
      } else if (log.category === "SLEEP") {
        totalLogged--;
      } else if (log.category === "EXERCISE") {
        efficiencyPoints += 50;
      }
    });

    const efficiency =
      totalLogged > 0
        ? Math.max(0, Math.round(efficiencyPoints / totalLogged))
        : 0;

    // Tasks completed today
    const todayKey = this.getDateKey(new Date());
    const tasksCompletedToday = this.tasks.filter(
      (t) => t.completed && t.completedAt === todayKey,
    ).length;
    const streak = this.calculateStreak();

    // Animate stats
    this.animateValue("stat-efficiency", efficiency, "%");
    this.animateValue("stat-deep-work", deepWorkHours, "h");
    this.animateValue("stat-streak", streak, "");
    this.animateValue("stat-tasks", tasksCompletedToday, "");

    // Quick stats
    const totalHoursLogged = Object.keys(this.data).reduce((acc, date) => {
      return acc + Object.keys(this.data[date]).length;
    }, 0);

    this.updateQuickStat("qs-hours", totalHoursLogged);
    this.updateQuickStat("qs-streak", streak);
    this.updateQuickStat(
      "qs-tasks",
      this.tasks.filter((t) => t.completed).length,
    );

    // Progress bar
    const progressBar = document.getElementById("deep-work-progress");
    if (progressBar) {
      const progressPercent = Math.min(
        100,
        (deepWorkHours / this.settings.targetHours) * 100,
      );
      progressBar.style.width = `${progressPercent}%`;
    }

    // Update target hours display
    const targetDisplay = document.getElementById("deep-work-target");
    if (targetDisplay)
      targetDisplay.textContent = `/ ${this.settings.targetHours}h`;

    // Streak label
    const streakLabel = document.getElementById("stat-streak-label");
    if (streakLabel)
      streakLabel.textContent = `Days above ${this.settings.streakThreshold}%`;

    // Update charts
    const weeklyStats = this.getWeeklyStats();
    this.updateCharts(counts, weeklyStats);
  }

  animateValue(elementId, endValue, suffix) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startValue = parseInt(el.textContent) || 0;
    const duration = 900;
    const startTime = performance.now();

    // Add bounce class
    el.classList.add("stat-value-animating");
    setTimeout(() => el.classList.remove("stat-value-animating"), duration);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Spring easing with slight overshoot
      const c4 = (2 * Math.PI) / 3;
      const easeOutBack =
        progress === 1
          ? 1
          : 1 +
            2.7 * Math.pow(progress - 1, 3) +
            1.7 * Math.pow(progress - 1, 2);
      const easedProgress = Math.min(easeOutBack, 1.08);

      const currentValue = Math.round(
        startValue + (endValue - startValue) * Math.min(easedProgress, 1),
      );

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
    const sortedDates = Object.keys(this.data).sort(
      (a, b) => new Date(b) - new Date(a),
    );
    if (sortedDates.length === 0) return 0;

    let streak = 0;
    const { targetHours, streakThreshold } = this.settings;
    const thresholdPercent = streakThreshold / 100;
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
      Object.values(dayLog).forEach((log) => {
        if (log.category === "DEEP_WORK") deepWork++;
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
    const weeklyCtx = document.getElementById("weeklyChart")?.getContext("2d");
    const distCtx = document
      .getElementById("distributionChart")
      ?.getContext("2d");

    if (weeklyCtx) {
      this.charts.weekly = new Chart(weeklyCtx, {
        type: "bar",
        data: {
          labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
          datasets: [
            {
              label: "Deep Work Hours",
              data: [0, 0, 0, 0, 0, 0, 0],
              backgroundColor: (ctx) => {
                const gradient = ctx.chart.ctx.createLinearGradient(
                  0,
                  0,
                  0,
                  280,
                );
                gradient.addColorStop(0, "hsl(18, 75%, 55%)");
                gradient.addColorStop(1, "hsl(42, 85%, 55%)");
                return gradient;
              },
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: {
            duration: 1000,
            easing: "easeOutQuart",
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 12,
              ticks: {
                stepSize: 2,
                callback: (value) => value + "h",
                color: "hsl(25, 10%, 50%)",
                font: { weight: 500 },
              },
              grid: {
                color: "hsl(38, 25%, 92%)",
                drawBorder: false,
              },
            },
            x: {
              grid: { display: false },
              ticks: {
                color: "hsl(25, 10%, 50%)",
                font: { weight: 500 },
              },
            },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: "hsl(25, 15%, 12%)",
              titleColor: "white",
              bodyColor: "white",
              cornerRadius: 8,
              padding: 12,
            },
          },
        },
      });
    }

    if (distCtx) {
      this.charts.distribution = new Chart(distCtx, {
        type: "doughnut",
        data: {
          labels: [
            "Deep Work",
            "Shallow",
            "Distraction",
            "Rest",
            "Sleep",
            "Exercise",
          ],
          datasets: [
            {
              data: [0, 0, 0, 0, 0, 0],
              backgroundColor: [
                "hsl(18, 75%, 55%)",
                "hsl(38, 90%, 55%)",
                "hsl(0, 65%, 55%)",
                "hsl(145, 35%, 45%)",
                "hsl(235, 30%, 35%)",
                "hsl(28, 95%, 55%)",
              ],
              borderWidth: 0,
              borderRadius: 4,
              spacing: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          animation: {
            duration: 1200,
            easing: "easeOutQuart",
          },
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "hsl(25, 10%, 40%)",
                font: { size: 12, weight: 500 },
                padding: 16,
                usePointStyle: true,
                pointStyle: "circle",
              },
            },
            tooltip: {
              backgroundColor: "hsl(25, 15%, 12%)",
              titleColor: "white",
              bodyColor: "white",
              cornerRadius: 8,
              padding: 12,
            },
          },
        },
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
        counts.EXERCISE,
      ];
      this.charts.distribution.update("none");
    }

    if (this.charts.weekly && weeklyData) {
      this.charts.weekly.data.datasets[0].data = weeklyData;
      this.charts.weekly.update("none");
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

      Object.values(dayLog).forEach((log) => {
        if (log.category === "DEEP_WORK") deepWorkCount++;
      });

      weeklyData[i] = deepWorkCount;
    }

    return weeklyData;
  }

  // --- Helpers ---
  getCategoryIcon(cat) {
    const map = {
      DEEP_WORK: "zap",
      SHALLOW: "check-square",
      DISTRACTION: "alert-circle",
      REST: "coffee",
      SLEEP: "moon",
      EXERCISE: "dumbbell",
    };
    return map[cat] || "circle";
  }

  getCategoryColorVar(cat) {
    const map = {
      DEEP_WORK: "primary",
      SHALLOW: "warning",
      DISTRACTION: "danger",
      REST: "accent",
      SLEEP: "sleep",
      EXERCISE: "exercise",
    };
    return map[cat] || "primary";
  }

  formatCategory(cat) {
    return cat
      .replace("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  window.app = new DailyTracker();
});
