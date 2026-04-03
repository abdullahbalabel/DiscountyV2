import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
import { useAuth } from '../../contexts/auth';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';

const OTP_LENGTH = 6;

export default function OtpVerifyScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, signInWithOtp } = useAuth();

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Theme-aware glass card colors
  const isDark = colors.isDark;
  const textPrimary = isDark ? '#fff' : colors.onSurface;
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant;
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant;
  const textFaint = isDark ? 'rgba(255,255,255,0.4)' : colors.onSurfaceVariant;
  const glassBorder = isDark ? 'rgba(255,255,255,0.2)' : colors.outlineVariant;
  const inputBg = isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceContainerHigh;
  const inputBgFilled = isDark ? 'rgba(255,255,255,0.2)' : colors.surfaceContainer;
  const accentColor = isDark ? '#ffb2be' : colors.primary;
  const iconColor = isDark ? 'white' : colors.onSurfaceVariant;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((digit) => digit !== '') && newOtp.join('').length === OTP_LENGTH) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async (code: string) => {
    if (!phone) {
      setError(t('auth.phoneMissing'));
      return;
    }

    setIsLoading(true);
    const result = await verifyOtp(phone, code);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      setOtp(new Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || !phone) return;
    setResendTimer(60);
    setError('');
    await signInWithOtp(phone);
  };

  const maskedPhone = phone
    ? phone.slice(0, -4).replace(/./g, '•') + phone.slice(-4)
    : '•••••••••';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff8f6', position: 'relative' }}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
        style={{ position: 'absolute', top: 0, start: 0, end: 0, bottom: 0, zIndex: 0 }}
        contentFit="cover"
      />
      <View style={{ position: 'absolute', top: 0, start: 0, end: 0, bottom: 0, zIndex: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
          <GlassView
            intensity={colorScheme === 'dark' ? 30 : 50}
            style={{ width: '100%', maxWidth: 512, marginHorizontal: 24, borderRadius: 32, padding: 40, zIndex: 10, borderWidth: 1, borderColor: glassBorder }}
          >
            {/* Back Button */}
            <AnimatedButton
              style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: inputBg, borderWidth: 1, borderColor: glassBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
              onPress={() => router.back()}
              accessibilityLabel={t('customer.goBack')}
            >
              <MaterialIcons name="arrow-back" size={20} color={iconColor} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
            </AnimatedButton>

            {/* Header */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 30, color: textPrimary, marginBottom: 8 }}>
                {t('auth.verificationCode')}
              </Text>
              <Text style={{ fontFamily: 'Manrope', color: textSecondary, fontSize: 16, lineHeight: 24 }}>
                {t('auth.sentCodeTo')}{'\n'}
                <Text style={{ color: textPrimary, fontWeight: '600' }}>{maskedPhone}</Text>
              </Text>
            </View>

            {/* OTP Input Grid */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 24 }}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={{
                    flex: 1, aspectRatio: 1, borderRadius: 16, textAlign: 'center',
                    color: textPrimary, fontFamily: 'Epilogue', fontWeight: '700', fontSize: 24,
                    backgroundColor: digit ? inputBgFilled : inputBg,
                    borderWidth: digit ? 2 : 1,
                    borderColor: digit ? accentColor : glassBorder,
                  }}
                  maxLength={1}
                  keyboardType="number-pad"
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                  selectTextOnFocus
                />
              ))}
            </View>

            {/* Error */}
            {error ? (
              <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 }}>
                <Text style={{ color: '#ef4444', fontFamily: 'Manrope', fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}

            {/* Verify Button */}
            <AnimatedButton
              variant="gradient"
              style={{ paddingVertical: 16, borderRadius: 16, marginBottom: 24, opacity: (isLoading || otp.some((d) => !d)) ? 0.6 : 1 }}
              onPress={() => handleVerify(otp.join(''))}
              disabled={isLoading || otp.some((d) => !d)}
            >
              <Text style={{ color: '#fff', fontFamily: 'Manrope', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>
                {isLoading ? t('auth.verifying') : t('auth.verify')}
              </Text>
            </AnimatedButton>

            {/* Resend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'Manrope', color: textMuted, fontSize: 14 }}>{t('auth.didntReceive')}</Text>
              {resendTimer > 0 ? (
                <Text style={{ fontFamily: 'Manrope', color: textFaint, fontSize: 14 }}>
                  {t('auth.resendIn')} {resendTimer}s
                </Text>
              ) : (
                <AnimatedButton onPress={handleResend}>
                  <Text style={{ fontFamily: 'Manrope', color: accentColor, fontWeight: '700', fontSize: 14 }}>{t('auth.resend')}</Text>
                </AnimatedButton>
              )}
            </View>
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
