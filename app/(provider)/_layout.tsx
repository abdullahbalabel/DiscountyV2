import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedTabBar, TabConfig } from '../../components/ui/AnimatedTabBar';
import { fetchUnrepliedReviewCount } from '../../lib/api';

export default function ProviderLayout() {
  const { t } = useTranslation();
  const [unrepliedCount, setUnrepliedCount] = useState(0);

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

  const regularTabs: TabConfig[] = [
    { name: 'dashboard', title: t('tabs.dashboard'), icon: 'dashboard' },
    { name: 'deals', title: t('tabs.myDeals'), icon: 'local-offer' },
    { name: 'reviews', title: t('tabs.reviews'), icon: 'rate-review', badge: unrepliedCount > 0 ? unrepliedCount : undefined },
    { name: 'profile', title: t('tabs.profile'), icon: 'store' },
  ];

  const fabTab: TabConfig = {
    name: 'scan',
    title: t('tabs.scanQR'),
    icon: 'qr-code-scanner',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
      tabBar={(props) => (
        <AnimatedTabBar
          tabs={regularTabs}
          fabTab={fabTab}
          {...props}
        />
      )}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="deals" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="reviews" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens */}
      <Tabs.Screen name="create-deal" options={{ href: null }} />
      <Tabs.Screen name="edit-deal/[id]" options={{ href: null }} />
      <Tabs.Screen name="scan-result" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="business-information" options={{ href: null }} />
      <Tabs.Screen name="business-hours" options={{ href: null }} />
      <Tabs.Screen name="social-media-links" options={{ href: null }} />
      <Tabs.Screen name="help-support" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="subscription" options={{ href: null }} />
      <Tabs.Screen name="broadcast-push" options={{ href: null }} />
    </Tabs>
  );
}
