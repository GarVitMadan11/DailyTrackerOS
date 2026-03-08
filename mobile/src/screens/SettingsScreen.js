import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Share,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { loadSettings, saveSettings, exportAllData, importAllData, clearAllData } from '../utils/storage';

export default function SettingsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;
  const inputBg = dark ? Colors.surfaceDark : Colors.surface;
  const borderColor = dark ? Colors.borderDark : Colors.border;

  const [settings, setSettings] = useState({
    userName: '',
    targetHours: 8,
    streakThreshold: 80,
    theme: 'system',
    notificationsEnabled: false,
  });

  useFocusEffect(
    useCallback(() => {
      loadSettings().then((s) =>
        setSettings((prev) => ({ ...prev, ...s }))
      );
    }, [])
  );

  async function handleSave(partial) {
    const updated = { ...settings, ...partial };
    setSettings(updated);
    await saveSettings(updated);
  }

  async function handleExport() {
    const json = await exportAllData();
    if (!json) {
      Alert.alert('Export Failed', 'Could not export data.');
      return;
    }
    try {
      await Share.share({
        title: 'pyTron Data Export',
        message: json,
      });
    } catch {
      Alert.alert('Share Failed', 'Could not open share dialog.');
    }
  }

  function handleImport() {
    Alert.alert(
      'Import Data',
      'Paste your exported JSON to import data. This will merge with existing data. (Full import via clipboard coming in a future update.)',
      [{ text: 'OK' }]
    );
  }

  function handleReset() {
    Alert.alert(
      '⚠️ Reset All Data',
      'This will permanently delete ALL your tracking data, tasks, and achievements. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            setSettings({ userName: '', targetHours: 8, streakThreshold: 80, theme: 'system', notificationsEnabled: false });
            Alert.alert('Reset Complete', 'All data has been cleared.');
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={[styles.screen, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      {/* Profile */}
      <SectionCard title="Profile" cardBg={cardBg} textColor={textColor}>
        <View style={[styles.avatarContainer]}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.avatarText}>
              {settings.userName ? settings.userName.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>
        <FieldLabel label="Your Name" color={subColor} />
        <TextInput
          style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
          placeholder="Enter your name"
          placeholderTextColor={Colors.textMuted}
          value={settings.userName}
          onChangeText={(v) => handleSave({ userName: v })}
          returnKeyType="done"
        />
      </SectionCard>

      {/* Goals */}
      <SectionCard title="Daily Goals" cardBg={cardBg} textColor={textColor}>
        <FieldLabel label="Daily Target Hours" color={subColor} />
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[styles.stepBtn, { borderColor }]}
            onPress={() => handleSave({ targetHours: Math.max(1, settings.targetHours - 1) })}
          >
            <Text style={[styles.stepIcon, { color: Colors.primary }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.stepValue, { color: textColor }]}>{settings.targetHours} hrs</Text>
          <TouchableOpacity
            style={[styles.stepBtn, { borderColor }]}
            onPress={() => handleSave({ targetHours: Math.min(24, settings.targetHours + 1) })}
          >
            <Text style={[styles.stepIcon, { color: Colors.primary }]}>+</Text>
          </TouchableOpacity>
        </View>

        <FieldLabel label={`Streak Threshold (${settings.streakThreshold}%)`} color={subColor} />
        <Text style={[styles.rangeHint, { color: subColor }]}>
          You need {Math.ceil((settings.targetHours * settings.streakThreshold) / 100)}h to count a streak day.
        </Text>
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[styles.stepBtn, { borderColor }]}
            onPress={() => handleSave({ streakThreshold: Math.max(10, settings.streakThreshold - 10) })}
          >
            <Text style={[styles.stepIcon, { color: Colors.primary }]}>−</Text>
          </TouchableOpacity>
          <Text style={[styles.stepValue, { color: textColor }]}>{settings.streakThreshold}%</Text>
          <TouchableOpacity
            style={[styles.stepBtn, { borderColor }]}
            onPress={() => handleSave({ streakThreshold: Math.min(100, settings.streakThreshold + 10) })}
          >
            <Text style={[styles.stepIcon, { color: Colors.primary }]}>+</Text>
          </TouchableOpacity>
        </View>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" cardBg={cardBg} textColor={textColor}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.switchLabel, { color: textColor }]}>Daily Reminders</Text>
            <Text style={[styles.switchSub, { color: subColor }]}>Get reminded to log your hours</Text>
          </View>
          <Switch
            value={settings.notificationsEnabled}
            onValueChange={(v) => handleSave({ notificationsEnabled: v })}
            trackColor={{ true: Colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </SectionCard>

      {/* Data */}
      <SectionCard title="Data Management" cardBg={cardBg} textColor={textColor}>
        <ActionButton
          label="Export Data"
          emoji="📤"
          color={Colors.info}
          onPress={handleExport}
          cardBg={cardBg}
          borderColor={borderColor}
        />
        <ActionButton
          label="Import Data"
          emoji="📥"
          color={Colors.accent}
          onPress={handleImport}
          cardBg={cardBg}
          borderColor={borderColor}
        />
        <ActionButton
          label="Reset All Data"
          emoji="🗑️"
          color={Colors.danger}
          onPress={handleReset}
          cardBg={cardBg}
          borderColor={borderColor}
          destructive
        />
      </SectionCard>

      {/* About */}
      <SectionCard title="About" cardBg={cardBg} textColor={textColor}>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: subColor }]}>App</Text>
          <Text style={[styles.aboutValue, { color: textColor }]}>pyTron Mobile</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: subColor }]}>Version</Text>
          <Text style={[styles.aboutValue, { color: textColor }]}>1.0.0</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: subColor }]}>Platform</Text>
          <Text style={[styles.aboutValue, { color: textColor }]}>React Native (Expo)</Text>
        </View>
        <View style={styles.aboutRow}>
          <Text style={[styles.aboutLabel, { color: subColor }]}>Storage</Text>
          <Text style={[styles.aboutValue, { color: textColor }]}>Local (AsyncStorage)</Text>
        </View>
      </SectionCard>
    </ScrollView>
  );
}

function SectionCard({ title, children, cardBg, textColor }) {
  return (
    <View style={[styles.card, { backgroundColor: cardBg }, Shadow.sm]}>
      <Text style={[styles.cardTitle, { color: textColor }]}>{title}</Text>
      {children}
    </View>
  );
}

function FieldLabel({ label, color }) {
  return <Text style={[styles.fieldLabel, { color }]}>{label}</Text>;
}

function ActionButton({ label, emoji, color, onPress, borderColor, destructive = false }) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { borderColor: destructive ? color : borderColor }]}
      onPress={onPress}
    >
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={[styles.actionLabel, { color: destructive ? color : color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxxl },

  card: { borderRadius: Radius.lg, padding: Spacing.lg, gap: Spacing.sm },
  cardTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginBottom: Spacing.xs },

  avatarContainer: { alignItems: 'center', marginBottom: Spacing.sm },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.bold },

  fieldLabel: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold, marginTop: Spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    height: 44,
  },
  rangeHint: { fontSize: Typography.sizes.xs },

  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIcon: { fontSize: 22, fontWeight: Typography.weights.bold },
  stepValue: { flex: 1, textAlign: 'center', fontSize: Typography.sizes.xl, fontWeight: Typography.weights.bold },

  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  switchLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },
  switchSub: { fontSize: Typography.sizes.xs },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  actionEmoji: { fontSize: 20 },
  actionLabel: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.semibold },

  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.xs },
  aboutLabel: { fontSize: Typography.sizes.sm },
  aboutValue: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.semibold },
});
