import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

/**
 * A glassmorphism-inspired stat card used across the app.
 *
 * Props:
 *   label     {string}  – card title
 *   value     {string|number}  – primary metric
 *   unit      {string}  – optional unit label (e.g. "hrs")
 *   emoji     {string}  – decorative emoji
 *   color     {string}  – accent colour for the left border
 *   dark      {boolean} – dark-mode flag
 */
export default function StatCard({ label, value, unit = '', emoji, color = Colors.primary, dark = false }) {
  const bg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  return (
    <View style={[styles.card, { backgroundColor: bg, borderLeftColor: color }, Shadow.sm]}>
      <View style={styles.topRow}>
        {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
        <Text style={[styles.label, { color: subColor }]}>{label}</Text>
      </View>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color }]}>{value}</Text>
        {unit ? <Text style={[styles.unit, { color: subColor }]}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.md,
    borderLeftWidth: 4,
    padding: Spacing.lg,
    flex: 1,
    minWidth: 140,
    margin: Spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: 6,
  },
  emoji: {
    fontSize: Typography.sizes.lg,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    flexShrink: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  unit: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
  },
});
