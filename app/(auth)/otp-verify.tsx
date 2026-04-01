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

  // Countdown timer for resend
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

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
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
    // On success, auth state change triggers navigation via AuthProvider
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
    <View className="flex-1 bg-surface relative">
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
        className="absolute inset-0 z-0"
        contentFit="cover"
      />
      <View className="absolute inset-0 z-0 bg-black/60" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
          <GlassView
            intensity={colorScheme === 'dark' ? 30 : 50}
            className="w-full max-w-lg mx-6 rounded-[2rem] p-10 shadow-2xl z-10 border-white/20"
          >
            {/* Back Button */}
            <AnimatedButton
              className="w-10 h-10 rounded-md bg-white/10 border-white/20 items-center justify-center mb-8"
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={20} color="white" />
            </AnimatedButton>

            {/* Header */}
            <View className="mb-8">
              <Text className="font-headline font-bold text-3xl text-white mb-2">
                Verification Code
              </Text>
              <Text className="font-body text-white/70 text-base leading-6">
                We sent a 6-digit code to{'\n'}
                <Text className="text-white font-semibold">{maskedPhone}</Text>
              </Text>
            </View>

            {/* OTP Input Grid */}
            <View className="flex-row justify-between gap-2 mb-6">
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  className={`flex-1 aspect-square rounded-2xl text-center text-white font-headline font-bold text-2xl ${digit
                    ? 'bg-white/20 border-2 border-primary-fixed'
                    : 'bg-white/10 border-white/20'
                    }`}
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
              <View className="bg-red-500/20 border-red-400/30 rounded-xl px-4 py-3 mb-4">
                <Text className="text-error font-body text-sm">{error}</Text>
              </View>
            ) : null}

            {/* Verify Button */}
            <AnimatedButton
              variant="gradient"
              className="py-4 rounded-2xl mb-6"
              onPress={() => handleVerify(otp.join(''))}
              disabled={isLoading || otp.some((d) => !d)}
            >
              <Text className="text-on-primary font-body font-bold text-lg">
                {isLoading ? 'Verifying...' : 'Verify'}
              </Text>
            </AnimatedButton>

            {/* Resend */}
            <View className="flex-row justify-center items-center gap-1">
              <Text className="font-body text-white/60 text-sm">Didn't receive the code?</Text>
              {resendTimer > 0 ? (
                <Text className="font-body text-white/40 text-sm">
                  Resend in {resendTimer}s
                </Text>
              ) : (
                <AnimatedButton onPress={handleResend}>
                  <Text className="font-body text-primary-fixed font-bold text-sm">Resend</Text>
                </AnimatedButton>
              )}
            </View>
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
