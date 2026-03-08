import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { Colors, Typography, Spacing, Radius, Shadow } from '../theme';
import { loadData, loadSettings } from '../utils/storage';
import {
  getWeeklySummary,
  getHourlyDistribution,
  getTotalDeepWorkHours,
  CATEGORIES,
} from '../utils/dataManager';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const CHART_HEIGHT = 180;

function chartConfig(dark) {
  return {
    backgroundColor: dark ? Colors.cardDark : Colors.card,
    backgroundGradientFrom: dark ? Colors.cardDark : Colors.card,
    backgroundGradientTo: dark ? Colors.cardDark : Colors.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(217, 119, 65, ${opacity})`,
    labelColor: () => (dark ? Colors.textSecondaryDark : Colors.textSecondary),
    style: { borderRadius: Radius.md },
    propsForDots: { r: '4', strokeWidth: '1', stroke: Colors.primary },
  };
}

export default function AnalyticsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const bg = dark ? Colors.backgroundDark : Colors.background;
  const cardBg = dark ? Colors.cardDark : Colors.card;
  const textColor = dark ? Colors.textDark : Colors.text;
  const subColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const [data, setData] = useState({});
  const [settings, setSettings] = useState({ targetHours: 8 });

  useFocusEffect(
    useCallback(() => {
      Promise.all([loadData(), loadSettings()]).then(([d, s]) => {
        setData(d);
        setSettings(s);
      });
    }, [])
  );

  const weekly = getWeeklySummary(data, 7);
  const hourly = getHourlyDistribution(data);
  const deepWorkTotal = getTotalDeepWorkHours(data);
  const totalDays = Object.keys(data).length;

  // Category totals for pie chart
  const categoryTotals = CATEGORIES.map((cat) => {
    let total = 0;
    Object.values(data).forEach((dayLog) => {
      Object.values(dayLog).forEach((entry) => {
        if (entry.category === cat.key) total++;
      });
    });
    return { ...cat, total };
  }).filter((c) => c.total > 0);

  const pieData = categoryTotals.map((cat) => ({
    name: cat.label,
    population: cat.total,
    color: cat.color,
    legendFontColor: dark ? Colors.textSecondaryDark : Colors.textSecondary,
    legendFontSize: 12,
  }));

  const barData = {
    labels: weekly.map((d) => d.label),
    datasets: [{ data: weekly.map((d) => d.productive || 0) }],
  };

  // Hourly line chart (show every 3 hours to keep labels readable)
  const hourlyLabels = ['12a', '3a', '6a', '9a', '12p', '3p', '6p', '9p'];
  const hourlyGrouped = [0, 3, 6, 9, 12, 15, 18, 21].map((start) =>
    hourly.slice(start, start + 3).reduce((a, b) => a + b, 0)
  );
  const lineData = {
    labels: hourlyLabels,
    datasets: [{ data: hourlyGrouped, color: (o = 1) => `rgba(217,119,65,${o})`, strokeWidth: 2 }],
  };

  return (
    <ScrollView style={[styles.screen, { backgroundColor: bg }]} contentContainerStyle={styles.content}>
      {/* Overview Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Days Logged', value: totalDays, emoji: '📅', color: Colors.primary },
          { label: 'Deep Work hrs', value: deepWorkTotal, emoji: '🧠', color: Colors.categories.deepWork },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: cardBg }, Shadow.sm]}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: subColor }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Weekly Bar Chart */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.chartTitle, { color: textColor }]}>7-Day Productive Hours</Text>
        {weekly.some((d) => d.productive > 0) ? (
          <BarChart
            data={barData}
            width={CHART_WIDTH - Spacing.lg * 2}
            height={CHART_HEIGHT}
            chartConfig={chartConfig(dark)}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        ) : (
          <EmptyChart dark={dark} />
        )}
      </View>

      {/* Hourly Line Chart */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.chartTitle, { color: textColor }]}>Hourly Activity Pattern</Text>
        {hourly.some((v) => v > 0) ? (
          <LineChart
            data={lineData}
            width={CHART_WIDTH - Spacing.lg * 2}
            height={CHART_HEIGHT}
            chartConfig={chartConfig(dark)}
            style={styles.chart}
            bezier
            fromZero
          />
        ) : (
          <EmptyChart dark={dark} />
        )}
      </View>

      {/* Category Breakdown Pie Chart */}
      {pieData.length > 0 && (
        <View style={[styles.chartCard, { backgroundColor: cardBg }, Shadow.sm]}>
          <Text style={[styles.chartTitle, { color: textColor }]}>Category Breakdown</Text>
          <PieChart
            data={pieData}
            width={CHART_WIDTH - Spacing.lg * 2}
            height={CHART_HEIGHT}
            chartConfig={chartConfig(dark)}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="12"
            style={styles.chart}
          />
        </View>
      )}

      {/* Category Stats Table */}
      <View style={[styles.chartCard, { backgroundColor: cardBg }, Shadow.sm]}>
        <Text style={[styles.chartTitle, { color: textColor }]}>All-Time Category Hours</Text>
        {CATEGORIES.map((cat) => {
          let total = 0;
          Object.values(data).forEach((dayLog) => {
            Object.values(dayLog).forEach((entry) => {
              if (entry.category === cat.key) total++;
            });
          });
          const maxTotal = Math.max(...CATEGORIES.map((c) => {
            let t = 0;
            Object.values(data).forEach((dl) => Object.values(dl).forEach((e) => { if (e.category === c.key) t++; }));
            return t;
          }), 1);
          const pct = (total / maxTotal) * 100;

          return (
            <View key={cat.key} style={styles.tableRow}>
              <Text style={styles.tableEmoji}>{cat.emoji}</Text>
              <Text style={[styles.tableLabel, { color: subColor }]}>{cat.label}</Text>
              <View style={[styles.tableBar, { backgroundColor: dark ? '#333' : Colors.divider }]}>
                <View style={[styles.tableBarFill, { width: `${pct}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={[styles.tableVal, { color: cat.color }]}>{total}h</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function EmptyChart({ dark }) {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyChartEmoji}>📊</Text>
      <Text style={[styles.emptyChartText, { color: dark ? Colors.textSecondaryDark : Colors.textSecondary }]}>
        No data yet — start logging hours!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl, gap: Spacing.md },

  statsRow: { flexDirection: 'row', gap: Spacing.md },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statEmoji: { fontSize: 28 },
  statValue: { fontSize: Typography.sizes.xxxl, fontWeight: Typography.weights.extrabold },
  statLabel: { fontSize: Typography.sizes.sm, textAlign: 'center' },

  chartCard: { borderRadius: Radius.lg, padding: Spacing.lg },
  chartTitle: { fontSize: Typography.sizes.lg, fontWeight: Typography.weights.bold, marginBottom: Spacing.md },
  chart: { borderRadius: Radius.md, marginLeft: -Spacing.sm },

  emptyChart: { height: CHART_HEIGHT, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyChartEmoji: { fontSize: 36 },
  emptyChartText: { fontSize: Typography.sizes.sm },

  tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm, gap: Spacing.sm },
  tableEmoji: { fontSize: 16, width: 22 },
  tableLabel: { fontSize: Typography.sizes.sm, width: 100 },
  tableBar: { flex: 1, height: 8, borderRadius: Radius.full, overflow: 'hidden' },
  tableBarFill: { height: '100%', borderRadius: Radius.full },
  tableVal: { fontSize: Typography.sizes.sm, fontWeight: Typography.weights.bold, width: 30, textAlign: 'right' },
});
