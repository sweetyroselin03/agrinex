import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  X,
  Mail,
} from 'lucide-react-native';
import { MotiView, AnimatePresence } from 'moti';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { user, requestChangePasswordOTP, verifyAndUpdatePassword } = useAuthStore();
  const { isDarkMode, theme } = useAppTheme();

  // Form inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  // Password criteria validation
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid = hasMinLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  // Countdown timer effect
  useEffect(() => {
    let interval: any = null;
    if (isOtpModalOpen && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendDisabled(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpModalOpen, resendTimer]);

  const handleInitiatePasswordChange = async () => {
    if (!isFormValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setIsRequestingOtp(true);
      const res = await requestChangePasswordOTP();
      setMaskedEmail(res?.email_masked || user?.email || 'registered email');
      setResendTimer(60);
      setIsResendDisabled(true);
      setOtpCode('');
      setOtpError(null);
      setIsOtpModalOpen(true);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResendDisabled || isRequestingOtp) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOtpError(null);

    try {
      setIsRequestingOtp(true);
      const res = await requestChangePasswordOTP();
      setMaskedEmail(res?.email_masked || user?.email || 'registered email');
      setResendTimer(60);
      setIsResendDisabled(true);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to resend code.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.trim().length !== 6 || isSubmittingOtp) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setOtpError(null);

    try {
      setIsSubmittingOtp(true);
      const res = await verifyAndUpdatePassword(otpCode.trim(), newPassword);
      setIsOtpModalOpen(false);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        '✓ Success',
        res?.message || 'Your account password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setOtpError(err?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  const RequirementItem = ({ fulfilled, text }: { fulfilled: boolean; text: string }) => (
    <View style={styles.requirementRow}>
      {fulfilled ? (
        <CheckCircle size={14} color="#10B981" />
      ) : (
        <XCircle size={14} color={isDarkMode ? '#64748B' : '#94A3B8'} />
      )}
      <Text style={[
        styles.requirementText,
        { color: fulfilled ? (isDarkMode ? '#34D399' : '#059669') : theme.textLight }
      ]}>
        {text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
          <ChevronLeft color={theme.text} size={22} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={[styles.mainCard, { backgroundColor: theme.card, borderColor: theme.border }]}
          >
            <View style={styles.iconHeader}>
              <View style={[styles.lockIconBox, { backgroundColor: isDarkMode ? '#064e3b' : '#ECFDF5' }]}>
                <Lock color="#10B981" size={24} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Update Security Credentials</Text>
                <Text style={[styles.cardDesc, { color: theme.textLight }]}>
                  Require 2-step email verification to secure your account.
                </Text>
              </View>
            </View>

            {/* New Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textLight }]}>NEW PASSWORD</Text>
              <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="Enter new password"
                  placeholderTextColor={theme.textLight + '80'}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  {showNewPassword ? <EyeOff size={18} color={theme.textLight} /> : <Eye size={18} color={theme.textLight} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textLight }]}>CONFIRM NEW PASSWORD</Text>
              <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.background }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="Confirm new password"
                  placeholderTextColor={theme.textLight + '80'}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <EyeOff size={18} color={theme.textLight} /> : <Eye size={18} color={theme.textLight} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Live Criteria Checklist */}
            <View style={[styles.requirementsCard, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
              <Text style={[styles.requirementsHeader, { color: theme.text }]}>Password Requirements:</Text>
              <RequirementItem fulfilled={hasMinLength} text="At least 8 characters long" />
              <RequirementItem fulfilled={hasUpper} text="At least 1 uppercase letter (A-Z)" />
              <RequirementItem fulfilled={hasLower} text="At least 1 lowercase letter (a-z)" />
              <RequirementItem fulfilled={hasNumber} text="At least 1 number (0-9)" />
              <RequirementItem fulfilled={hasSpecial} text="At least 1 special character (!@#$%^&*...)" />
              <RequirementItem fulfilled={passwordsMatch} text="Passwords match" />
            </View>

            {/* Submit Request Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: isFormValid ? '#10B981' : (isDarkMode ? '#334155' : '#CBD5E1') }
              ]}
              disabled={!isFormValid || isRequestingOtp}
              onPress={handleInitiatePasswordChange}
              activeOpacity={0.8}
            >
              {isRequestingOtp ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ShieldCheck color="white" size={18} />
                  <Text style={styles.submitBtnText}>Request OTP & Update Password</Text>
                </>
              )}
            </TouchableOpacity>

          </MotiView>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── EMAIL OTP VERIFICATION MODAL ─── */}
      <Modal visible={isOtpModalOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={[styles.modalPanel, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.modalIconBox, { backgroundColor: isDarkMode ? '#064e3b' : '#ECFDF5' }]}>
                    <Mail color="#10B981" size={20} />
                  </View>
                  <View>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Verify Email Address</Text>
                    <Text style={[styles.modalSubtitle, { color: theme.textLight }]}>Step 2 of Security Update</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsOtpModalOpen(false)}>
                  <X color={theme.textLight} size={20} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.otpDesc, { color: theme.textLight }]}>
                We've sent a 6-digit verification code to your registered email:
              </Text>
              
              <View style={[styles.maskedEmailBadge, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
                <Text style={[styles.maskedEmailText, { color: theme.text }]}>{maskedEmail}</Text>
              </View>

              {otpError && (
                <View style={styles.errorBox}>
                  <AlertCircle color="#EF4444" size={16} />
                  <Text style={styles.errorText}>{otpError}</Text>
                </View>
              )}

              {/* OTP Input */}
              <View style={styles.otpInputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textLight, textAlign: 'center' }]}>ENTER 6-DIGIT OTP CODE</Text>
                <TextInput
                  style={[
                    styles.otpInput,
                    { color: theme.text, backgroundColor: theme.background, borderColor: theme.border }
                  ]}
                  placeholder="123456"
                  placeholderTextColor={theme.textLight + '50'}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={(val) => setOtpCode(val.replace(/\D/g, ''))}
                />
              </View>

              {/* Countdown & Resend */}
              <View style={styles.resendRow}>
                <Text style={[styles.resendLabel, { color: theme.textLight }]}>Didn't receive code?</Text>
                {isResendDisabled ? (
                  <Text style={[styles.timerText, { color: theme.textLight }]}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={handleResendOtp} disabled={isRequestingOtp}>
                    <Text style={styles.resendBtnText}>{isRequestingOtp ? 'Sending...' : 'Resend OTP'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Submit Verification */}
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  { backgroundColor: otpCode.trim().length === 6 ? '#10B981' : (isDarkMode ? '#334155' : '#CBD5E1') }
                ]}
                disabled={otpCode.trim().length !== 6 || isSubmittingOtp}
                onPress={handleVerifyOtp}
                activeOpacity={0.8}
              >
                {isSubmittingOtp ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify & Complete Password Change</Text>
                )}
              </TouchableOpacity>

            </MotiView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
  },
  mainCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 16,
  },
  iconHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  lockIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsCard: {
    padding: 14,
    borderRadius: 16,
    gap: 8,
  },
  requirementsHeader: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 11,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 16,
    gap: 8,
    marginTop: 6,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalPanel: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11,
    fontWeight: '600',
  },
  otpDesc: {
    fontSize: 12,
    fontWeight: '500',
  },
  maskedEmailBadge: {
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  maskedEmailText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 10,
    borderRadius: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  otpInputGroup: {
    gap: 8,
  },
  otpInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 16,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resendLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '700',
  },
  resendBtnText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },
  verifyBtn: {
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  verifyBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '800',
  },
});
