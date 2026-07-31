import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  InteractionManager,
  StatusBar,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import Toast from '../../components/Toast';
import { checkInternet } from '../../utils/network';

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isDarkMode: isDark, theme } = useAppTheme();
  
  const { verifyOTP, sendOTP, isLoading } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [isVerified, setIsVerified] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const hasAutoFilled = useRef(false);
  const isVerifying = useRef(false);
  const isResending = useRef(false);

  // ─── Theme Colors ──────────────────────────────────────────────────────────
  const BG = theme.background;
  const PRIMARY = theme.primary;
  const PRIMARY_END = theme.secondary;
  const CARD_BG = theme.card;
  const BORDER_IDLE = theme.border;
  const TEXT_PRIMARY = theme.text;
  const TEXT_MUTED = theme.textLight;
  const backBtnBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const backBtnBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const backIconColor = theme.text;
  const stepBarIdleColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const shieldOuterRingBorder = isDark ? 'rgba(34,229,139,0.15)' : 'rgba(34,229,139,0.1)';
  const shieldInnerRingBorder = isDark ? 'rgba(34,229,139,0.2)' : 'rgba(34,229,139,0.15)';
  const shieldInnerRingBg = isDark ? 'rgba(34,229,139,0.06)' : 'rgba(34,229,139,0.04)';
  const shieldCircleBg = isDark ? 'rgba(34,229,139,0.12)' : 'rgba(34,229,139,0.08)';
  const successRingBorder = isDark ? 'rgba(34,229,139,0.2)' : 'rgba(34,229,139,0.15)';
  const successCircleBg = isDark ? 'rgba(34,229,139,0.1)' : 'rgba(34,229,139,0.08)';
  const successCircleBorder = isDark ? 'rgba(34,229,139,0.2)' : 'rgba(34,229,139,0.15)';
  const progressContainerBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'error' | 'success' }>({
    visible: false, message: '', type: 'error',
  });

  const showToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    setToast({ visible: true, message, type });
  }, []);

  const target = (params.email as string || '').trim().replace(/\s/g, '');
  const devOtp = params.dev_otp as string | undefined;

  // Auto focus first box on mount
  useEffect(() => {
    const t = setTimeout(() => {
      const firstInputRef = inputRefs.current[0];
      if (firstInputRef) firstInputRef.focus();
    }, 150);
    return () => clearTimeout(t);
  }, []);

  // Handle Dev OTP auto-fill if present
  useEffect(() => {
    if (devOtp && devOtp.length === 6 && !hasAutoFilled.current) {
      hasAutoFilled.current = true;
      setOtp(devOtp.split(''));
      showToast(`Dev OTP auto-filled: ${devOtp}`, 'success');
      setTimeout(() => { handleVerify(devOtp); }, 600);
    }
  }, [devOtp]);

  // Countdown Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timer > 0 && !isVerified) {
      interval = setInterval(() => { setTimer((p) => p - 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, isVerified]);

  // Haptic feedback on verification success
  useEffect(() => {
    if (isVerified) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [isVerified]);

  const fillOtpFromString = useCallback((code: string) => {
    const digits = code.replace(/[^0-9]/g, '').slice(0, 6).split('');
    if (digits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      digits.forEach((d, idx) => { newOtp[idx] = d; });
      setOtp(newOtp);
      if (digits.length === 6) {
        setTimeout(() => handleVerify(digits.join('')), 200);
      } else {
        const nextIndex = Math.min(digits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
    }
  }, []);

  const handleOtpChange = useCallback((value: string, index: number) => {
    if (isVerified) return;
    const cleanValue = value.replace(/[^0-9]/g, '');

    // Handle full paste
    if (cleanValue.length >= 6) {
      fillOtpFromString(cleanValue);
      return;
    }

    setOtp(prev => {
      const newOtp = [...prev];
      newOtp[index] = cleanValue.slice(-1);

      if (cleanValue && index < 5) {
        setTimeout(() => {
          inputRefs.current[index + 1]?.focus();
        }, 10);
      }

      if (index === 5 && cleanValue) {
        const s = newOtp.join('');
        if (s.length === 6) setTimeout(() => handleVerify(s), 100);
      }

      return newOtp;
    });
  }, [isVerified, fillOtpFromString]);

  const handleKeyPress = useCallback((e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      setOtp(prev => {
        if (!prev[index] && index > 0) {
          const newOtp = [...prev];
          newOtp[index - 1] = '';
          setTimeout(() => {
            inputRefs.current[index - 1]?.focus();
          }, 10);
          return newOtp;
        }
        return prev;
      });
    }
  }, []);

  const handleVerify = async (otpStringParam?: string) => {
    if (isVerifying.current || isVerified) return;
    const otpString = otpStringParam || otp.join('');
    if (otpString.length < 6) { showToast('Please enter a valid 6-digit code'); return; }

    isVerifying.current = true;
    setLocalLoading(true);
    try {
      const hasInternet = await checkInternet();
      if (!hasInternet) {
        showToast('No internet connection');
        setLocalLoading(false);
        isVerifying.current = false;
        return;
      }
      const { safeApiCall } = require('../../utils/network');
      const actionPromise = (async () => {
        const response = await verifyOTP(target, otpString);
        if (response && response.access_token) {
          setIsVerified(true);
          setTimeout(() => { InteractionManager.runAfterInteractions(() => { router.replace('/(tabs)'); }); }, 1200);
          return true;
        }
        if (params.type === 'register') {
          setIsVerified(true);
          setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
              router.replace({
                pathname: '/(auth)/create-password',
                params: { email: target, fullName: params.fullName as string },
              });
            });
          }, 1200);
        } else if (params.type === 'forgot') {
          setIsVerified(true);
          setTimeout(() => {
            InteractionManager.runAfterInteractions(() => {
              router.replace({ pathname: '/(auth)/reset-password', params: { email: target, otp: otpString } });
            });
          }, 1200);
        }
        return true;
      })();
      await safeApiCall(() => actionPromise, 8000);
    } catch (e: any) {
      let errorMsg = 'Incorrect verification code.';
      if (e.message === 'timeout') errorMsg = 'Server taking too long';
      else if (e.code === 'auth/network-request-failed' || e.message?.toLowerCase().includes('network')) errorMsg = 'Unable to connect. Retrying...';
      else if (e.response?.data?.detail) errorMsg = e.response.data.detail;
      showToast(errorMsg, 'error');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLocalLoading(false);
      isVerifying.current = false;
    }
  };

  const handleResend = useCallback(async () => {
    if (timer > 0 || isVerified || isResending.current || isVerifying.current) return;
    isResending.current = true;
    setLocalLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const hasInternet = await checkInternet();
      if (!hasInternet) {
        showToast('No internet connection');
        setLocalLoading(false);
        isResending.current = false;
        return;
      }
      const { safeApiCall } = require('../../utils/network');
      const result = await safeApiCall(() => sendOTP(target), 8000);
      setTimer(30);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      if (result?.dev_otp) {
        setTimeout(() => { setOtp(result.dev_otp.split('')); showToast(`New code sent. Dev OTP: ${result.dev_otp}`, 'success'); }, 500);
      } else {
        showToast('New verification code sent.', 'success');
      }
    } catch (e: any) {
      let errorMsg = 'Failed to resend code';
      if (e.message === 'timeout') errorMsg = 'Server taking too long';
      else if (e.response?.data?.detail) errorMsg = e.response.data.detail;
      showToast(errorMsg, 'error');
    } finally {
      setLocalLoading(false);
      isResending.current = false;
    }
  }, [timer, isVerified, target]);

  // ── Success State ────────────────────────────────────────────────────────────
  if (isVerified) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: BG }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
        <LinearGradient
          colors={isDark ? ['rgba(0,217,139,0.12)', 'transparent'] : ['rgba(0,217,139,0.06)', 'transparent']}
          start={{ x: 0.5, y: 0.2 }}
          end={{ x: 0.5, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View entering={FadeInDown.duration(400)} style={styles.successWrapper}>
          <View style={[styles.successRing, { borderColor: successRingBorder }]}>
            <View style={[styles.successCircle, { backgroundColor: successCircleBg, borderColor: successCircleBorder }]}>
              <CheckCircle2 color={PRIMARY} size={56} strokeWidth={1.8} />
            </View>
          </View>
          <Text style={[styles.successTitle, { color: TEXT_PRIMARY }]}>Verified!</Text>
          <Text style={[styles.successSubtext, { color: TEXT_MUTED }]}>Taking you forward...</Text>
        </Animated.View>
      </View>
    );
  }

  // ── Main OTP Screen ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: BG }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />

      <LinearGradient
        colors={isDark ? ['rgba(0,217,139,0.07)', 'transparent'] : ['rgba(0,217,139,0.04)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }}>
        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={() => setToast({ ...toast, visible: false })}
        />

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
          >
            {/* Back button */}
            <TouchableOpacity 
              style={[styles.backButton, { backgroundColor: backBtnBg, borderColor: backBtnBorder, borderWidth: 1 }]} 
              onPress={() => router.back()}
            >
              <ArrowLeft color={backIconColor} size={20} />
            </TouchableOpacity>

            {/* Step indicator for register flow */}
            {params.type === 'register' && (
              <View style={styles.stepContainer}>
                <View style={styles.stepBarRow}>
                  <View style={[styles.stepBar, styles.stepBarDone]} />
                  <View style={[styles.stepBar, styles.stepBarActive]} />
                  <View style={[styles.stepBar, { backgroundColor: stepBarIdleColor }]} />
                </View>
                <Text style={[styles.stepLabel, { color: TEXT_MUTED }]}>Step 2 of 3</Text>
              </View>
            )}

            {/* Shield Icon */}
            <View style={styles.iconSection}>
              <View style={[styles.shieldOuterRing, { borderColor: shieldOuterRingBorder }]}>
                <View style={[styles.shieldInnerRing, { borderColor: shieldInnerRingBorder, backgroundColor: shieldInnerRingBg }]}>
                  <View style={[styles.shieldCircle, { backgroundColor: shieldCircleBg }]}>
                    <ShieldCheck color={PRIMARY} size={36} strokeWidth={1.8} />
                  </View>
                </View>
              </View>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: TEXT_PRIMARY }]}>Verify Your{'\n'}Identity</Text>
              <Text style={[styles.subtitle, { color: TEXT_MUTED }]}>
                We sent a 6-digit code to{'\n'}
                <Text style={styles.targetText}>{target}</Text>
              </Text>
            </View>

            {/* Static Bordered OTP Inputs - Calmed and Professional */}
            <View style={styles.otpSection}>
              <View style={styles.otpRow}>
                {otp.map((digit, index) => {
                  const isFocused = focusedIndex === index;
                  const isFilled = Boolean(digit);

                  return (
                    <View key={index} style={styles.inputContainer}>
                      <TextInput
                        ref={(ref) => { inputRefs.current[index] = ref; }}
                        style={[
                          styles.otpInput,
                          { 
                            borderColor: isFocused ? PRIMARY : (isFilled ? PRIMARY : BORDER_IDLE), 
                            backgroundColor: CARD_BG,
                            color: TEXT_PRIMARY
                          }
                        ]}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={digit}
                        onChangeText={(v) => handleOtpChange(v, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        onFocus={() => setFocusedIndex(index)}
                        onBlur={() => setFocusedIndex(null)}
                        selectTextOnFocus
                        caretHidden={true}
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Timer / Resend */}
            <View style={styles.timerRow}>
              {timer > 0 ? (
                <Text style={[styles.timerText, { color: TEXT_MUTED }]}>
                  Resend code in <Text style={styles.timerHighlight}>{timer}s</Text>
                </Text>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={localLoading || isLoading}
                  style={[styles.resendBtn, (localLoading || isLoading) && { opacity: 0.5 }]}
                >
                  <RefreshCw color={PRIMARY} size={14} style={{ marginRight: 6 }} />
                  <Text style={styles.resendBtnText}>Resend Code</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Verify Button */}
            <View style={[styles.primaryBtnShadow, { opacity: (otp.join('').length < 6 || localLoading || isLoading) ? 0.5 : 1 }]}>
              <Pressable
                onPress={() => handleVerify()}
                disabled={localLoading || isLoading || otp.join('').length < 6}
                style={styles.primaryBtn}
              >
                <LinearGradient
                  colors={[PRIMARY, PRIMARY_END]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryGradient}
                >
                  {(localLoading || isLoading) ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryText}>Verify Now</Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 48,
  },

  // Back
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },

  // Step bar
  stepContainer: { marginBottom: 28 },
  stepBarRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  stepBar: { flex: 1, height: 4, borderRadius: 2 },
  stepBarDone: { backgroundColor: '#00E38C80' },
  stepBarActive: { backgroundColor: '#00E38C' },
  stepLabel: { fontSize: 13, fontWeight: '600' },

  // Shield icon
  iconSection: { alignItems: 'center', marginBottom: 28 },
  shieldOuterRing: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  shieldInnerRing: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  shieldCircle: {
    width: 66, height: 66, borderRadius: 33,
    justifyContent: 'center', alignItems: 'center',
  },

  // Header
  header: { alignItems: 'center', marginBottom: 36 },
  title: {
    fontSize: 32, fontWeight: '800',
    letterSpacing: -0.8, textAlign: 'center', lineHeight: 38, marginBottom: 12,
  },
  subtitle: { fontSize: 15, fontWeight: '500', lineHeight: 22, textAlign: 'center' },
  targetText: { color: '#00E38C', fontWeight: '700' },

  // Static Bordered OTP Input Boxes (No scale, no movement, no layout shift)
  otpSection: { marginBottom: 28 },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  inputContainer: { width: 46, height: 56 },
  otpInput: {
    width: 46, height: 56,
    borderRadius: 14, borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22, fontWeight: '800',
    padding: 0,
  },

  // Timer
  timerRow: { alignItems: 'center', marginBottom: 28 },
  timerText: { fontSize: 14, fontWeight: '600' },
  timerHighlight: { color: '#00E38C', fontWeight: '800' },
  resendBtn: { flexDirection: 'row', alignItems: 'center' },
  resendBtnText: { fontSize: 14, fontWeight: '700', color: '#00E38C' },

  // Button
  primaryBtnShadow: {
    width: '100%',
    shadowColor: '#00E38C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtn: { width: '100%', height: 56, borderRadius: 28, overflow: 'hidden' },
  primaryGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 },

  // Success
  successWrapper: { alignItems: 'center', paddingHorizontal: 32 },
  successRing: {
    width: 150, height: 150, borderRadius: 75,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 28,
  },
  successCircle: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  successTitle: {
    fontSize: 32, fontWeight: '800',
    textAlign: 'center', marginBottom: 8, letterSpacing: -0.5,
  },
  successSubtext: { fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
