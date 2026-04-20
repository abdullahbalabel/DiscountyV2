import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { Logo } from '../../components/ui/Logo';
import { AuthColors, AuthStyles } from '../../constants/auth-theme';
import { saveLanguage, setupRtl } from '../../i18n';

export default function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState<'google' | 'apple' | null>(null);

  const toggleLanguage = async () => {
    const newLang = i18n.language?.startsWith('ar') ? 'en' : 'ar';
    await i18n.changeLanguage(newLang);
    await saveLanguage(newLang);
    setupRtl();
  };

  return (
    <View style={AuthStyles.container}>
      <View style={AuthStyles.contentContainer}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          {/* Branding */}
          <AnimatedEntrance index={0}>
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{ marginBottom: 12 }}>
                <Logo size={64} />
              </View>
              <Text
                style={{
                  fontFamily: 'Cairo_700Bold',
                  fontSize: 28,
                  color: AuthColors.text,
                }}
              >
                {t('discounty')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: AuthColors.muted,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {t('tagline')}
              </Text>
            </View>
          </AnimatedEntrance>

          {/* Social Buttons */}
          <AnimatedEntrance index={1}>
            <Pressable
              disabled
              style={[
                AuthStyles.socialButton,
                AuthStyles.socialButtonGoogle,
                { opacity: 0.5 },
              ]}
            >
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#4285F4', width: 20, textAlign: 'center' }}>G</Text>
              <Text style={[AuthStyles.socialButtonLabel, { color: AuthColors.text }]}>
                {t('signInWithGoogle')}
              </Text>
            </Pressable>
          </AnimatedEntrance>

          {Platform.OS === 'ios' && (
            <AnimatedEntrance index={2}>
              <Pressable
                disabled
                style={[
                  AuthStyles.socialButton,
                  AuthStyles.socialButtonApple,
                  { marginTop: 12, opacity: 0.5 },
                ]}
              >
                <Ionicons name="logo-apple" size={20} color="#fff" />
                <Text style={[AuthStyles.socialButtonLabel, { color: '#fff' }]}>
                  {t('signInWithApple')}
                </Text>
              </Pressable>
            </AnimatedEntrance>
          )}

          {/* Divider */}
          <AnimatedEntrance index={3}>
            <View style={AuthStyles.dividerContainer}>
              <View style={AuthStyles.dividerLine} />
              <Text style={AuthStyles.dividerText}>{t('or')}</Text>
              <View style={AuthStyles.dividerLine} />
            </View>
          </AnimatedEntrance>

          {/* Email Links */}
          <AnimatedEntrance index={4}>
            <AnimatedButton
              variant="outline"
              style={[AuthStyles.socialButton, AuthStyles.socialButtonOutline]}
              onPress={() => router.push('/(auth)/sign-in')}
            >
              <Ionicons name="mail-outline" size={18} color={AuthColors.text} style={{ marginEnd: 4 }} />
              <Text style={[AuthStyles.socialButtonLabel, { color: AuthColors.text }]}>
                {t('signInWithEmail')}
              </Text>
            </AnimatedButton>
          </AnimatedEntrance>

          <AnimatedEntrance index={5}>
            <AnimatedButton
              variant="outline"
              style={[AuthStyles.socialButton, AuthStyles.socialButtonOutline, { marginTop: 12 }]}
              onPress={() => router.push('/(auth)/sign-up')}
            >
              <Ionicons name="person-add-outline" size={18} color={AuthColors.primary} style={{ marginEnd: 4 }} />
              <Text style={[AuthStyles.socialButtonLabel, { color: AuthColors.primary }]}>
                {t('createAccount')}
              </Text>
            </AnimatedButton>
          </AnimatedEntrance>
        </View>

        {/* Language Toggle */}
        <AnimatedEntrance index={6}>
          <View style={{ alignItems: 'center', paddingTop: 16 }}>
            <Pressable
              onPress={toggleLanguage}
              hitSlop={8}
              style={AuthStyles.languageToggle}
            >
              <Ionicons name="language-outline" size={16} color={AuthColors.primary} />
              <Text
                style={{
                  fontFamily: 'Cairo_600SemiBold',
                  fontSize: 13,
                  color: AuthColors.primary,
                }}
              >
                {i18n.language?.startsWith('ar') ? t('english') : t('arabic')}
              </Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      </View>
    </View>
  );
}
