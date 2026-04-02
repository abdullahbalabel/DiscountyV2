import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
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
    paddingHorizontal: 24, paddingVertical: 16, borderRadius: Radius.xl,
    backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.isDark ? 'rgba(255,255,255,0.2)' : colors.outlineVariant,
    color: colors.isDark ? '#fff' : colors.onSurface,
    fontFamily: 'Manrope', fontSize: 16,
  };

  const labelStyle = {
    fontFamily: 'Manrope', fontSize: 12, textTransform: 'uppercase' as const,
    letterSpacing: 2,
    color: colors.isDark ? 'rgba(255,255,255,0.9)' : colors.onSurfaceVariant,
    fontWeight: '600' as const,
    paddingHorizontal: 4,
  };

  // Theme-aware glass card colors
  const textPrimary = colors.isDark ? '#fff' : colors.onSurface;
  const textSecondary = colors.isDark ? 'rgba(255,255,255,0.8)' : colors.onSurfaceVariant;
  const textMuted = colors.isDark ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant;
  const textFaint = colors.isDark ? 'rgba(255,255,255,0.5)' : colors.onSurfaceVariant;
  const glassBorder = colors.isDark ? 'rgba(255,255,255,0.2)' : colors.outlineVariant;
  const toggleBg = colors.isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceContainer;
  const toggleActiveBg = colors.isDark ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh;
  const toggleBorder = colors.isDark ? 'rgba(255,255,255,0.1)' : colors.outlineVariant;
  const accentColor = colors.isDark ? '#ffb2be' : colors.primary;
  const iconColor = colors.isDark ? 'white' : colors.onSurfaceVariant;
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
          <GlassView
            intensity={colors.isDark ? 30 : 50}
            style={{ width: '90%', maxWidth: 520, marginHorizontal: 24, marginVertical: 24, borderRadius: Radius.glass, padding: 40, zIndex: 10, borderWidth: 1, borderColor: glassBorder }}
          >
            {/* Language Switcher */}
            <View style={{ alignItems: 'flex-end', marginBottom: 16 }}>
              <Pressable
                onPress={toggleLanguage}
                accessibilityRole="button"
                accessibilityLabel={t('language')}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingHorizontal: 12, paddingVertical: 6,
                  borderRadius: Radius.full,
                  backgroundColor: toggleBg,
                  borderWidth: 1, borderColor: toggleBorder,
                }}
              >
                <MaterialIcons name="language" size={16} color={iconColor} />
                <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 12, color: textPrimary }}>
                  {i18n.language?.startsWith('ar') ? t('english') : t('arabic')}
                </Text>
              </Pressable>
            </View>

            {/* Branding */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 48, color: textPrimary }}>{t('discounty')}</Text>
              <Text style={{ fontFamily: 'Manrope', color: textSecondary, marginTop: 8, fontSize: 18 }}>
                {t('tagline')}
              </Text>
            </View>

            {/* Mode Toggle */}
            <View style={{ flexDirection: 'row', backgroundColor: toggleBg, borderRadius: Radius.xl, padding: 4, marginBottom: 32, borderWidth: 1, borderColor: toggleBorder }}>
              <Pressable
                onPress={() => { setAuthMode('email'); setError(''); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center', backgroundColor: authMode === 'email' ? toggleActiveBg : 'transparent' }}
                accessibilityRole="tab"
                accessibilityState={{ selected: authMode === 'email' }}
              >
                <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 14, color: authMode === 'email' ? textPrimary : textMuted }}>
                  {t('email')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => { setAuthMode('phone'); setError(''); }}
                style={{ flex: 1, paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center', backgroundColor: authMode === 'phone' ? toggleActiveBg : 'transparent' }}
                accessibilityRole="tab"
                accessibilityState={{ selected: authMode === 'phone' }}
              >
                <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 14, color: authMode === 'phone' ? textPrimary : textMuted }}>
                  {t('phone')}
                </Text>
              </Pressable>
            </View>

            <View style={{ gap: 20 }}>
              {authMode === 'email' ? (
                <>
                  <View style={{ gap: 8 }}>
                    <Text style={labelStyle}>{t('email')}</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder={t('auth.emailPlaceholder')}
                      placeholderTextColor={placeholderColor}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      value={email}
                      onChangeText={(v) => { setEmail(v); setError(''); }}
                    />
                  </View>

                  <View style={{ gap: 8 }}>
                    <Text style={labelStyle}>{t('password')}</Text>
                    <TextInput
                      style={inputStyle}
                      placeholder="••••••••"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry
                      value={password}
                      onChangeText={(v) => { setPassword(v); setError(''); }}
                    />
                  </View>
                </>
              ) : (
                <View style={{ gap: 8 }}>
                  <Text style={labelStyle}>{t('phoneNumber')}</Text>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      style={{ paddingHorizontal: 16, paddingVertical: 16, borderRadius: Radius.xl, backgroundColor: colors.isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceContainerHigh, borderWidth: 1, borderColor: glassBorder, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
                      <Text style={{ color: textPrimary, fontFamily: 'Manrope', fontWeight: '600' }}>{selectedCountry.code}</Text>
                      <MaterialIcons name="arrow-drop-down" size={20} color={iconColor} />
                    </Pressable>

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

                  {showCountryPicker && (
                    <View style={{ backgroundColor: colors.isDark ? 'rgba(0,0,0,0.8)' : colors.surfaceContainerLowest, borderRadius: Radius.xl, borderWidth: 1, borderColor: glassBorder, marginTop: 8, maxHeight: 240, overflow: 'hidden' }}>
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
                              borderBottomWidth: 1, borderColor: colors.isDark ? 'rgba(255,255,255,0.1)' : colors.outlineVariant,
                              backgroundColor: selectedCountry.code === country.code ? (colors.isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceContainerHigh) : 'transparent',
                            }}
                          >
                            <Text style={{ fontSize: 18 }}>{country.flag}</Text>
                            <Text style={{ color: textPrimary, fontFamily: 'Manrope', flex: 1 }}>{country.name}</Text>
                            <Text style={{ color: textMuted, fontFamily: 'Manrope' }}>{country.code}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Error Message */}
              {error ? (
                <View style={{ backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Text style={{ color: '#ef4444', fontFamily: 'Manrope', fontSize: 14 }}>{error}</Text>
                </View>
              ) : null}

              {/* Action Button */}
              <View style={{ marginTop: 8, gap: 16 }}>
                <AnimatedButton
                  variant="gradient"
                  style={{ paddingVertical: 16, borderRadius: Radius.xl, opacity: isLoading ? 0.6 : 1 }}
                  onPress={authMode === 'email' ? handleEmailAuth : handleSendOtp}
                  disabled={isLoading}
                >
                  <Text style={{ color: '#fff', fontFamily: 'Manrope', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>
                    {isLoading
                      ? (authMode === 'email' ? t('signingIn') : t('sending'))
                      : authMode === 'email'
                        ? (isSignUp ? t('createAccount') : t('signIn'))
                        : t('sendVerificationCode')}
                  </Text>
                </AnimatedButton>
              </View>

              {/* Toggle sign-in/sign-up for email mode */}
              {authMode === 'email' && (
                <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: 'Manrope', color: textMuted, fontSize: 14 }}>
                    {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
                  </Text>
                  <Pressable onPress={() => { setIsSignUp(!isSignUp); setError(''); }}>
                    <Text style={{ fontFamily: 'Manrope', color: accentColor, fontWeight: '700', fontSize: 14 }}>
                      {isSignUp ? t('signIn') : t('signUp')}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Info */}
              <View style={{ marginTop: 8, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: textMuted, textAlign: 'center', lineHeight: 20 }}>
                  {authMode === 'email'
                    ? t('signInWithEmail')
                    : t('sendOtpDesc')}
                </Text>
              </View>

              {/* Footer */}
              <View style={{ marginTop: 16, paddingTop: 24, borderTopWidth: 1, borderColor: glassBorder, flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
                <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: textFaint }}>{t('privacy')}</Text>
                <Text style={{ fontFamily: 'Manrope', fontSize: 12, color: textFaint }}>{t('terms')}</Text>
              </View>
            </View>
          </GlassView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
