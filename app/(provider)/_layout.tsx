import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors, Shadows } from '../../hooks/use-theme-colors';

export default function ProviderLayout() {
  const colors = useThemeColors();
  const { t } = useTranslation();

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
          height: 67,
          paddingBottom: 6,
          paddingTop: 6,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Manrope',
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
    </Tabs>
  );
}
