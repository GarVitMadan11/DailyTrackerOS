import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Vibration,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';

const DEFAULT_WORK = 25;
const DEFAULT_BREAK = 5;
const DEFAULT_LONG_BREAK = 15;
const SESSIONS_UNTIL_LONG = 4;

export default function PomodoroScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const [phase, setPhase] = useState('work'); // 'work' | 'break' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK * 60);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [todaySessions, setTodaySessions] = useState([]);
  const [workMins, setWorkMins] = useState(DEFAULT_WORK);
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK);
  const [longBreakMins, setLongBreakMins] = useState(DEFAULT_LONG_BREAK);

  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase]);

  function handleSessionComplete() {
    setRunning(false);
    Vibration.vibrate([0, 400, 200, 400]);

    if (phase === 'work') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      const session = { startedAt: new Date().toISOString(), duration: workMins };
      setTodaySessions((prev) => [...prev, session]);

      const isLong = newCount % SESSIONS_UNTIL_LONG === 0;
      const nextPhase = isLong ? 'longBreak' : 'break';
      Alert.alert(
        '🎉 Session Complete!',
        `Great work! Time for a ${isLong ? 'long ' : ''}break.`,
        [{ text: 'Start Break', onPress: () => startPhase(nextPhase) }, { text: 'Not Now' }]
      );
    } else {
      Alert.alert(
        '☕ Break Over!',
        'Ready to focus again?',
        [{ text: 'Start Work', onPress: () => startPhase('work') }, { text: 'Not Yet' }]
      );
    }
  }

  function startPhase(newPhase) {
    setPhase(newPhase);
    const mins = newPhase === 'work' ? workMins : newPhase === 'break' ? breakMins : longBreakMins;
    setTimeLeft(mins * 60);
    setRunning(true);
  }

  function toggleRunning() {
    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    const mins = phase === 'work' ? workMins : phase === 'break' ? breakMins : longBreakMins;
    setTimeLeft(mins * 60);
  }

  function skipToNext() {
    setRunning(false);
    if (phase === 'work') {
      const newCount = sessionsCompleted + 1;
      setSessionsCompleted(newCount);
      const isLong = newCount % SESSIONS_UNTIL_LONG === 0;
      startPhase(isLong ? 'longBreak' : 'break');
    } else {
      startPhase('work');
    }
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalSeconds = (phase === 'work' ? workMins : phase === 'break' ? breakMins : longBreakMins) * 60;
  const progressPct = Math.max(0, ((totalSeconds - timeLeft) / totalSeconds) * 100);

  const phaseColor =
    phase === 'work' ? Colors.primary : phase === 'break' ? Colors.success : Colors.categories.sleep;
  const phaseLabel =
    phase === 'work' ? '🧠 Focus Session' : phase === 'break' ? '☕ Short Break' : '😴 Long Break';

  const sessionCount = sessionsCompleted % SESSIONS_UNTIL_LONG;
  const sessionDots = Array.from({ length: SESSIONS_UNTIL_LONG }, (_, i) => i < sessionCount);

  return (
    <ScrollView style={[styles.screen, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      {/* Phase Label */}
      <Text style={[styles.phaseLabel, { color: phaseColor }]}>{phaseLabel}</Text>

      {/* Timer Ring */}
      <View style={[styles.timerRing, { borderColor: phaseColor }]}>
        <View style={[styles.progressArc, { borderColor: phaseColor }]} />
        <Text style={[styles.timerText, { color: textColor }]}>{timeStr}</Text>
        <Text style={[styles.timerSub, { color: subColor }]}>
          {running ? 'Focus!' : 'Paused'}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressBar, { backgroundColor: dark ? '#333' : Colors.divider }]}>
        <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: phaseColor }]} />
      </View>

      {/* Session Dots */}
      <View style={styles.dotsRow}>
        {sessionDots.map((done, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: done ? phaseColor : (dark ? '#333' : Colors.border) }]} />
        ))}
      </View>
      <Text style={[styles.dotsLabel, { color: subColor }]}>
        {sessionsCompleted} sessions today
      </Text>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: dark ? '#333' : Colors.divider }]} onPress={reset}>
          <Text style={styles.controlIcon}>↺</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.playBtn, { backgroundColor: phaseColor }, Shadow.md]} onPress={toggleRunning}>
          <Text style={styles.playIcon}>{running ? '⏸' : '▶'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.controlBtn, { backgroundColor: dark ? '#333' : Colors.divider }]} onPress={skipToNext}>
          <Text style={styles.controlIcon}>⏭</Text>
        </TouchableOpacity>
      </View>

      {/* Phase Switcher */}
      <View style={styles.phaseSwitcher}>
        {[
          { id: 'work', label: 'Work', mins: workMins, color: Colors.primary },
          { id: 'break', label: 'Break', mins: breakMins, color: Colors.success },
          { id: 'longBreak', label: 'Long Break', mins: longBreakMins, color: Colors.categories.sleep },
        ].map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.phaseBtn,
              { borderColor: p.color },
              phase === p.id && { backgroundColor: p.color },
            ]}
            onPress={() => { setRunning(false); setPhase(p.id); setTimeLeft(p.mins * 60); }}
          >
            <Text style={[styles.phaseBtnText, { color: phase === p.id ? '#fff' : p.color }]}>
              {p.label}
            </Text>
            <Text style={[styles.phaseBtnMins, { color: phase === p.id ? '#ffffffaa' : subColor }]}>
              {p.mins}m
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Settings */}
      <View style={[styles.settingsCard, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.settingsTitle, { color: textColor }]}>Timer Settings</Text>
        {[
          { label: 'Work', value: workMins, setter: (v) => { setWorkMins(v); if (phase === 'work') { setRunning(false); setTimeLeft(v * 60); } }, min: 5, max: 90 },
          { label: 'Short Break', value: breakMins, setter: (v) => { setBreakMins(v); if (phase === 'break') { setRunning(false); setTimeLeft(v * 60); } }, min: 1, max: 30 },
          { label: 'Long Break', value: longBreakMins, setter: (v) => { setLongBreakMins(v); if (phase === 'longBreak') { setRunning(false); setTimeLeft(v * 60); } }, min: 5, max: 60 },
        ].map((setting) => (
          <View key={setting.label} style={styles.settingRow}>
            <Text style={[styles.settingLabel, { color: subColor }]}>{setting.label}</Text>
            <TouchableOpacity
              style={[styles.settingBtn, { borderColor: Colors.border }]}
              onPress={() => setting.setter(Math.max(setting.min, setting.value - 5))}
            >
              <Text style={{ color: Colors.primary, fontSize: 18 }}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.settingVal, { color: textColor }]}>{setting.value}m</Text>
            <TouchableOpacity
              style={[styles.settingBtn, { borderColor: Colors.border }]}
              onPress={() => setting.setter(Math.min(setting.max, setting.value + 5))}
            >
              <Text style={{ color: Colors.primary, fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Today's Sessions */}
      {todaySessions.length > 0 && (
        <View style={[styles.settingsCard, { backgroundColor: cardBg }, Shadow.sm]}>
          <Text style={[styles.settingsTitle, { color: textColor }]}>Today's Sessions</Text>
          {todaySessions.map((s, i) => (
            <View key={i} style={styles.sessionRow}>
              <Text style={{ color: Colors.primary }}>🍅</Text>
              <Text style={[styles.sessionText, { color: textColor }]}>
                {s.duration} min session
              </Text>
              <Text style={[styles.sessionTime, { color: subColor }]}>
                {new Date(s.startedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', padding: Spacing.xl, gap: Spacing.lg, paddingBottom: Spacing.xxxl },

  phaseLabel: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },

  timerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  progressArc: { position: 'absolute' },
  timerText: { fontSize: Typography.sizes.display, fontWeight: Typography.weights.extrabold, letterSpacing: 2 },
  timerSub: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.medium },

  progressBar: { width: '100%', height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: Radius.full },

  dotsRow: { flexDirection: 'row', gap: Spacing.sm },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotsLabel: { fontSize: Typography.sizes.sm },

  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xl },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlIcon: { fontSize: 22 },
  playBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: { fontSize: 30 },

  phaseSwitcher: { flexDirection: 'row', gap: Spacing.sm, alignSelf: 'stretch' },
  phaseBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  phaseBtnText: { fontSize: Typography.sizes.xs, fontWeight: Typography.weights.bold },
  phaseBtnMins: { fontSize: Typography.sizes.xs },

  settingsCard: { borderRadius: Radius.lg, padding: Spacing.lg, width: '100%', gap: Spacing.md },
  settingsTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  settingLabel: { flex: 1, fontSize: Typography.sizes.sm },
  settingBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingVal: { fontSize: Typography.sizes.md, fontWeight: Typography.weights.bold, minWidth: 36, textAlign: 'center' },

  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sessionText: { flex: 1, fontSize: Typography.sizes.sm },
  sessionTime: { fontSize: Typography.sizes.xs },
});
