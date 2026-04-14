import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Logo } from './Logo';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { setupRtl, saveLanguage } from '../../i18n';

interface AuthHeaderProps {
  showLangSwitch?: boolean;
}

export function AuthHeader({ showLangSwitch = true }: AuthHeaderProps) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const isRtl = i18n.language?.startsWith('ar');

  const toggleLanguage = async () => {
    const newLang = i18n.language?.startsWith('ar') ? 'en' : 'ar';
    await i18n.changeLanguage(newLang);
    await saveLanguage(newLang);
    setupRtl();
  };

  return (
    <View style={styles.container}>
      {showLangSwitch && (
        <Pressable
          onPress={toggleLanguage}
          style={[
            styles.langButton,
            {
              backgroundColor: colors.isDark ? colors.surfaceContainer : 'rgba(134,32,69,0.08)',
              borderColor: colors.isDark ? colors.outlineVariant : 'rgba(134,32,69,0.15)',
            },
          ]}
        >
          <MaterialIcons name="translate" size={14} color={colors.primary} />
          <Text style={[styles.langText, { color: colors.primary }]}>
            {isRtl ? t('english') : t('arabic')}
          </Text>
        </Pressable>
      )}

      <View style={styles.branding}>
        <Logo size={48} />
        <Text style={[styles.brandName, { color: colors.onSurface }]}>
          {t('discounty')}
        </Text>
        <Text style={[styles.tagline, { color: colors.onSurfaceVariant }]}>
          {t('tagline')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-end',
  },
  langText: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 11,
  },
  branding: {
    alignItems: 'center',
    gap: 8,
  },
  brandName: {
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Cairo',
    fontSize: 14,
    textAlign: 'center',
  },
});