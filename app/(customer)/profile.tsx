import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Appearance, I18nManager, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { setupRtl, reloadForRtl } from '../../i18n';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();

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

  const menuItems = [
    { id: '1', title: t('customer.personalInfo'), icon: 'person-outline', color: colors.brown },
    { id: '2', title: t('customer.paymentMethods'), icon: 'credit-card', color: colors.success },
    { id: '3', title: t('customer.security'), icon: 'shield', color: colors.purple },
    { id: '4', title: t('customer.helpSupport'), icon: 'help-outline', color: colors.iconDefault },
  ];

  const preferencesItems = [
    {
      id: 'theme',
      title: colors.isDark ? t('customer.lightMode') : t('customer.darkMode'),
      icon: colors.isDark ? 'light-mode' : 'dark-mode',
      color: colors.warning,
      onPress: toggleTheme
    },
    {
      id: 'lang',
      title: i18n.language?.startsWith('ar') ? 'English' : 'العربية',
      icon: 'language',
      color: colors.info,
      onPress: toggleLanguage
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('customer.profile')}</Text>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="settings" size={18} color={colors.onSurfaceVariant} />
        </AnimatedButton>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 16, borderRadius: Radius.xl, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: Radius.full, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                <MaterialIcons name="person" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: colors.onSurface }}>Alexa Doe</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Manrope', fontSize: 12, marginTop: 2 }}>alexa.doe@example.com</Text>
              </View>
              <TouchableOpacity style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="edit" size={16} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={150}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: colors.onSurface, marginBottom: 8 }}>{t('customer.accountSettings')}</Text>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 20 }}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== menuItems.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Epilogue', fontWeight: '600', fontSize: 14, color: colors.onSurface }}>{item.title}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={2} delay={200}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: colors.onSurface, marginBottom: 8 }}>{t('customer.preferences')}</Text>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 20 }}>
              {preferencesItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== preferencesItems.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Epilogue', fontWeight: '600', fontSize: 14, color: colors.onSurface }}>{item.title}</Text>
                  <MaterialIcons name="sync" size={16} color={colors.iconDefault} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={3} delay={250}>
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: colors.errorBgDark, padding: 12, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={16} color={colors.error} style={{ marginEnd: 8 }} />
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: colors.error }}>{t('customer.signOut')}</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
