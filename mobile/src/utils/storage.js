import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'daily_tracker_data_v1';
const TASKS_KEY = `${STORAGE_KEY}_tasks`;
const SETTINGS_KEY = `${STORAGE_KEY}_settings`;
const BADGES_KEY = `${STORAGE_KEY}_badges`;

// Daily time-log data: { [YYYY-MM-DD]: { [hour]: { category, note } } }
export async function loadData() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export async function saveData(data) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('[Storage] saveData error:', e);
  }
}

// Tasks: [{ id, text, completed, completedAt, dueTime, priority, duration, tag }]
export async function loadTasks() {
  try {
    const stored = await AsyncStorage.getItem(TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveTasks(tasks) {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('[Storage] saveTasks error:', e);
  }
}

// Settings: { targetHours, streakThreshold, userName, theme }
export async function loadSettings() {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_KEY);
    return stored
      ? JSON.parse(stored)
      : { targetHours: 8, streakThreshold: 80, userName: '', theme: 'light' };
  } catch {
    return { targetHours: 8, streakThreshold: 80, userName: '', theme: 'light' };
  }
}

export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('[Storage] saveSettings error:', e);
  }
}

// Unlocked badge IDs: string[]
export async function loadUnlockedBadges() {
  try {
    const stored = await AsyncStorage.getItem(BADGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export async function saveUnlockedBadges(badges) {
  try {
    await AsyncStorage.setItem(BADGES_KEY, JSON.stringify(badges));
  } catch (e) {
    console.error('[Storage] saveUnlockedBadges error:', e);
  }
}

// Export all data as a JSON string for sharing
export async function exportAllData() {
  try {
    const [data, tasks, settings] = await Promise.all([
      loadData(),
      loadTasks(),
      loadSettings(),
    ]);
    return JSON.stringify({ data, tasks, settings }, null, 2);
  } catch (e) {
    console.error('[Storage] export error:', e);
    return null;
  }
}

// Import data from a JSON string (from exportAllData)
export async function importAllData(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.data) await saveData(parsed.data);
    if (parsed.tasks) await saveTasks(parsed.tasks);
    if (parsed.settings) await saveSettings(parsed.settings);
    return true;
  } catch (e) {
    console.error('[Storage] import error:', e);
    return false;
  }
}

// Clear all app data (reset)
export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove([STORAGE_KEY, TASKS_KEY, SETTINGS_KEY, BADGES_KEY]);
  } catch (e) {
    console.error('[Storage] clearAllData error:', e);
  }
}
