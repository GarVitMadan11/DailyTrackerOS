import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/theme';

export default function App() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={dark ? 'light' : 'dark'} backgroundColor={dark ? Colors.backgroundDark : Colors.background} />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
