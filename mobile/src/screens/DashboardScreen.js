import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import StatCard from '../components/StatCard';
import { loadData, loadTasks, loadSettings } from '../utils/storage';
import {
  getDateKey,
  getGreeting,
  countHoursPerCategory,
  getProductiveHours,
  getCurrentStreak,
  getTotalDeepWorkHours,
  getCompletedTasksCount,
  getWeeklySummary,
  CATEGORIES,
} from '../utils/dataManager';

export default function DashboardScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const [data, setData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState({ targetHours: 8, streakThreshold: 80, userName: '' });
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [d, t, s] = await Promise.all([loadData(), loadTasks(), loadSettings()]);
    setData(d);
    setTasks(t);
    setSettings(s);
  }, []);

  // Reload every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  const today = getDateKey();
  const todayLog = data[today] || {};
  const todayHours = countHoursPerCategory(todayLog);
  const productiveToday = getProductiveHours(todayLog);
  const streak = getCurrentStreak(data, settings.targetHours, settings.streakThreshold);
  const deepWorkTotal = getTotalDeepWorkHours(data);
  const completedTasks = getCompletedTasksCount(tasks);
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const targetHours = settings.targetHours || 8;
  const progressPct = Math.min(100, Math.round((productiveToday / targetHours) * 100));
  const userName = settings.userName || 'Champion';
  const greeting = getGreeting();
  const weekly = getWeeklySummary(data, 7);
  // Maximum hours to display in today's category bars (cap at 16 to keep bars proportional)
  const MAX_CATEGORY_DISPLAY_HOURS = 16;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: bg }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Welcome */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
          <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greeting, { color: subColor }]}>{greeting},</Text>
          <Text style={[styles.userName, { color: textColor }]}>{userName} 👋</Text>
        </View>
        <View style={[styles.streakBadge, { backgroundColor: `${Colors.primary}22` }]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={[styles.streakNum, { color: Colors.primary }]}>{streak}</Text>
        </View>
      </View>

      {/* Daily Goal Progress */}
      <View style={[styles.progressCard, { backgroundColor: cardBg }, Shadow.md]}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressTitle, { color: textColor }]}>Today's Progress</Text>
          <Text style={[styles.progressPct, { color: Colors.primary }]}>{progressPct}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: dark ? '#333' : Colors.divider }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? Colors.success : Colors.primary },
            ]}
          />
        </View>
        <Text style={[styles.progressSub, { color: subColor }]}>
          {productiveToday}h productive of {targetHours}h target
        </Text>
      </View>

      {/* Stat Cards Row 1 */}
      <View style={styles.row}>
        <StatCard label="Deep Work" value={todayHours.deepWork} unit="hrs" emoji="🧠" color={Colors.categories.deepWork} dark={dark} />
        <StatCard label="Streak" value={streak} unit="days" emoji="🔥" color={Colors.primary} dark={dark} />
      </View>

      {/* Stat Cards Row 2 */}
      <View style={styles.row}>
        <StatCard label="Tasks Done" value={completedTasks} emoji="✅" color={Colors.success} dark={dark} />
        <StatCard label="Pending" value={pendingTasks} emoji="📋" color={Colors.warning} dark={dark} />
      </View>

      {/* Stat Cards Row 3 */}
      <View style={styles.row}>
        <StatCard label="Total Deep Work" value={deepWorkTotal} unit="hrs" emoji="💪" color={Colors.categories.deepWork} dark={dark} />
        <StatCard label="Exercise" value={todayHours.exercise} unit="hrs" emoji="🏃" color={Colors.categories.exercise} dark={dark} />
      </View>

      {/* Today's Breakdown */}
      <View style={[styles.card, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>Today's Hours</Text>
        {CATEGORIES.map((cat) => {
          const val = todayHours[cat.key] || 0;
          const pct = Math.min(100, (val / MAX_CATEGORY_DISPLAY_HOURS) * 100);
          return (
            <View key={cat.key} style={styles.categoryRow}>
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, { color: subColor }]}>{cat.label}</Text>
              <View style={[styles.miniBar, { backgroundColor: dark ? '#333' : Colors.divider }]}>
                <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={[styles.catVal, { color: cat.color }]}>{val}h</Text>
            </View>
          );
        })}
      </View>

      {/* 7-Day Weekly Overview */}
      <View style={[styles.card, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.cardTitle, { color: textColor }]}>7-Day Overview</Text>
        <View style={styles.weeklyRow}>
          {weekly.map((day) => {
            const heightPct = Math.min(100, (day.productive / (targetHours || 1)) * 100);
            return (
              <View key={day.date} style={styles.dayCol}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${Math.max(4, heightPct)}%`, backgroundColor: Colors.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.dayLabel, { color: subColor }]}>{day.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  greeting: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },
  userName: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: 4,
  },
  streakEmoji: { fontSize: 18 },
  streakNum: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },

  progressCard: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  progressTitle: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  progressPct: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
  progressBar: { height: 10, borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', borderRadius: Radius.full },
  progressSub: { fontSize: Typography.sizes.sm },

  row: { flexDirection: 'row', marginBottom: Spacing.xs },

  card: { borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginBottom: Spacing.md },

  categoryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  catEmoji: { fontSize: 16, width: 22 },
  catLabel: { fontSize: Typography.sizes.sm, width: 100 },
  miniBar: { flex: 1, height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  miniBarFill: { height: '100%', borderRadius: Radius.full },
  catVal: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, width: 28, textAlign: 'right' },

  weeklyRow: { flexDirection: 'row', height: 80, alignItems: 'flex-end', gap: Spacing.xs },
  dayCol: { flex: 1, alignItems: 'center', gap: 4 },
  barContainer: { flex: 1, width: '80%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: Radius.sm, minHeight: 4 },
  dayLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.medium },
});
