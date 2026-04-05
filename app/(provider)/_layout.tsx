import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, Shadows } from '../../hooks/use-theme-colors';
import { fetchUnrepliedReviewCount } from '../../lib/api';
import i18n, { setupRtl, reloadForRtl } from '../../i18n';

export default function ProviderLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const [unrepliedCount, setUnrepliedCount] = useState(0);

  // Set default language to English for provider screens
  useEffect(() => {
    const setDefaultLanguage = async () => {
      if (i18n.language?.startsWith('ar')) {
        await i18n.changeLanguage('en');
        const needsReload = setupRtl();
        if (needsReload) {
          await reloadForRtl();
        }
      }
    };
    setDefaultLanguage();
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadCount = async () => {
      try {
        const count = await fetchUnrepliedReviewCount();
        if (mounted) setUnrepliedCount(count);
      } catch { /* silent */ }
    };
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => { mounted = false; clearInterval(interval); };
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
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
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
        name="dashboard"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="dashboard" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="deals"
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
              <MaterialIcons name="local-offer" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('tabs.scanQR'),
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="qr-code-scanner" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: t('tabs.reviews'),
          tabBarBadge: unrepliedCount > 0 ? unrepliedCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.primary,
            fontFamily: 'Cairo',
            fontSize: 10,
            fontWeight: '700',
            minWidth: 18,
            height: 18,
            borderRadius: 9,
          },
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              {focused && (
                <View style={{
                  width: 4, height: 4, borderRadius: 2,
                  backgroundColor: colors.primary,
                  marginBottom: 2,
                }} />
              )}
              <MaterialIcons name="rate-review" size={size} color={color} />
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
              <MaterialIcons name="store" size={size} color={color} />
            </View>
          ),
        }}
      />
      {/* Hidden screens (not shown in tab bar) */}
      <Tabs.Screen
        name="create-deal"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-deal/[id]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="scan-result"
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
        name="business-information"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="business-hours"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="social-media-links"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help-support"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
