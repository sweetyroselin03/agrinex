import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface BrandLogoProps {
  size?: number;
  animated?: boolean;
  style?: ViewStyle;
  isDarkMode?: boolean;
  showName?: boolean;
  layout?: 'horizontal' | 'vertical';
}

/** Vector AgriNex Smart Leaf + AI Circuit pattern SVG icon */
export function AgriNexIcon({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Defs>
        <LinearGradient id="agriGreen" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#10B981" />
          <Stop offset="50%" stopColor="#059669" />
          <Stop offset="100%" stopColor="#047857" />
        </LinearGradient>
        <LinearGradient id="aiGlow" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#34D399" />
          <Stop offset="100%" stopColor="#059669" />
        </LinearGradient>
        <LinearGradient id="goldAccent" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </LinearGradient>
      </Defs>

      {/* Hexagonal Tech Shield Background */}
      <Path
        d="M24 4L40 12V32L24 44L8 32V12L24 4Z"
        fill="url(#agriGreen)"
        fillOpacity={0.15}
        stroke="url(#agriGreen)"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Growing Sprout / Plant Leaf Structure */}
      <Path
        d="M24 38V18"
        stroke="url(#aiGlow)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <Path
        d="M24 26C20 23 14 24 14 24C14 24 15 30 24 32"
        fill="url(#agriGreen)"
        stroke="url(#agriGreen)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24 21C28 18 34 19 34 19C34 19 33 25 24 27"
        fill="url(#aiGlow)"
        stroke="url(#aiGlow)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Golden Sunrise / AI Node Orbit */}
      <Circle cx={24} cy={14} r={3.5} fill="url(#goldAccent)" />
      <Circle cx={14} cy={24} r={2.5} fill="#34D399" />
      <Circle cx={34} cy={19} r={2.5} fill="#34D399" />
      <Circle cx={24} cy={38} r={3} fill="#059669" />

      {/* Circuit Connections */}
      <Path
        d="M24 14C18 14 14 18 14 24"
        stroke="url(#aiGlow)"
        strokeWidth={1.5}
        strokeDasharray="2,2"
      />
      <Path
        d="M24 14C30 14 34 16 34 19"
        stroke="url(#aiGlow)"
        strokeWidth={1.5}
        strokeDasharray="2,2"
      />
    </Svg>
  );
}

export default function BrandLogo({
  size = 84,
  animated = false,
  style,
  isDarkMode = true,
  showName = false,
  layout = 'vertical',
}: BrandLogoProps) {
  const breathingScale = useSharedValue(1);
  const breathingFloat = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      breathingScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      breathingFloat.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 2400, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 2400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      breathingScale.value = 1;
      breathingFloat.value = 0;
    }
  }, [animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: breathingScale.value },
      { translateY: breathingFloat.value },
    ],
  }));

  const containerSize = size;

  return (
    <View
      style={[
        styles.logoContainer,
        layout === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: containerSize,
            height: containerSize,
            borderRadius: containerSize / 2,
            backgroundColor: isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)',
            borderWidth: 1.5,
            borderColor: 'rgba(34, 197, 94, 0.35)',
            justifyContent: 'center',
            alignItems: 'center',
          },
          animated ? animatedStyle : undefined,
        ]}
      >
        <AgriNexIcon size={size * 0.65} />
      </Animated.View>

      {showName && (
        <Text
          style={[
            styles.brandName,
            {
              color: isDarkMode ? '#FFFFFF' : '#0F172A',
              marginTop: layout === 'vertical' ? 10 : 0,
              marginLeft: layout === 'horizontal' ? 12 : 0,
            },
          ]}
        >
          AgriNex AI
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertical: {
    flexDirection: 'column',
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
