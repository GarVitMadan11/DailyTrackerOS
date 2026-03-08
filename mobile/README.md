# pyTron Mobile

React Native (Expo) mobile app for **pyTron – Daily Performance Tracker**.  
A pixel-perfect port of the web app, built for iOS and Android using the same data structures and feature set.

---

## 📱 Features

| Screen | Description |
|--------|-------------|
| **Dashboard** | Daily progress, streak, productive hours, 7-day overview |
| **Tasks** | Create, filter (all / active / done), complete, and delete tasks with priority, tag, duration, and due-time |
| **Daily Log** | Hour-by-hour category logging (Deep Work, Shallow Work, Distraction, Rest, Sleep, Exercise) with date navigation |
| **Analytics** | Bar chart (7-day), line chart (hourly pattern), pie chart (category breakdown), all-time stats table |
| **Pomodoro** | Configurable work / break / long-break timer, session dots, haptic feedback on completion |
| **Achievements** | Full badge system (streak, deep-work, tasks, special) with rarity tiers (Common → Rare → Legendary) |
| **Settings** | Name, daily goal, streak threshold, notifications toggle, data export/import, full data reset |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+  
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (`npm install -g expo-cli`)  
- [Expo Go](https://expo.dev/go) app on your iOS or Android device (for development)

### Installation

```bash
# From the repository root
cd mobile

npm install
```

### Running the App

```bash
# Start the Expo development server
npm start

# Open on Android
npm run android

# Open on iOS (Mac only)
npm run ios
```

Then scan the QR code with **Expo Go** (Android) or the Camera app (iOS).

---

## 🏗️ Project Structure

```
mobile/
├── App.js                      # Root component (navigation container + status bar)
├── app.json                    # Expo configuration (icons, splash, permissions)
├── package.json                # Dependencies
└── src/
    ├── navigation/
    │   └── AppNavigator.js     # Bottom-tab navigator (7 tabs)
    ├── screens/
    │   ├── DashboardScreen.js
    │   ├── TasksScreen.js
    │   ├── DailyLogScreen.js
    │   ├── AnalyticsScreen.js
    │   ├── PomodoroScreen.js
    │   ├── AchievementsScreen.js
    │   └── SettingsScreen.js
    ├── components/
    │   ├── StatCard.js         # Metric card with accent border
    │   ├── TaskItem.js         # Task row with toggle + delete
    │   └── CategoryBadge.js   # Pill-shaped category chip
    ├── theme/
    │   └── index.js            # Colors, typography, spacing, shadows
    └── utils/
        ├── storage.js          # AsyncStorage CRUD (mirrors localStorage from web)
        ├── dataManager.js      # Pure data helpers (streak, hourly counts, summaries)
        └── badgeManager.js    # Badge definitions + unlock logic
```

---

## 🎨 Design System

The mobile app uses the **same design language** as the web version:

| Token | Value |
|-------|-------|
| Primary (terracotta) | `#D97741` |
| Secondary (gold) | `#F5A623` |
| Accent (sage) | `#6B8F6B` |
| Background (light) | `#FAF6F1` |
| Deep Work | `#4A90E2` |
| Exercise | `#E67E22` |
| Sleep | `#9B59B6` |

Dark mode is **automatically enabled** based on the device's system appearance (`useColorScheme`).

---

## 💾 Data Storage

Data is stored locally on the device using **AsyncStorage** (the React Native equivalent of `localStorage`).  
The storage keys match the web app exactly so that a JSON export from the web can be imported into the mobile app:

| Key | Contents |
|-----|----------|
| `daily_tracker_data_v1` | Hour-by-hour daily logs |
| `daily_tracker_data_v1_tasks` | Task list |
| `daily_tracker_data_v1_settings` | User settings |
| `daily_tracker_data_v1_badges` | Unlocked badge IDs |

Use **Settings → Export Data** to share a JSON file, and **Settings → Import Data** to restore.

---

## 🏅 Badge System

Badges are checked automatically whenever the Achievements screen is focused.

| Category | Badges |
|----------|--------|
| Streak | Fire Starter (7d) · Hot Streak (30d) · Inferno (100d) |
| Deep Work | Focused (10h) · Deep Diver (50h) · Flow Master (100h) |
| Tasks | Starter (10) · Achiever (50) · Completionist (100) |
| Special | Early Bird · Night Owl · Weekend Warrior |
| Milestone | Century Club (100 total hours) |

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `expo ~52` | Managed React Native workflow |
| `react-native 0.76` | Core framework |
| `@react-navigation/native` | Navigation container |
| `@react-navigation/bottom-tabs` | Tab bar navigation |
| `@react-native-async-storage/async-storage` | Local data persistence |
| `react-native-chart-kit` | Bar, line, and pie charts |
| `react-native-svg` | SVG rendering for charts |
| `expo-haptics` | Vibration feedback |
| `expo-notifications` | Push notification support |

---

## 🛠️ Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure your project (first time)
eas build:configure

# Build for Android (APK/AAB)
eas build --platform android

# Build for iOS (IPA)
eas build --platform ios
```

See [Expo EAS Build docs](https://docs.expo.dev/build/introduction/) for full details.

---

## 🔄 Syncing with the Web App

Both apps share the same JSON data schema. To move data:

1. **Web → Mobile**: In the web app, go to Settings → Export Data → copy the JSON → paste into Settings → Import Data on mobile.  
2. **Mobile → Web**: In the mobile app, go to Settings → Export Data → share the JSON → paste into the web app's import field.

> **Note:** Cloud sync between web and mobile is on the feature roadmap. Currently all data lives on the respective device.
