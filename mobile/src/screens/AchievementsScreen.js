import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { loadData, loadTasks, loadSettings, loadUnlockedBadges, saveUnlockedBadges } from '../utils/storage';
import { BADGES, RARITY_COLORS, RARITY_LABELS, checkBadges } from '../utils/badgeManager';

const CATEGORIES_FILTER = ['all', 'streak', 'deepwork', 'tasks', 'special', 'milestone'];

export default function AchievementsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const borderColor = dark ? Colors.borderDark : Colors.border;

  const [unlockedIds, setUnlockedIds] = useState([]);
  const [filter, setFilter] = useState('all');

  useFocusEffect(
    useCallback(() => {
      async function run() {
        const [data, tasks, settings, unlocked] = await Promise.all([
          loadData(),
          loadTasks(),
          loadSettings(),
          loadUnlockedBadges(),
        ]);

        // Check for newly unlocked badges
        const newBadges = checkBadges(data, tasks, unlocked, settings.targetHours, settings.streakThreshold);
        const updatedUnlocked = [...unlocked, ...newBadges];

        if (newBadges.length > 0) {
          await saveUnlockedBadges(updatedUnlocked);
        }

        setUnlockedIds(updatedUnlocked);
      }
      run();
    }, [])
  );

  const allBadges = Object.values(BADGES);
  const filtered = allBadges.filter((b) => filter === 'all' || b.category === filter);
  const unlockedCount = allBadges.filter((b) => unlockedIds.includes(b.id)).length;

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Achievements</Text>
        <View style={styles.progressRow}>
          <Text style={[styles.progressText, { color: subColor }]}>
            {unlockedCount} / {allBadges.length} unlocked
          </Text>
          <Text style={[styles.progressPct, { color: Colors.primary }]}>
            {Math.round((unlockedCount / allBadges.length) * 100)}%
          </Text>
        </View>
        <View style={[styles.bar, { backgroundColor: dark ? '#333' : Colors.divider }]}>
          <View style={[styles.barFill, { width: `${(unlockedCount / allBadges.length) * 100}%` }]} />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        <View style={styles.filterRow}>
          {CATEGORIES_FILTER.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                { borderColor },
                filter === f && { backgroundColor: Colors.primary, borderColor: Colors.primary },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, { color: filter === f ? '#fff' : subColor }]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Badge Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const unlocked = unlockedIds.includes(item.id);
          const rarityColor = RARITY_COLORS[item.rarity];
          return (
            <View
              style={[
                styles.badgeCard,
                { backgroundColor: cardBg },
                unlocked ? [Shadow.md, { borderColor: rarityColor, borderWidth: 2 }] : { opacity: 0.45 },
              ]}
            >
              {/* Emoji */}
              <Text style={[styles.badgeEmoji, !unlocked && styles.locked]}>{item.emoji}</Text>

              {/* Rarity */}
              <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}22` }]}>
                <Text style={[styles.rarityText, { color: rarityColor }]}>
                  {RARITY_LABELS[item.rarity]}
                </Text>
              </View>

              {/* Name */}
              <Text style={[styles.badgeName, { color: unlocked ? textColor : subColor }]} numberOfLines={1}>
                {item.name}
              </Text>

              {/* Description */}
              <Text style={[styles.badgeDesc, { color: subColor }]} numberOfLines={2}>
                {item.description}
              </Text>

              {/* Unlocked Indicator */}
              {unlocked && (
                <View style={[styles.unlockedBanner, { backgroundColor: `${rarityColor}22` }]}>
                  <Text style={[styles.unlockedText, { color: rarityColor }]}>✓ Unlocked</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  headerCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  headerTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: Typography.sizes.sm },
  progressPct: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  bar: { height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },

  filterScroll: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, flexGrow: 0 },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
  filterChip: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  filterText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },

  grid: { padding: Spacing.lg, paddingTop: 0 },
  row: { gap: Spacing.md, marginBottom: Spacing.md },
  badgeCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    overflow: 'hidden',
  },
  badgeEmoji: { fontSize: 40 },
  locked: { opacity: 0.4 },
  rarityBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginBottom: Spacing.xs,
  },
  rarityText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  badgeName: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, textAlign: 'center' },
  badgeDesc: { fontSize: Typography.sizes.xs, textAlign: 'center', lineHeight: 16 },
  unlockedBanner: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: Spacing.xs,
  },
  unlockedText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
});
