// Badge/Achievement system – ported from web app's badges.js
import { getTotalDeepWorkHours, getCompletedTasksCount, getCurrentStreak } from './dataManager';

export const BADGES = {
  // Streak Badges
  fire_starter: {
    id: 'fire_starter',
    name: 'Fire Starter',
    emoji: '🔥',
    description: 'Maintain a 7-day streak',
    category: 'streak',
    rarity: 'common',
    requiredStreak: 7,
  },
  hot_streak: {
    id: 'hot_streak',
    name: 'Hot Streak',
    emoji: '⚡',
    description: 'Maintain a 30-day streak',
    category: 'streak',
    rarity: 'rare',
    requiredStreak: 30,
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    emoji: '🌟',
    description: 'Maintain a 100-day streak',
    category: 'streak',
    rarity: 'legendary',
    requiredStreak: 100,
  },

  // Deep Work Badges
  focused: {
    id: 'focused',
    name: 'Focused',
    emoji: '🎯',
    description: 'Log 10 hours of deep work',
    category: 'deepwork',
    rarity: 'common',
    requiredDeepWork: 10,
  },
  deep_diver: {
    id: 'deep_diver',
    name: 'Deep Diver',
    emoji: '🌊',
    description: 'Log 50 hours of deep work',
    category: 'deepwork',
    rarity: 'rare',
    requiredDeepWork: 50,
  },
  flow_master: {
    id: 'flow_master',
    name: 'Flow Master',
    emoji: '💫',
    description: 'Log 100 hours of deep work',
    category: 'deepwork',
    rarity: 'legendary',
    requiredDeepWork: 100,
  },

  // Task Badges
  starter: {
    id: 'starter',
    name: 'Starter',
    emoji: '✅',
    description: 'Complete 10 tasks',
    category: 'tasks',
    rarity: 'common',
    requiredTasks: 10,
  },
  achiever: {
    id: 'achiever',
    name: 'Achiever',
    emoji: '🏆',
    description: 'Complete 50 tasks',
    category: 'tasks',
    rarity: 'rare',
    requiredTasks: 50,
  },
  completionist: {
    id: 'completionist',
    name: 'Completionist',
    emoji: '👑',
    description: 'Complete 100 tasks',
    category: 'tasks',
    rarity: 'legendary',
    requiredTasks: 100,
  },

  // Special Badges
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    emoji: '🌅',
    description: 'Log work before 7 AM',
    category: 'special',
    rarity: 'rare',
  },
  night_owl: {
    id: 'night_owl',
    name: 'Night Owl',
    emoji: '🦉',
    description: 'Log work after 10 PM',
    category: 'special',
    rarity: 'rare',
  },
  century_club: {
    id: 'century_club',
    name: 'Century Club',
    emoji: '💯',
    description: 'Log 100 total hours',
    category: 'milestone',
    rarity: 'legendary',
    requiredHours: 100,
  },
  weekend_warrior: {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    emoji: '🛡️',
    description: 'Log deep work on a weekend',
    category: 'special',
    rarity: 'common',
  },
};

export const RARITY_COLORS = {
  common: '#6B8F6B',
  rare: '#4A90E2',
  legendary: '#F5A623',
};

export const RARITY_LABELS = {
  common: 'Common',
  rare: 'Rare',
  legendary: 'Legendary',
};

/**
 * Check which badges should now be unlocked and return newly unlocked badge IDs.
 * @param {Object} data       All daily logs
 * @param {Array}  tasks      All tasks
 * @param {Array}  unlockedIds Already-unlocked badge IDs
 * @param {number} targetHours
 * @param {number} threshold
 * @returns {string[]} Newly unlocked badge IDs
 */
export function checkBadges(data, tasks, unlockedIds, targetHours = 8, threshold = 80) {
  const streak = getCurrentStreak(data, targetHours, threshold);
  const deepWorkHours = getTotalDeepWorkHours(data);
  const completedTasks = getCompletedTasksCount(tasks);

  // Total hours logged (all categories)
  const totalHours = Object.values(data).reduce((sum, dayLog) => {
    return sum + Object.keys(dayLog).length;
  }, 0);

  // Early bird / night owl check
  let hasEarlyBird = false;
  let hasNightOwl = false;
  let hasWeekendWarrior = false;

  Object.entries(data).forEach(([dateKey, dayLog]) => {
    const date = new Date(dateKey);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    Object.entries(dayLog).forEach(([hour, entry]) => {
      const h = parseInt(hour, 10);
      if (h < 7) hasEarlyBird = true;
      if (h >= 22) hasNightOwl = true;
      if (isWeekend && entry.category === 'deepWork') hasWeekendWarrior = true;
    });
  });

  const conditions = {
    fire_starter: streak >= 7,
    hot_streak: streak >= 30,
    inferno: streak >= 100,
    focused: deepWorkHours >= 10,
    deep_diver: deepWorkHours >= 50,
    flow_master: deepWorkHours >= 100,
    starter: completedTasks >= 10,
    achiever: completedTasks >= 50,
    completionist: completedTasks >= 100,
    early_bird: hasEarlyBird,
    night_owl: hasNightOwl,
    century_club: totalHours >= 100,
    weekend_warrior: hasWeekendWarrior,
  };

  const newlyUnlocked = [];
  Object.entries(conditions).forEach(([id, met]) => {
    if (met && !unlockedIds.includes(id)) {
      newlyUnlocked.push(id);
    }
  });
  return newlyUnlocked;
}
