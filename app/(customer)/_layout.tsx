import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, Shadows } from '../../hooks/use-theme-colors';
import i18n, { setupRtl, reloadForRtl } from '../../i18n';

export default function CustomerLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  // Set default language to Arabic for customer screens
  useEffect(() => {
    const setDefaultLanguage = async () => {
      if (!i18n.language?.startsWith('ar')) {
        await i18n.changeLanguage('ar');
        const needsReload = setupRtl();
        if (needsReload) {
          await reloadForRtl();
        }
      }
    };
    setDefaultLanguage();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 0,
          ...Shadows.md,
          height: 104,
          paddingBottom: 12,
          paddingTop: 12,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Cairo',
          fontSize: 10,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.3,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: t('tabs.deals'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="local-offer" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('tabs.myDeals'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="confirmation-number" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: t('tabs.saved'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="bookmark" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="person" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="deals/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="provider/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="qr/[redemptionId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="rate/[redemptionId]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="tamagui-demo"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="privacy-data"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
