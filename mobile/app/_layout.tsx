import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useAppTheme } from '../hooks/useAppTheme';
import { useAuthStore } from '../store/useAuthStore';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBoundary from '../components/ErrorBoundary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 30,
      retry: (failureCount, error: any) => {
        const status = error?.response?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
    },
  },
});

export default function Layout() {
  // isReady: onboarding check is done
  const [isReady, setIsReady] = useState(false);
  // isHydrated: auth store has been restored from AsyncStorage
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);

  const { isDarkMode } = useAppTheme();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // ─── Step 1: Restore persisted auth session ─────────────────────────────────
  // This runs BEFORE any navigation decision is made.
  // It waits for AsyncStorage (Zustand persist) to hydrate the auth store,
  // and performs a background /auth/me validation.
  //
  // CRITICAL: setIsHydrated(true) fires AFTER checkAuth() resolves so that
  // navigation guards never run before we know the true auth state.
  useEffect(() => {
    const prepare = async () => {
      try {
        const onboardingDone = await AsyncStorage.getItem('agrinex_onboarding_completed');
        setHasSeenOnboarding(onboardingDone === 'true');
      } catch (_) {}

      // checkAuth validates the stored token against /auth/me.
      // On Render cold start / 5xx it PRESERVES the session rather than clearing it.
      // It only clears on confirmed 401 Unauthorized.
      try {
        await checkAuth();
      } catch (_) {
        // Even if checkAuth throws (shouldn't), proceed — session preserved by store
      }

      // Mark app as ready and hydrated at the same time after auth resolution
      setIsReady(true);
      setIsHydrated(true);
    };

    prepare();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Step 2: Apply navigation guards once auth is known ────────────────────
  useEffect(() => {
    // Wait until both onboarding check and auth hydration are complete
    if (!isReady || !isHydrated) return;

    const initialSegment = segments[0] as string | undefined;

    // Never redirect from splash/index during animation
    if (!initialSegment || initialSegment === 'splash') return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentScreen = segments[1] as string | undefined;
    const { user } = useAuthStore.getState();

    if (
      !isAuthenticated &&
      !inAuthGroup &&
      segments[0] !== 'onboarding' &&
      segments[0] !== 'redirect'
    ) {
      // Unauthenticated — route to onboarding or welcome
      if (!hasSeenOnboarding) {
        router.replace('/onboarding');
      } else {
        router.replace('/(auth)/welcome');
      }
    } else if (isAuthenticated) {
      const needsPasswordSetup =
        user && (user.password_setup_required === true || user.is_password_set === false);

      if (needsPasswordSetup) {
        if (currentScreen !== 'set-password') {
          router.replace('/(auth)/set-password');
        }
      } else if (inAuthGroup) {
        // Authenticated user trying to access auth screens — redirect to app
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, segments, isReady, isHydrated, hasSeenOnboarding]);

  // ─── Custom theme ─────────────────────────────────────────────────────────
  const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;
  const customTheme = {
    ...navigationTheme,
    colors: {
      ...navigationTheme.colors,
      primary: '#16A34A',
      background: isDarkMode ? '#06131D' : '#F8FAFC',
      card: isDarkMode ? '#102235' : '#FFFFFF',
      text: isDarkMode ? '#FFFFFF' : '#0F172A',
      border: isDarkMode ? 'rgba(22,163,74,0.25)' : '#E2E8F0',
    },
  };

  // Show blank screen while hydrating — prevents flash of login screen for authenticated users
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: customTheme.colors.background }}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={customTheme}>
        <ErrorBoundary>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
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
