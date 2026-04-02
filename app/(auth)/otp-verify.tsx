import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
import { useAuth } from '../../contexts/auth';

const OTP_LENGTH = 6;

export default function OtpVerifyScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { verifyOtp, signInWithOtp } = useAuth();

  const [otp, setOtp] = useState<string[]>(new Array(OTP_LENGTH).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(TextInput | null)[]>([]);

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
      setError('Phone number missing. Please go back.');
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        contentFit="cover"
      />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
          <GlassView
            intensity={colorScheme === 'dark' ? 30 : 50}
            style={{ width: '100%', maxWidth: 512, marginHorizontal: 24, borderRadius: 32, padding: 40, zIndex: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            {/* Back Button */}
            <AnimatedButton
              style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={20} color="white" />
            </AnimatedButton>

            {/* Header */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 30, color: '#fff', marginBottom: 8 }}>
                Verification Code
              </Text>
              <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 24 }}>
                We sent a 6-digit code to{'\n'}
                <Text style={{ color: '#fff', fontWeight: '600' }}>{maskedPhone}</Text>
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
                    color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 24,
                    backgroundColor: digit ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                    borderWidth: digit ? 2 : 1,
                    borderColor: digit ? '#ffb2be' : 'rgba(255,255,255,0.2)',
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
                {isLoading ? 'Verifying...' : 'Verify'}
              </Text>
            </AnimatedButton>

            {/* Resend */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Didn't receive the code?</Text>
              {resendTimer > 0 ? (
                <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                  Resend in {resendTimer}s
                </Text>
              ) : (
                <AnimatedButton onPress={handleResend}>
                  <Text style={{ fontFamily: 'Manrope', color: '#ffb2be', fontWeight: '700', fontSize: 14 }}>Resend</Text>
                </AnimatedButton>
              )}
            </View>
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
