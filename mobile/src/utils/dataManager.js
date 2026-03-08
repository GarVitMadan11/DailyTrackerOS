// Core data-management helpers (ported from web app's app.js logic)

/** Return 'YYYY-MM-DD' for a given Date in local timezone */
export function getDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}

/** Categories and their display metadata */
export const CATEGORIES = [
  { key: 'deepWork',     label: 'Deep Work',     emoji: '🧠', color: '#4A90E2' },
  { key: 'shallowWork',  label: 'Shallow Work',  emoji: '💼', color: '#7EC8E3' },
  { key: 'distraction',  label: 'Distraction',   emoji: '📵', color: '#E74C3C' },
  { key: 'rest',         label: 'Rest',           emoji: '☕', color: '#82C882' },
  { key: 'sleep',        label: 'Sleep',          emoji: '😴', color: '#9B59B6' },
  { key: 'exercise',     label: 'Exercise',       emoji: '🏃', color: '#E67E22' },
];

export const CATEGORY_KEYS = CATEGORIES.map((c) => c.key);

/** Task priority levels */
export const PRIORITIES = [
  { value: 'high',   label: 'High',   color: '#E74C3C' },
  { value: 'medium', label: 'Medium', color: '#F39C12' },
  { value: 'low',    label: 'Low',    color: '#27AE60' },
];

/** Task tags */
export const TAGS = ['work', 'personal', 'health', 'learning', 'finance', 'social'];

/**
 * Count hours per category for a given day's log.
 * @param {Object} dayLog  { [hour]: { category, note } }
 * @returns {Object}  { deepWork: n, shallowWork: n, ... }
 */
export function countHoursPerCategory(dayLog = {}) {
  const counts = Object.fromEntries(CATEGORIES.map((c) => [c.key, 0]));
  Object.values(dayLog).forEach(({ category }) => {
    if (category && counts[category] !== undefined) {
      counts[category]++;
    }
  });
  return counts;
}

/**
 * Total productive hours = deepWork + shallowWork for a day.
 */
export function getProductiveHours(dayLog = {}) {
  const counts = countHoursPerCategory(dayLog);
  return counts.deepWork + counts.shallowWork;
}

/**
 * Compute current streak (consecutive days meeting productivity threshold).
 * @param {Object} data       All daily logs { [YYYY-MM-DD]: dayLog }
 * @param {number} targetHours
 * @param {number} threshold  Percentage (0-100)
 */
export function getCurrentStreak(data, targetHours = 8, threshold = 80) {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getDateKey(d);
    const dayLog = data[key] || {};
    const productive = getProductiveHours(dayLog);
    const required = (targetHours * threshold) / 100;

    if (productive >= required) {
      streak++;
    } else if (i > 0) {
      break; // streak broken
    }
  }
  return streak;
}

/**
 * Sum of all deep-work hours ever logged.
 */
export function getTotalDeepWorkHours(data) {
  let total = 0;
  Object.values(data).forEach((dayLog) => {
    const counts = countHoursPerCategory(dayLog);
    total += counts.deepWork;
  });
  return total;
}

/**
 * Number of completed tasks.
 */
export function getCompletedTasksCount(tasks) {
  return tasks.filter((t) => t.completed).length;
}

/**
 * Build productivity summary for the last N days.
 * Returns array of { date, deepWork, shallowWork, distraction, rest, sleep, exercise, productive }
 */
export function getWeeklySummary(data, days = 7) {
  const result = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = getDateKey(d);
    const dayLog = data[key] || {};
    const counts = countHoursPerCategory(dayLog);
    result.push({
      date: key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      ...counts,
      productive: counts.deepWork + counts.shallowWork,
    });
  }
  return result;
}

/**
 * Hourly distribution: how many times each hour (0-23) had any activity.
 * Returns array of 24 numbers.
 */
export function getHourlyDistribution(data) {
  const counts = new Array(24).fill(0);
  Object.values(data).forEach((dayLog) => {
    Object.keys(dayLog).forEach((hour) => {
      const h = parseInt(hour, 10);
      if (!isNaN(h) && h >= 0 && h < 24) {
        counts[h]++;
      }
    });
  });
  return counts;
}

/**
 * Create a new task object.
 */
export function createTask({ text, dueTime = '', priority = '', duration = '', tag = '' }) {
  return {
    id: Date.now(),
    text,
    completed: false,
    completedAt: null,
    dueTime,
    priority,
    duration,
    tag,
    createdAt: getDateKey(new Date()),
  };
}

/**
 * Get greeting based on time of day.
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
