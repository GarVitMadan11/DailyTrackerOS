import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme, Platform } from 'react-native';
import { Colors, Typography } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import TasksScreen from '../screens/TasksScreen';
import DailyLogScreen from '../screens/DailyLogScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import PomodoroScreen from '../screens/PomodoroScreen';
import AchievementsScreen from '../screens/AchievementsScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

// Emoji icons are used instead of @expo/vector-icons to keep the dependency minimal
// and ensure they render identically on iOS and Android without additional native setup.
const TAB_ICONS = {
  Dashboard: '🏠',
  Tasks: '✅',
  'Daily Log': '📅',
  Analytics: '📊',
  Pomodoro: '🍅',
  Achievements: '🏅',
  Settings: '⚙️',
};

export default function AppNavigator() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  const tabBarBg = dark ? Colors.cardDark : Colors.surface;
  const tabBarBorder = dark ? Colors.borderDark : Colors.border;
  const inactiveColor = dark ? Colors.textSecondaryDark : Colors.textSecondary;

  const screenOptions = ({ route }) => ({
    headerStyle: {
      backgroundColor: dark ? Colors.cardDark : Colors.surface,
      elevation: 0,
      shadowOpacity: 0,
      borderBottomWidth: 1,
      borderBottomColor: tabBarBorder,
    },
    headerTitleStyle: {
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.weights.bold,
      color: dark ? Colors.textDark : Colors.text,
    },
    tabBarIcon: ({ focused }) => {
      const icon = TAB_ICONS[route.name];
      return (
        <React.Fragment>
          <TabIcon icon={icon} focused={focused} />
        </React.Fragment>
      );
    },
    tabBarActiveTintColor: Colors.primary,
    tabBarInactiveTintColor: inactiveColor,
    tabBarStyle: {
      backgroundColor: tabBarBg,
      borderTopColor: tabBarBorder,
      borderTopWidth: 1,
      paddingBottom: Platform.OS === 'ios' ? 20 : 6,
      paddingTop: 6,
      height: Platform.OS === 'ios' ? 80 : 60,
    },
    tabBarLabelStyle: {
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.weights.semibold,
    },
  });

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen name="Daily Log" component={DailyLogScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Pomodoro" component={PomodoroScreen} />
      <Tab.Screen name="Achievements" component={AchievementsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function TabIcon({ icon, focused }) {
  const { Text } = require('react-native');
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{icon}</Text>
  );
}
