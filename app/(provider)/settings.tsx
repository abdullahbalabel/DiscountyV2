import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Appearance, I18nManager, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { setupRtl, reloadForRtl } from '../../i18n';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const toggleTheme = () => {
    Appearance.setColorScheme(colors.isDark ? 'light' : 'dark');
  };

  const toggleLanguage = async () => {
    await i18n.changeLanguage(i18n.language?.startsWith('ar') ? 'en' : 'ar');
    const needsReload = setupRtl();
    if (needsReload) {
      await reloadForRtl();
    }
  };

  const settingsItems = [
    {
      id: 'theme',
      title: colors.isDark ? t('provider.lightMode') : t('provider.darkMode'),
      icon: colors.isDark ? 'light-mode' : 'dark-mode',
      color: colors.warning,
      onPress: toggleTheme,
    },
    {
      id: 'lang',
      title: i18n.language?.startsWith('ar') ? 'English' : 'العربية',
      icon: 'language',
      color: colors.info,
      onPress: toggleLanguage,
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View style={{
        width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceBg,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <MaterialIcons name={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'} size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>
          {t('provider.settingsTitle')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={50}>
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: 1.5,
              color: colors.onSurfaceVariant, marginBottom: 8, marginStart: 4,
            }}>
              {t('customer.preferences')}
            </Text>
            <View style={{
              backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl,
              borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden',
            }}>
              {settingsItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14,
                    borderBottomWidth: idx !== settingsItems.length - 1 ? 1 : 0,
                    borderBottomColor: colors.surfaceContainer,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center',
                    marginEnd: 14,
                  }}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>
                    {item.title}
                  </Text>
                  <MaterialIcons name="sync" size={16} color={colors.iconDefault} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
