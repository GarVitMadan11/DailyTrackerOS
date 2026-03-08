import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import TaskItem from '../components/TaskItem';
import { loadTasks, saveTasks } from '../utils/storage';
import { createTask, PRIORITIES, TAGS } from '../utils/dataManager';

const FILTERS = ['all', 'active', 'completed'];

export default function TasksScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const inputBg = dark ? Colors.surfaceDark : Colors.surface;
  const borderColor = dark ? Colors.borderDark : Colors.border;

  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [taskText, setTaskText] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('');
  const [duration, setDuration] = useState('');
  const [tag, setTag] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadTasks().then(setTasks);
    }, [])
  );

  async function handleAdd() {
    if (!taskText.trim()) return;
    const task = createTask({ text: taskText.trim(), dueTime, priority, duration, tag });
    const updated = [task, ...tasks];
    setTasks(updated);
    await saveTasks(updated);
    resetForm();
  }

  function resetForm() {
    setTaskText('');
    setDueTime('');
    setPriority('');
    setDuration('');
    setTag('');
    setModalVisible(false);
  }

  async function handleToggle(id) {
    const updated = tasks.map((t) =>
      t.id === id
        ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString().split('T')[0] : null }
        : t
    );
    setTasks(updated);
    await saveTasks(updated);
  }

  async function handleDelete(id) {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    await saveTasks(updated);
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.progressCard, { backgroundColor: cardBg }, Shadow.sm]}>
          <View style={styles.progressRow}>
            <Text style={[styles.progressLabel, { color: subColor }]}>
              {completedCount}/{tasks.length} tasks
            </Text>
            <Text style={[styles.progressPct, { color: Colors.primary }]}>{progressPct}%</Text>
          </View>
          <View style={[styles.bar, { backgroundColor: dark ? '#333' : Colors.divider }]}>
            <View style={[styles.barFill, { width: `${progressPct}%` }]} />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
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
      </View>

      {/* Task List */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={[styles.emptyTitle, { color: textColor }]}>No tasks yet</Text>
          <Text style={[styles.emptySub, { color: subColor }]}>Tap + to add your first task</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TaskItem task={item} onToggle={handleToggle} onDelete={handleDelete} dark={dark} />
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={[styles.fab, Shadow.lg]} onPress={() => setModalVisible(true)} accessibilityLabel="Add task">
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Add Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={resetForm}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>New Task</Text>
              <TouchableOpacity onPress={resetForm}>
                <Text style={[styles.closeBtn, { color: subColor }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Task Text */}
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="What do you need to do?"
                placeholderTextColor={Colors.textMuted}
                value={taskText}
                onChangeText={setTaskText}
                multiline
                autoFocus
              />

              {/* Due Time */}
              <Text style={[styles.fieldLabel, { color: subColor }]}>Due Time (optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="HH:MM (e.g. 14:30)"
                placeholderTextColor={Colors.textMuted}
                value={dueTime}
                onChangeText={setDueTime}
                keyboardType="numbers-and-punctuation"
              />

              {/* Priority */}
              <Text style={[styles.fieldLabel, { color: subColor }]}>Priority</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map((p) => (
                  <TouchableOpacity
                    key={p.value}
                    style={[
                      styles.chip,
                      { borderColor: p.color },
                      priority === p.value && { backgroundColor: p.color },
                    ]}
                    onPress={() => setPriority(priority === p.value ? '' : p.value)}
                  >
                    <Text style={[styles.chipText, { color: priority === p.value ? '#fff' : p.color }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tag */}
              <Text style={[styles.fieldLabel, { color: subColor }]}>Tag</Text>
              <View style={styles.chipRow}>
                {TAGS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.chip,
                      { borderColor: Colors.accent },
                      tag === t && { backgroundColor: Colors.accent },
                    ]}
                    onPress={() => setTag(tag === t ? '' : t)}
                  >
                    <Text style={[styles.chipText, { color: tag === t ? '#fff' : Colors.accent }]}>
                      #{t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Duration */}
              <Text style={[styles.fieldLabel, { color: subColor }]}>Est. Duration (minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                placeholder="e.g. 30"
                placeholderTextColor={Colors.textMuted}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[styles.addBtn, !taskText.trim() && styles.addBtnDisabled]}
                onPress={handleAdd}
                disabled={!taskText.trim()}
              >
                <Text style={styles.addBtnText}>Add Task</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  header: { padding: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.md },

  progressCard: { borderRadius: Radius.md, padding: Spacing.md, gap: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: Typography.sizes.sm },
  progressPct: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },
  bar: { height: 6, borderRadius: Radius.full, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: Radius.full },

  filters: { flexDirection: 'row', gap: Spacing.sm },
  filterBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  list: { padding: Spacing.lg, paddingTop: 0 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  emptySub: { fontSize: Typography.sizes.md },

  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },
  closeBtn: { fontSize: Typography.sizes.xl, padding: Spacing.xs },

  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    minHeight: 44,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  chipText: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },

  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: '#fff', fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
});
