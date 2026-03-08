import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

/**
 * A single task row with toggle + delete actions.
 *
 * Props:
 *   task      {Object}   – task data object
 *   onToggle  {Function} – called with task.id to toggle completion
 *   onDelete  {Function} – called with task.id to delete
 *   dark      {boolean}  – dark-mode flag
 */
export default function TaskItem({ task, onToggle, onDelete, dark = false }) {
  const bg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const priorityColor =
    task.priority === 'high'
      ? Colors.priorityHigh
      : task.priority === 'medium'
      ? Colors.priorityMedium
      : task.priority === 'low'
      ? Colors.priorityLow
      : Colors.textMuted;

  function confirmDelete() {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(task.id) },
    ]);
  }

  function formatDueTime(timeStr) {
    if (!timeStr) return null;
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m || '00'} ${ampm}`;
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }, Shadow.sm]}>
      {/* Checkbox */}
      <TouchableOpacity
        style={[styles.checkbox, task.completed && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
        onPress={() => onToggle(task.id)}
        accessibilityLabel={task.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        <Text
          style={[
            styles.text,
            { color: textColor },
            task.completed && styles.completedText,
          ]}
          numberOfLines={2}
        >
          {task.text}
        </Text>

        {/* Badges */}
        <View style={styles.badges}>
          {task.priority ? (
            <View style={[styles.badge, { borderColor: priorityColor }]}>
              <Text style={[styles.badgeText, { color: priorityColor }]}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </Text>
            </View>
          ) : null}

          {task.dueTime ? (
            <View style={[styles.badge, { borderColor: Colors.info }]}>
              <Text style={[styles.badgeText, { color: Colors.info }]}>
                ⏰ {formatDueTime(task.dueTime)}
              </Text>
            </View>
          ) : null}

          {task.tag ? (
            <View style={[styles.badge, { borderColor: Colors.accent }]}>
              <Text style={[styles.badgeText, { color: Colors.accent }]}>#{task.tag}</Text>
            </View>
          ) : null}

          {task.duration ? (
            <View style={[styles.badge, { borderColor: subColor }]}>
              <Text style={[styles.badgeText, { color: subColor }]}>{task.duration} min</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Delete */}
      <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} accessibilityLabel="Delete task">
        <Text style={styles.deleteIcon}>🗑️</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  checkmark: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: Typography.weights.bold,
  },
  content: {
    flex: 1,
    gap: Spacing.xs,
  },
  text: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    lineHeight: 22,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.semibold,
  },
  deleteBtn: {
    padding: Spacing.xs,
    flexShrink: 0,
  },
  deleteIcon: {
    fontSize: 18,
  },
});
