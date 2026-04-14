import { Tabs } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedTabBar, TabConfig } from '../../components/ui/AnimatedTabBar';

export default function CustomerLayout() {
  const { t } = useTranslation();

  const tabs: TabConfig[] = [
    { name: 'feed', title: t('tabs.deals'), icon: 'local-offer' },
    { name: 'dashboard', title: t('tabs.myDeals'), icon: 'confirmation-number' },
    { name: 'saved', title: t('tabs.saved'), icon: 'bookmark' },
    { name: 'profile', title: t('tabs.profile'), icon: 'person' },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => (
        <AnimatedTabBar tabs={tabs} {...props} />
      )}
    >
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="saved" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens */}
      <Tabs.Screen name="history" options={{ href: null }} />
      <Tabs.Screen name="deals/[id]" options={{ href: null }} />
      <Tabs.Screen name="provider/[id]" options={{ href: null }} />
      <Tabs.Screen name="qr/[redemptionId]" options={{ href: null }} />
      <Tabs.Screen name="rate/[redemptionId]" options={{ href: null }} />
      <Tabs.Screen name="tamagui-demo" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="privacy-data" options={{ href: null }} />
    </Tabs>
  );
}
