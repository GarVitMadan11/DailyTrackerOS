import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../theme';

/**
 * A pill-shaped category badge / filter chip.
 *
 * Props:
 *   category  {Object}   – { key, label, emoji, color }
 *   selected  {boolean}  – whether this chip is active/selected
 *   onPress   {Function} – tap handler
 *   size      {'sm'|'md'} – badge size variant
 */
export default function CategoryBadge({ category, selected = false, onPress, size = 'md' }) {
  const isSmall = size === 'sm';

  return (
    <TouchableOpacity
      style={[
        styles.badge,
        isSmall && styles.badgeSm,
        selected
          ? { backgroundColor: category.color, borderColor: category.color }
          : { backgroundColor: `${category.color}22`, borderColor: `${category.color}66` },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={isSmall ? styles.emojiSm : styles.emoji}>{category.emoji}</Text>
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSm,
          { color: selected ? '#fff' : category.color },
        ]}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  emoji: {
    fontSize: 15,
  },
  emojiSm: {
    fontSize: 12,
  },
  label: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
  },
  labelSm: {
    fontSize: Typography.sizes.xs,
  },
});
