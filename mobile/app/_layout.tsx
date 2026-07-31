import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useThemeStore } from '../store/useThemeStore';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuthStore } from '../store/useAuthStore';
import Colors from '../constants/Colors';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ErrorBoundary from '../components/ErrorBoundary';

const queryClient = new QueryClient();

export default function Layout() {
  const [isReady, setIsReady] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const { isDarkMode } = useAppTheme();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const prepare = async () => {
      // Check onboarding status
      try {
        const onboardingDone = await AsyncStorage.getItem('agrinex_onboarding_completed');
        setHasSeenOnboarding(onboardingDone === 'true');
      } catch (_) {}

      // Add 10-second max timeout to handle Render cold starts gracefully
      const authTimeout = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.log('[Layout] Auth check timed out after 10s — continuing');
          resolve();
        }, 10000);
      });

      const authCheck = (async () => {
        try {
          await checkAuth();
        } catch (e) {
          console.log('[Layout] Auth check failed:', e);
        }
      })();

      await Promise.race([authCheck, authTimeout]);
      setIsReady(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Bypass navigation guards for splash / index route to let animation complete
    const initialSegment = segments[0] as string | undefined;
    if (!initialSegment || initialSegment === 'splash') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup && segments[0] !== 'onboarding' && segments[0] !== 'redirect') {
      // Route to onboarding first if not seen, otherwise to welcome
      if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(auth)/welcome');
      }
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated and trying to access auth screens
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isReady, hasSeenOnboarding]);

  // Sync navigation theme with our store
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  
  // Custom theme adjustments to match our branding
  const customTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      primary: '#16A34A',
      background: isDarkMode ? '#06131D' : '#F8FAFC',
      card: isDarkMode ? '#102235' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#0F172A',
      border: isDarkMode ? 'rgba(22,163,74,0.25)' : '#E2E8F0',
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: customTheme.colors.background }}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={customTheme}>
        <ErrorBoundary>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style={isDarkMode ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: customTheme.colors.background },
              }}
            >
              <Stack.Screen name="splash" />
              <Stack.Screen name="onboarding" options={{ animation: 'slide_from_right', animationDuration: 500 }} />
              <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
              <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
              <Stack.Screen name="messages" options={{ presentation: 'card' }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            </Stack>
          </GestureHandlerRootView>
        </ErrorBoundary>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

