import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/useAuthStore';

const { width, height } = Dimensions.get('window');
const ONBOARDING_KEY = 'agrinex_onboarding_completed';

const STAGES = [
  { label: 'Seed', icon: '🌱' },
  { label: 'Sprout', icon: '🌿' },
  { label: 'Leaf', icon: '🍃' },
  { label: 'Healthy Plant', icon: '🌾' },
];

export default function Splash() {
  const router = useRouter();
  const { checkAuth } = useAuthStore();

  const [activeStage, setActiveStage] = useState(0);

  // Animations
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;
  const stagesOpacity = useRef(new Animated.Value(0)).current;

  // Particle positions
  const particles = useRef(
    Array.from({ length: 12 }).map(() => ({
      x: Math.random() * width,
      y: useRef(new Animated.Value(height + 20)).current,
      size: Math.random() * 6 + 4,
      opacity: Math.random() * 0.5 + 0.3,
      duration: Math.random() * 2000 + 2000,
    }))
  ).current;

  useEffect(() => {
    // 1. Floating particles loop
    particles.forEach((p) => {
      Animated.loop(
        Animated.timing(p.y, {
          toValue: -50,
          duration: p.duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });

    // 2. Main entrance animation sequence
    Animated.parallel([
      // Logo scale & fade
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Soft glow
      Animated.timing(glowOpacity, {
        toValue: 0.8,
        duration: 1000,
        delay: 300,
        useNativeDriver: true,
      }),
      // Title & Subtitle
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 700,
        delay: 400,
        useNativeDriver: true,
      }),
      // Stages indicator
      Animated.timing(stagesOpacity, {
        toValue: 1,
        duration: 600,
        delay: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Stage step timer (Seed -> Sprout -> Leaf -> Healthy Plant)
    const stageTimer1 = setTimeout(() => setActiveStage(1), 750);
    const stageTimer2 = setTimeout(() => setActiveStage(2), 1500);
    const stageTimer3 = setTimeout(() => setActiveStage(3), 2250);

    // 4. Final navigation transition (Duration: 3.0s)
    const navTimer = setTimeout(async () => {
      try {
        await checkAuth();
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        const isAuthed = useAuthStore.getState().isAuthenticated;

        if (onboardingDone === 'true') {
          if (isAuthed) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/welcome');
          }
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        console.error('[Splash] Navigation error:', e);
        router.replace('/onboarding');
      }
    }, 3000);

    return () => {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(navTimer);
    };
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Dark Green Gradient Background */}
      <LinearGradient
        colors={['#064E3B', '#022C22', '#011710']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Floating Soft Particles */}
      {particles.map((p, idx) => (
        <Animated.View
          key={idx}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              left: p.x,
              width: p.size,
              height: p.size,
              borderRadius: p.size / 2,
              opacity: p.opacity,
              transform: [{ translateY: p.y }],
            },
          ]}
        />
      ))}

      {/* Center Hero */}
      <View style={styles.centerContent}>
        {/* AgriNex Title & Subtitle */}
        <Animated.View
          style={{
            opacity: textOpacity,
            transform: [
              { translateY: textTranslateY },
              { scale: logoScale }
            ],
            alignItems: 'center',
            marginBottom: 32,
          }}
        >
          <Text style={styles.brandTitle}>AgriNex AI</Text>
          <Text style={styles.brandSubtitle}>Smart Farming Powered by AI</Text>
        </Animated.View>

        {/* Growth Stage Progress Bar: Seed -> Sprout -> Leaf -> Healthy Plant */}
        <Animated.View style={[styles.stagesContainer, { opacity: stagesOpacity }]}>
          <View style={styles.stagesRow}>
            {STAGES.map((stage, idx) => {
              const isActive = idx <= activeStage;
              const isCurrent = idx === activeStage;
              return (
                <React.Fragment key={stage.label}>
                  <View style={styles.stageNode}>
                    <View
                      style={[
                        styles.stageDot,
                        isActive && styles.stageDotActive,
                        isCurrent && styles.stageDotCurrent,
                      ]}
                    >
                      <Text style={styles.stageEmoji}>{stage.icon}</Text>
                    </View>
                    <Text
                      style={[
                        styles.stageText,
                        isActive && styles.stageTextActive,
                      ]}
                    >
                      {stage.label}
                    </Text>
                  </View>
                  {idx < STAGES.length - 1 && (
                    <View
                      style={[
                        styles.stageConnector,
                        idx < activeStage && styles.stageConnectorActive,
                      ]}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>AGRINEX AI SYSTEM v1.0</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#022C22',
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#4ADE80',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  brandTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#86EFAC',
    letterSpacing: 0.8,
    textAlign: 'center',
    marginBottom: 36,
  },
  stagesContainer: {
    width: width - 64,
    alignItems: 'center',
    marginTop: 10,
  },
  stagesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageNode: {
    alignItems: 'center',
  },
  stageDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: '#22C55E',
  },
  stageDotCurrent: {
    backgroundColor: '#16A34A',
    borderColor: '#86EFAC',
    transform: [{ scale: 1.15 }],
  },
  stageEmoji: {
    fontSize: 16,
  },
  stageText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 6,
  },
  stageTextActive: {
    color: '#DCFCE7',
    fontWeight: '700',
  },
  stageConnector: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 4,
    marginBottom: 16,
  },
  stageConnectorActive: {
    backgroundColor: '#22C55E',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 2,
  },
});