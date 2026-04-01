import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
import { useAuth } from '../../contexts/auth';

// Country codes for common Middle East + global
const COUNTRY_CODES = [
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+962', flag: '🇯🇴', name: 'Jordan' },
  { code: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+968', flag: '🇴🇲', name: 'Oman' },
  { code: '+974', flag: '🇶🇦', name: 'Qatar' },
  { code: '+973', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+20', flag: '🇪🇬', name: 'Egypt' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey' },
  { code: '+1', flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
];

export default function PhoneEntryScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { signInWithOtp, signInWithEmail, signUpWithEmail } = useAuth();

  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Email auth state
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSendOtp = async () => {
    if (phone.length < 7) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setIsLoading(true);

    const fullPhone = selectedCountry.code + phone.replace(/^0+/, '');
    const result = await signInWithOtp(fullPhone);

    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.push({
        pathname: '/(auth)/otp-verify',
        params: { phone: fullPhone },
      });
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setIsLoading(true);

    if (isSignUp) {
      const result = await signUpWithEmail(email, password);
      setIsLoading(false);
      if (result.error) {
        setError(result.error);
      }
      // On success, auth state change triggers navigation via AuthProvider
    } else {
      const result = await signInWithEmail(email, password);
      setIsLoading(false);
      if (result.error) {
        setError(result.error);
      }
      // On success, auth state change triggers navigation via AuthProvider
    }
  };

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
            {/* Branding */}
            <View className="mb-8">
              <Text className="font-headline font-bold text-5xl text-white">Discounty</Text>
              <Text className="font-body text-white/80 mt-2 text-lg">
                Your deals, verified & rewarded.
              </Text>
            </View>

            {/* Mode Toggle */}
            <View className="flex-row bg-white/10 rounded-2xl p-1 mb-8 border-white/10">
              <Pressable
                onPress={() => { setAuthMode('email'); setError(''); }}
                className={`flex-1 py-3 rounded-xl items-center ${authMode === 'email' ? 'bg-white/20' : ''
                  }`}
              >
                <Text className={`font-body font-semibold text-sm ${authMode === 'email' ? 'text-white' : 'text-white/50'
                  }`}>
                  Email
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setAuthMode('phone'); setError(''); }}
                className={`flex-1 py-3 rounded-xl items-center ${authMode === 'phone' ? 'bg-white/20' : ''
                  }`}
              >
                <Text className={`font-body font-semibold text-sm ${authMode === 'phone' ? 'text-white' : 'text-white/50'
                  }`}>
                  Phone
                </Text>
              </Pressable>
            </View>

            <View className="flex-col gap-5">
              {authMode === 'email' ? (
                <>
                  {/* Email Input */}
                  <View className="flex-col gap-2">
                    <Text className="font-label text-xs uppercase tracking-widest text-white/90 font-semibold px-1">
                      Email
                    </Text>
                    <TextInput
                      className="px-6 py-4 rounded-2xl bg-white/10 border-white/20 text-white font-body text-base"
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={email}
                      onChangeText={(v) => { setEmail(v); setError(''); }}
                    />
                  </View>

                  {/* Password Input */}
                  <View className="flex-col gap-2">
                    <Text className="font-label text-xs uppercase tracking-widest text-white/90 font-semibold px-1">
                      Password
                    </Text>
                    <TextInput
                      className="px-6 py-4 rounded-2xl bg-white/10 border-white/20 text-white font-body text-base"
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry
                      value={password}
                      onChangeText={(v) => { setPassword(v); setError(''); }}
                    />
                  </View>
                </>
              ) : (
                <>
                  {/* Phone Input */}
                  <View className="flex-col gap-2">
                    <Text className="font-label text-xs uppercase tracking-widest text-white/90 font-semibold px-1">
                      Phone Number
                    </Text>

                    <View className="flex-row gap-3">
                      {/* Country Code Picker */}
                      <Pressable
                        onPress={() => setShowCountryPicker(!showCountryPicker)}
                        className="px-4 py-4 rounded-2xl bg-white/10 border-white/20 flex-row items-center gap-2"
                      >
                        <Text className="text-xl">{selectedCountry.flag}</Text>
                        <Text className="text-white font-body font-semibold">{selectedCountry.code}</Text>
                        <MaterialIcons name="arrow-drop-down" size={20} color="white" />
                      </Pressable>

                      {/* Phone Number Input */}
                      <TextInput
                        className="flex-1 px-6 py-4 rounded-2xl bg-white/10 border-white/20 text-white font-body text-base"
                        placeholder="5XX XXX XXX"
                        placeholderTextColor="rgba(255,255,255,0.5)"
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={15}
                      />
                    </View>

                    {/* Country Picker Dropdown */}
                    {showCountryPicker && (
                      <View className="bg-black/80 rounded-2xl border-white/20 mt-2 max-h-60 overflow-hidden">
                        <ScrollView nestedScrollEnabled>
                          {COUNTRY_CODES.map((country) => (
                            <Pressable
                              key={country.code}
                              onPress={() => {
                                setSelectedCountry(country);
                                setShowCountryPicker(false);
                              }}
                              className={`flex-row items-center gap-3 px-4 py-3 border-b border-white/10 ${selectedCountry.code === country.code ? 'bg-white/10' : ''
                                }`}
                            >
                              <Text className="text-lg">{country.flag}</Text>
                              <Text className="text-white font-body flex-1">{country.name}</Text>
                              <Text className="text-white/60 font-body">{country.code}</Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </>
              )}

              {/* Error Message */}
              {error ? (
                <View className="bg-red-500/20 border-red-400/30 rounded-xl px-4 py-3">
                  <Text className="text-error font-body text-sm">{error}</Text>
                </View>
              ) : null}

              {/* Action Button */}
              <View className="mt-2 flex-col gap-4">
                <AnimatedButton
                  variant="gradient"
                  className="py-4 rounded-2xl items-center justify-center"
                  onPress={authMode === 'email' ? handleEmailAuth : handleSendOtp}
                  disabled={isLoading}
                >
                  <Text className="text-on-primary font-body font-bold text-lg text-center">
                    {isLoading
                      ? (authMode === 'email' ? 'Signing in...' : 'Sending...')
                      : authMode === 'email'
                        ? (isSignUp ? 'Create Account' : 'Sign In')
                        : 'Send Verification Code'}
                  </Text>
                </AnimatedButton>
              </View>

              {/* Toggle sign-in/sign-up for email mode */}
              {authMode === 'email' && (
                <View className="flex-row justify-center items-center gap-1">
                  <Text className="font-body text-white/60 text-sm">
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </Text>
                  <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(''); }}>
                    <Text className="font-body text-primary-fixed font-bold text-sm">
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Info */}
              <View className="mt-2 flex-col items-center">
                <Text className="font-label text-xs text-white/60 text-center leading-5">
                  {authMode === 'email'
                    ? 'Sign in with your email and password.'
                    : "We'll send you a one-time verification code via SMS.\nStandard message rates may apply."}
                </Text>
              </View>

              {/* Footer */}
              <View className="mt-4 pt-6 border-t border-white/20 flex-row justify-center gap-6">
                <Text className="font-label text-xs text-white/50">Privacy</Text>
                <Text className="font-label text-xs text-white/50">Terms</Text>
              </View>
            </View>
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Decorative Badge */}
      <View className="absolute bottom-10 right-6 opacity-90" pointerEvents="none">
        <GlassView intensity={50} className="p-4 rounded-xl flex-row items-center gap-3 shadow-xl border-white/20">
          <View className="w-10 h-10 rounded-md flex items-center justify-center overflow-hidden">
            <LinearGradient colors={['#862045', '#a01840']} style={{ padding: 8, borderRadius: 20 }}>
              <MaterialIcons name="verified-user" size={18} color="white" />
            </LinearGradient>
          </View>
          <View>
            <Text className="font-label text-[10px] uppercase tracking-widest text-white/70 font-bold">Verified Users</Text>
            <Text className="font-headline font-bold text-sm text-white">Secure access</Text>
          </View>
        </GlassView>
      </View>
    </View>
  );
}

