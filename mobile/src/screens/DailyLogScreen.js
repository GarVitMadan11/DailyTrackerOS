import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import CategoryBadge from '../components/CategoryBadge';
import { loadData, saveData } from '../utils/storage';
import { getDateKey, CATEGORIES, countHoursPerCategory } from '../utils/dataManager';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(h) {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

export default function DailyLogScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const inputBg = dark ? Colors.surfaceDark : Colors.surface;
  const borderColor = dark ? Colors.borderDark : Colors.border;

  const [data, setData] = useState({});
  const [selectedDate, setSelectedDate] = useState(getDateKey());
  const [modalHour, setModalHour] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [noteText, setNoteText] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData().then(setData);
    }, [])
  );

  const dayLog = data[selectedDate] || {};
  const hourCounts = countHoursPerCategory(dayLog);

  function openHourModal(hour) {
    const existing = dayLog[hour];
    setModalHour(hour);
    setSelectedCategory(existing?.category || '');
    setNoteText(existing?.note || '');
  }

  async function saveHour() {
    if (!selectedCategory) {
      Alert.alert('Select Category', 'Please select a category before saving.');
      return;
    }
    const updated = {
      ...data,
      [selectedDate]: {
        ...dayLog,
        [modalHour]: { category: selectedCategory, note: noteText.trim() },
      },
    };
    setData(updated);
    await saveData(updated);
    setModalHour(null);
  }

  async function clearHour() {
    const updatedDay = { ...dayLog };
    delete updatedDay[modalHour];
    const updated = { ...data, [selectedDate]: updatedDay };
    setData(updated);
    await saveData(updated);
    setModalHour(null);
  }

  function getHourColor(hour) {
    const entry = dayLog[hour];
    if (!entry?.category) return null;
    return CATEGORIES.find((c) => c.key === entry.category)?.color || null;
  }

  // Navigate dates
  function goDate(offset) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    const newKey = getDateKey(d);
    if (newKey <= getDateKey()) setSelectedDate(newKey);
  }

  const isToday = selectedDate === getDateKey();
  const displayDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Date Selector */}
      <View style={[styles.datePicker, { backgroundColor: cardBg }, Shadow.sm]}>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDate(-1)}>
          <Text style={[styles.arrow, { color: Colors.primary }]}>‹</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.dateText, { color: textColor }]}>{displayDate}</Text>
          {isToday && (
            <View style={[styles.todayBadge, { backgroundColor: `${Colors.primary}22` }]}>
              <Text style={[styles.todayText, { color: Colors.primary }]}>Today</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.arrowBtn} onPress={() => goDate(1)} disabled={isToday}>
          <Text style={[styles.arrow, { color: isToday ? Colors.textMuted : Colors.primary }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Category Summary */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
        <View style={styles.summaryRow}>
          {CATEGORIES.map((cat) => (
            <View key={cat.key} style={[styles.summaryChip, { backgroundColor: `${cat.color}22`, borderColor: `${cat.color}66` }]}>
              <Text style={styles.summaryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.summaryVal, { color: cat.color }]}>{hourCounts[cat.key]}h</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Hour Grid */}
      <ScrollView contentContainerStyle={styles.grid}>
        {HOURS.map((h) => {
          const color = getHourColor(h);
          const entry = dayLog[h];
          const cat = entry?.category ? CATEGORIES.find((c) => c.key === entry.category) : null;
          return (
            <TouchableOpacity
              key={h}
              style={[
                styles.hourCell,
                { backgroundColor: color ? `${color}22` : dark ? Colors.cardDark : Colors.card },
                color && { borderColor: `${color}88`, borderWidth: 1.5 },
                Shadow.sm,
              ]}
              onPress={() => openHourModal(h)}
              accessibilityLabel={`Hour ${formatHour(h)}, ${cat ? cat.label : 'unlogged'}`}
            >
              <Text style={[styles.hourLabel, { color: color || subColor }]}>{formatHour(h)}</Text>
              {cat ? (
                <View style={styles.hourContent}>
                  <Text style={styles.hourEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.hourCat, { color }]} numberOfLines={1}>
                    {cat.label}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.hourEmpty, { color: subColor }]}>— Tap to log —</Text>
              )}
              {entry?.note ? (
                <Text style={[styles.hourNote, { color: subColor }]} numberOfLines={1}>
                  📝 {entry.note}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Log Hour Modal */}
      <Modal visible={modalHour !== null} animationType="slide" transparent onRequestClose={() => setModalHour(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: cardBg }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Log {modalHour !== null ? formatHour(modalHour) : ''}
            </Text>

            {/* Category Picker */}
            <Text style={[styles.fieldLabel, { color: subColor }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <CategoryBadge
                  key={cat.key}
                  category={cat}
                  selected={selectedCategory === cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  size="md"
                />
              ))}
            </View>

            {/* Note */}
            <Text style={[styles.fieldLabel, { color: subColor }]}>Note (optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
              placeholder="What were you doing?"
              placeholderTextColor={Colors.textMuted}
              value={noteText}
              onChangeText={setNoteText}
              multiline
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              {dayLog[modalHour] && (
                <TouchableOpacity style={[styles.clearBtn, { borderColor: Colors.danger }]} onPress={clearHour}>
                  <Text style={[styles.clearBtnText, { color: Colors.danger }]}>Clear</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalHour(null)}>
                <Text style={[styles.cancelText, { color: subColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={saveHour}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  arrowBtn: { padding: Spacing.sm },
  arrow: { fontSize: 28, fontWeight: Typography.weights.bold },
  dateText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  todayBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  todayText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },

  summaryScroll: { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  summaryEmoji: { fontSize: 14 },
  summaryVal: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold },

  grid: { padding: Spacing.lg, gap: Spacing.sm },
  hourCell: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: 4,
    minHeight: 60,
  },
  hourLabel: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.semibold },
  hourContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hourEmoji: { fontSize: 16 },
  hourCat: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
  hourEmpty: { fontSize: Typography.sizes.xs, fontStyle: 'italic' },
  hourNote: { fontSize: Typography.sizes.xs },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: Colors.overlay },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  modalTitle: { fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold, marginBottom: Spacing.sm },
  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginTop: Spacing.sm },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    minHeight: 56,
  },
  modalActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md, justifyContent: 'flex-end' },
  clearBtn: { flex: 1, borderWidth: 1.5, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  clearBtnText: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  cancelBtn: { flex: 1, padding: Spacing.md, alignItems: 'center' },
  cancelText: { fontSize: Typography.sizes.md },
  saveBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold },
});
