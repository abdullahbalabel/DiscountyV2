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

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validate = (): string | null => {
    if (!firstName.trim()) return t('firstNameRequired');
    if (firstName.trim().length < 2) return t('firstNameMinLength');
    if (!lastName.trim()) return t('lastNameRequired');
    if (lastName.trim().length < 2) return t('lastNameMinLength');
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
    const result = await signUpWithEmail(email.trim(), password, firstName.trim(), lastName.trim());
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
            <Text style={AuthStyles.heading}>{t('createYourAccount')}</Text>
            <Text style={AuthStyles.subheading}>{t('joinDiscounty')}</Text>
          </View>
        </AnimatedEntrance>

        {/* Form */}
        <AnimatedEntrance index={2}>
          <View style={AuthStyles.inputContainer}>
            <Input
              label={t('firstName')}
              icon="person"
              placeholder={t('firstName')}
              autoCapitalize="words"
              value={firstName}
              onChangeText={setFirstName}
              editable={!isLoading}
            />
            <Input
              label={t('lastName')}
              icon="person-outline"
              placeholder={t('lastName')}
              autoCapitalize="words"
              value={lastName}
              onChangeText={setLastName}
              editable={!isLoading}
            />
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
                {t('createAccount')}
              </Text>
            )}
          </AnimatedButton>
        </AnimatedEntrance>

        {/* Spacer to push footer down */}
        <View style={{ flex: 1 }} />

        {/* Footer */}
        <AnimatedEntrance index={5}>
          <View style={AuthStyles.footer}>
            <Text style={AuthStyles.footerText}>{t('alreadyHaveAccount')}</Text>
            <Pressable onPress={() => router.push('/(auth)/sign-in')} hitSlop={8}>
              <Text style={AuthStyles.footerLink}>{t('signIn')}</Text>
            </Pressable>
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </View>
  );
}
