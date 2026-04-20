import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { Input } from '../../components/ui/Input';
import { AuthColors, AuthStyles } from '../../constants/auth-theme';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): string | null => {
    if (!email.trim()) return t('emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return t('invalidEmail');
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    await supabase.auth.resetPasswordForEmail(email.trim());
    setIsLoading(false);

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <View style={AuthStyles.container}>
        <ScrollView
          contentContainerStyle={[AuthStyles.contentContainer, { justifyContent: 'center' }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AnimatedEntrance index={0}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: '#ECFDF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                }}
              >
                <Ionicons name="mail-outline" size={36} color="#10B981" />
              </View>
              <Text
                style={{
                  fontFamily: 'Cairo_700Bold',
                  fontSize: 24,
                  color: AuthColors.text,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                {t('checkYourEmail')}
              </Text>
              <Text
                style={{
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: AuthColors.muted,
                  textAlign: 'center',
                  lineHeight: 22,
                }}
              >
                {t('resetLinkSentDesc')}
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1}>
            <Pressable
              onPress={() => router.replace('/(auth)/sign-in')}
              hitSlop={8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 16,
              }}
            >
              <Ionicons name="arrow-back" size={18} color={AuthColors.primary} />
              <Text
                style={{
                  fontFamily: 'Cairo_700Bold',
                  fontSize: 15,
                  color: AuthColors.primary,
                }}
              >
                {t('backToSignIn')}
              </Text>
            </Pressable>
          </AnimatedEntrance>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={AuthStyles.container}>
      <ScrollView
        contentContainerStyle={AuthStyles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <AnimatedEntrance index={0}>
          <Pressable
            onPress={() => router.back()}
            style={AuthStyles.backButton}
            hitSlop={8}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={AuthColors.text}
            />
          </Pressable>
        </AnimatedEntrance>

        {/* Header */}
        <AnimatedEntrance index={1}>
          <View style={AuthStyles.header}>
            <Text style={AuthStyles.heading}>{t('forgotPasswordTitle')}</Text>
            <Text style={AuthStyles.subheading}>{t('forgotPasswordSubtext')}</Text>
          </View>
        </AnimatedEntrance>

        {/* Form */}
        <AnimatedEntrance index={2}>
          <View style={AuthStyles.inputContainer}>
            <Input
              label={t('email')}
              icon="email"
              placeholder={t('auth.emailPlaceholder')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!isLoading}
            />
          </View>
        </AnimatedEntrance>

        {/* Error Display */}
        {error && (
          <AnimatedEntrance index={3}>
            <View style={AuthStyles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={AuthColors.error} />
              <Text style={AuthStyles.errorText}>{error}</Text>
            </View>
          </AnimatedEntrance>
        )}

        {/* Submit Button */}
        <AnimatedEntrance index={4}>
          <AnimatedButton
            variant="gradient"
            onPress={handleSubmit}
            disabled={isLoading}
            style={{
              width: '100%',
              paddingVertical: 16,
              marginTop: error ? 16 : 0,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  fontFamily: 'Cairo_700Bold',
                  fontSize: 16,
                  color: '#fff',
                }}
              >
                {t('sendResetLink')}
              </Text>
            )}
          </AnimatedButton>
        </AnimatedEntrance>
      </ScrollView>
    </View>
  );
}
