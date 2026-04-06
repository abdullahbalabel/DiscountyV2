import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { useAuth } from '../../contexts/auth';
import { setupRtl } from '../../i18n';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';

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
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
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

  const toggleLanguage = () => {
    const newLang = i18n.language?.startsWith('ar') ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    setupRtl();
  };

  const handleSendOtp = async () => {
    if (phone.length < 7) {
      setError(t('enterValidPhone'));
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
      setError(t('enterEmailPassword'));
      return;
    }
    if (password.length < 6) {
      setError(t('passwordMinLength'));
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
    paddingHorizontal: 4, paddingVertical: 12,
    backgroundColor: 'transparent',
    color: colors.isDark ? '#fff' : colors.onSurface,
    fontFamily: 'Cairo', fontSize: 15,
  };

  const labelStyle = {
    fontFamily: 'Cairo_600SemiBold', fontSize: 12, textTransform: 'uppercase' as const,
    letterSpacing: 2,
    color: colors.isDark ? 'rgba(255,255,255,0.9)' : colors.onSurfaceVariant,
    paddingHorizontal: 4,
  };

  // Theme-aware colors
  const textPrimary = colors.isDark ? '#fff' : colors.onSurface;
  const textSecondary = colors.isDark ? 'rgba(255,255,255,0.8)' : colors.onSurfaceVariant;
  const textMuted = colors.isDark ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant;
  const textFaint = colors.isDark ? 'rgba(255,255,255,0.5)' : colors.onSurfaceVariant;
  const placeholderColor = colors.isDark ? 'rgba(255,255,255,0.5)' : colors.onSurfaceVariant;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg, position: 'relative' }}>
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
          <View
            style={{
              width: '90%',
              maxWidth: 520,
              marginHorizontal: 24,
              marginVertical: 12,
              borderRadius: 24,
              padding: 20,
              zIndex: 10,
              backgroundColor: colors.isDark ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.95)',
              borderWidth: 1,
              borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: colors.isDark ? 0.4 : 0.1,
              shadowRadius: 24,
              elevation: 12,
            }}
          >
            {/* Language Switcher */}
            <View style={{ alignItems: 'flex-end', marginBottom: 12 }}>
              <Pressable
                onPress={toggleLanguage}
                accessibilityRole="button"
                accessibilityLabel={t('language')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: Radius.full,
                  backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(134,32,69,0.08)',
                  borderWidth: 1,
                  borderColor: colors.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(134,32,69,0.15)',
                }}
              >
                <MaterialIcons name="translate" size={14} color={colors.primary} />
                <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 11, color: colors.primary }}>
                  {i18n.language?.startsWith('ar') ? t('english') : t('arabic')}
                </Text>
              </Pressable>
            </View>

            {/* Branding */}
            <View style={{ marginBottom: 16, alignItems: 'center' }}>
              <View style={{
                width: 48, height: 48, borderRadius: 14,
                backgroundColor: colors.primary,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}>
                <MaterialIcons name="local-offer" size={26} color="#fff" />
              </View>
              <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 28, color: textPrimary, letterSpacing: -0.5 }}>{t('discounty')}</Text>
              <Text style={{ fontFamily: 'Cairo', color: textSecondary, marginTop: 4, fontSize: 13, textAlign: 'center' }}>
                {t('tagline')}
              </Text>
            </View>

            {/* Mode Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: colors.isDark ? 'rgba(255,255,255,0.06)' : '#F0F2F5', borderRadius: Radius.xl, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' }}>
              <Pressable
                onPress={() => { setAuthMode('email'); setError(''); }}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: Radius.lg, alignItems: 'center',
                  backgroundColor: authMode === 'email' ? colors.primary : 'transparent',
                  shadowColor: authMode === 'email' ? colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: authMode === 'email' ? 0.3 : 0,
                  shadowRadius: 4,
                  elevation: authMode === 'email' ? 4 : 0,
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: authMode === 'email' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="email" size={16} color={authMode === 'email' ? '#fff' : textMuted} />
                  <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: authMode === 'email' ? '#fff' : textMuted }}>
                    {t('email')}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => { setAuthMode('phone'); setError(''); }}
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: Radius.lg, alignItems: 'center',
                  backgroundColor: authMode === 'phone' ? colors.primary : 'transparent',
                  shadowColor: authMode === 'phone' ? colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: authMode === 'phone' ? 0.3 : 0,
                  shadowRadius: 4,
                  elevation: authMode === 'phone' ? 4 : 0,
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: authMode === 'phone' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialIcons name="phone" size={16} color={authMode === 'phone' ? '#fff' : textMuted} />
                  <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: authMode === 'phone' ? '#fff' : textMuted }}>
                    {t('phone')}
                  </Text>
                </View>
              </Pressable>
            </View>

            <View style={{ gap: 12 }}>
              {authMode === 'email' ? (
                <>
                  <View style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: colors.isDark ? 'rgba(255,255,255,0.15)' : '#E0E0E0', paddingBottom: 8 }}>
                    <Text style={labelStyle}>{t('email')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ paddingRight: 10 }}>
                        <MaterialIcons name="email" size={20} color={colors.isDark ? 'rgba(255,255,255,0.5)' : '#9E9E9E'} />
                      </View>
                      <TextInput
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder={t('auth.emailPlaceholder')}
                        placeholderTextColor={placeholderColor}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        value={email}
                        onChangeText={(v) => { setEmail(v); setError(''); }}
                      />
                    </View>
                  </View>

                  <View style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: colors.isDark ? 'rgba(255,255,255,0.15)' : '#E0E0E0', paddingBottom: 8 }}>
                    <Text style={labelStyle}>{t('password')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ paddingRight: 10 }}>
                        <MaterialIcons name="lock" size={20} color={colors.isDark ? 'rgba(255,255,255,0.5)' : '#9E9E9E'} />
                      </View>
                      <TextInput
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder="••••••••"
                        placeholderTextColor={placeholderColor}
                        secureTextEntry
                        value={password}
                        onChangeText={(v) => { setPassword(v); setError(''); }}
                      />
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ gap: 4, borderBottomWidth: 1, borderBottomColor: colors.isDark ? 'rgba(255,255,255,0.15)' : '#E0E0E0', paddingBottom: 8 }}>
                  <Text style={labelStyle}>{t('phoneNumber')}</Text>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      style={{
                        paddingHorizontal: 8, paddingVertical: 8,
                        flexDirection: 'row', alignItems: 'center', gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 18 }}>{selectedCountry.flag}</Text>
                      <Text style={{ color: textPrimary, fontFamily: 'Cairo_600SemiBold', fontSize: 14 }}>{selectedCountry.code}</Text>
                      <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.isDark ? 'rgba(255,255,255,0.5)' : '#9E9E9E'} />
                    </Pressable>

                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ paddingRight: 10 }}>
                        <MaterialIcons name="phone" size={20} color={colors.isDark ? 'rgba(255,255,255,0.5)' : '#9E9E9E'} />
                      </View>
                      <TextInput
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder={t('auth.phonePlaceholder')}
                        placeholderTextColor={placeholderColor}
                        keyboardType="phone-pad"
                        value={phone}
                        onChangeText={setPhone}
                        maxLength={15}
                      />
                    </View>
                  </View>

                  {showCountryPicker && (
                    <View style={{
                      backgroundColor: colors.isDark ? 'rgba(0,0,0,0.9)' : '#fff',
                      borderRadius: Radius.xl,
                      borderWidth: 1,
                      borderColor: colors.isDark ? 'rgba(255,255,255,0.15)' : '#E8ECF0',
                      marginTop: 8,
                      maxHeight: 240,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 8,
                    }}>
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
                              paddingHorizontal: 16, paddingVertical: 14,
                              borderBottomWidth: 1,
                              borderColor: colors.isDark ? 'rgba(255,255,255,0.08)' : '#F0F2F5',
                              backgroundColor: selectedCountry.code === country.code
                                ? (colors.isDark ? 'rgba(134,32,69,0.2)' : 'rgba(134,32,69,0.08)')
                                : 'transparent',
                            }}
                          >
                            <Text style={{ fontSize: 20 }}>{country.flag}</Text>
                            <Text style={{ color: textPrimary, fontFamily: 'Cairo', flex: 1, fontSize: 14 }}>{country.name}</Text>
                            <Text style={{ color: colors.primary, fontFamily: 'Cairo_600SemiBold', fontSize: 13 }}>{country.code}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Error Message */}
              {error ? (
                <View style={{
                  backgroundColor: colors.isDark ? 'rgba(239,68,68,0.15)' : '#FEF2F2',
                  borderWidth: 1,
                  borderColor: colors.isDark ? 'rgba(239,68,68,0.3)' : '#FECACA',
                  borderRadius: Radius.lg,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <MaterialIcons name="error-outline" size={18} color="#ef4444" />
                  <Text style={{ color: '#ef4444', fontFamily: 'Cairo', fontSize: 13, flex: 1 }}>{error}</Text>
                </View>
              ) : null}

              {/* Action Button */}
              <View style={{ marginTop: 8, gap: 8 }}>
                <AnimatedButton
                  variant="gradient"
                  style={{
                    paddingVertical: 14,
                    borderRadius: Radius.xl,
                    opacity: isLoading ? 0.7 : 1,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                  onPress={authMode === 'email' ? handleEmailAuth : handleSendOtp}
                  disabled={isLoading}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {isLoading ? (
                      <MaterialIcons name="hourglass-empty" size={20} color="#fff" />
                    ) : (
                      <MaterialIcons
                        name={authMode === 'email' ? 'login' : 'send'}
                        size={20}
                        color="#fff"
                      />
                    )}
                    <Text style={{ color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 16, textAlign: 'center' }}>
                      {isLoading
                        ? (authMode === 'email' ? t('signingIn') : t('sending'))
                        : authMode === 'email'
                          ? (isSignUp ? t('createAccount') : t('signIn'))
                          : t('sendVerificationCode')}
                    </Text>
                  </View>
                </AnimatedButton>
              </View>

              {/* Toggle sign-in/sign-up for email mode */}
              {authMode === 'email' && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Text style={{ fontFamily: 'Cairo', color: textMuted, fontSize: 13 }}>
                    {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
                  </Text>
                  <Pressable
                    onPress={() => { setIsSignUp(!isSignUp); setError(''); }}
                    style={{ paddingVertical: 4, paddingHorizontal: 8 }}
                  >
                    <Text style={{ fontFamily: 'Cairo_700Bold', color: colors.primary, fontSize: 13 }}>
                      {isSignUp ? t('signIn') : t('signUp')}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Info */}
              <View style={{ marginTop: 4, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Cairo', fontSize: 12, color: textMuted, textAlign: 'center', lineHeight: 20 }}>
                  {authMode === 'email'
                    ? t('signInWithEmail')
                    : t('sendOtpDesc')}
                </Text>
              </View>

              {/* Footer */}
              <View style={{ marginTop: 12, paddingTop: 16, borderTopWidth: 1, borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
                <Text style={{ fontFamily: 'Cairo', fontSize: 12, color: textFaint }}>{t('privacy')}</Text>
                <Text style={{ fontFamily: 'Cairo', fontSize: 12, color: textFaint }}>{t('terms')}</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
