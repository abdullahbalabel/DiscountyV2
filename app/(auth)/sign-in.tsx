import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { Input } from '../../components/ui/Input';
import { AuthColors, AuthStyles } from '../../constants/auth-theme';
import { useAuth } from '../../contexts/auth';

export default function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signInWithEmail } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string | null => {
    if (!email.trim()) return t('emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return t('invalidEmail');
    if (!password) return t('passwordRequired');
    if (password.length < 6) return t('passwordMinLength');
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
    const result = await signInWithEmail(email.trim(), password);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    }
  };

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
            <Text style={AuthStyles.heading}>{t('welcomeBack')}</Text>
            <Text style={AuthStyles.subheading}>{t('signInToAccount')}</Text>
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
            <Input
              label={t('password')}
              icon="lock"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!isLoading}
            />
          </View>
        </AnimatedEntrance>

        {/* Forgot Password */}
        <AnimatedEntrance index={3}>
          <Pressable
            onPress={() => router.push('/(auth)/forgot-password')}
            hitSlop={8}
            style={{ alignSelf: 'flex-end', marginBottom: 24 }}
          >
            <Text
              style={{
                fontFamily: 'Cairo_600SemiBold',
                fontSize: 13,
                color: AuthColors.muted,
              }}
            >
              {t('forgotPassword')}
            </Text>
          </Pressable>
        </AnimatedEntrance>

        {/* Error Display */}
        {error && (
          <AnimatedEntrance index={4}>
            <View style={AuthStyles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={AuthColors.error} />
              <Text style={AuthStyles.errorText}>{error}</Text>
            </View>
          </AnimatedEntrance>
        )}

        {/* Submit Button */}
        <AnimatedEntrance index={5}>
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
                {t('signIn')}
              </Text>
            )}
          </AnimatedButton>
        </AnimatedEntrance>

        {/* Spacer to push footer down */}
        <View style={{ flex: 1 }} />

        {/* Footer */}
        <AnimatedEntrance index={6}>
          <View style={AuthStyles.footer}>
            <Text style={AuthStyles.footerText}>{t('dontHaveAccount')}</Text>
            <Pressable onPress={() => router.push('/(auth)/sign-up')} hitSlop={8}>
              <Text style={AuthStyles.footerLink}>{t('signUp')}</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </View>
  );
}
