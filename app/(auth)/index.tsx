import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
import { useAuth } from '../../contexts/auth';

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
      if (result.error) setError(result.error);
    } else {
      const result = await signInWithEmail(email, password);
      setIsLoading(false);
      if (result.error) setError(result.error);
    }
  };

  const inputStyle = {
    paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)', color: '#fff',
    fontFamily: 'Manrope', fontSize: 16,
  };

  const labelStyle = {
    fontFamily: 'Manrope', fontSize: 12, textTransform: 'uppercase' as const,
    letterSpacing: 2, color: 'rgba(255,255,255,0.9)', fontWeight: '600' as const,
    paddingHorizontal: 4,
  };

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
            style={{ width: '90%', maxWidth: 520, marginHorizontal: 24, marginVertical: 24, borderRadius: 32, padding: 40, zIndex: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            {/* Branding */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 48, color: '#fff' }}>Discounty</Text>
              <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.8)', marginTop: 8, fontSize: 18 }}>
                Your deals, verified & rewarded.
              </Text>
            </View>

            {/* Mode Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 4, marginBottom: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
              <Pressable
                onPress={() => { setAuthMode('email'); setError(''); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: authMode === 'email' ? 'rgba(255,255,255,0.2)' : 'transparent' }}
              >
                <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 14, color: authMode === 'email' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  Email
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setAuthMode('phone'); setError(''); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: authMode === 'phone' ? 'rgba(255,255,255,0.2)' : 'transparent' }}
              >
                <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 14, color: authMode === 'phone' ? '#fff' : 'rgba(255,255,255,0.5)' }}>
                  Phone
                </Text>
              </Pressable>
            </View>

            <View style={{ gap: 20 }}>
              {authMode === 'email' ? (
                <>
                  <View style={{ gap: 8 }}>
                    <Text style={labelStyle}>Email</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="you@example.com"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={email}
                      onChangeText={(v) => { setEmail(v); setError(''); }}
                    />
                  </View>

                  <View style={{ gap: 8 }}>
                    <Text style={labelStyle}>Password</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      secureTextEntry
                      value={password}
                      onChangeText={(v) => { setPassword(v); setError(''); }}
                    />
                  </View>
                </>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={labelStyle}>Phone Number</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      style={{ paddingHorizontal: 16, paddingVertical: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                      <Text style={{ color: '#fff', fontFamily: 'Manrope', fontWeight: '600' }}>{selectedCountry.code}</Text>
                      <MaterialIcons name="arrow-drop-down" size={20} color="white" />
                    </Pressable>

                    <TextInput
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="5XX XXX XXX"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      maxLength={15}
                    />
                  </View>

                  {showCountryPicker && (
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginTop: 8, maxHeight: 240, overflow: 'hidden' }}>
                      <ScrollView nestedScrollEnabled>
                        {COUNTRY_CODES.map((country) => (
                          <Pressable
                            key={country.code}
                            onPress={() => {
                              setSelectedCountry(country);
                              setShowCountryPicker(false);
                            }}
                            style={{
                              flexDirection: 'row', alignItems: 'center', gap: 12,
                              paddingHorizontal: 16, paddingVertical: 12,
                              borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
                              backgroundColor: selectedCountry.code === country.code ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                          >
                            <Text style={{ fontSize: 18 }}>{country.flag}</Text>
                            <Text style={{ color: '#fff', fontFamily: 'Manrope', flex: 1 }}>{country.name}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Manrope' }}>{country.code}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Error Message */}
              {error ? (
                <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Text style={{ color: '#ef4444', fontFamily: 'Manrope', fontSize: 14 }}>{error}</Text>
                </View>
              ) : null}

              {/* Action Button */}
              <View style={{ marginTop: 8, gap: 16 }}>
                <AnimatedButton
                  variant="gradient"
                  style={{ paddingVertical: 16, borderRadius: 16, opacity: isLoading ? 0.6 : 1 }}
                  onPress={authMode === 'email' ? handleEmailAuth : handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Manrope', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>
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
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                  </Text>
                  <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(''); }}>
                    <Text style={{ fontFamily: 'Manrope', color: '#ffb2be', fontWeight: '700', fontSize: 14 }}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Info */}
              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 }}>
                  {authMode === 'email'
                    ? 'Sign in with your email and password.'
                    : "We'll send you a one-time verification code via SMS.\nStandard message rates may apply."}
                </Text>
              </View>

              {/* Footer */}
              <View style={{ marginTop: 16, paddingTop: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
                <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Privacy</Text>
                <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Terms</Text>
              </View>
            </View>
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>


    </View>
  );
}
