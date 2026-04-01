import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import type { ProviderStats } from '../../lib/api';
import { fetchOwnProviderProfile, fetchProviderStats } from '../../lib/api';
import type { ProviderProfile } from '../../lib/types';

export default function ProviderDashboard() {
  const { signOut, session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, profileData] = await Promise.all([
        fetchProviderStats(),
        fetchOwnProviderProfile(),
      ]);
      setStats(statsData);
      setProfile(profileData);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) loadData();
  }, [session, loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const quickActions = [
    {
      icon: 'add-circle' as const,
      label: 'Create New Deal',
      color: '#862045',
      onPress: () => router.push('/(provider)/create-deal'),
    },
    {
      icon: 'qr-code-scanner' as const,
      label: 'Scan Customer QR',
      color: '#00694d',
      onPress: () => router.push('/(provider)/scan'),
    },
    {
      icon: 'rate-review' as const,
      label: 'View Reviews',
      color: '#7b5733',
      onPress: () => router.push('/(provider)/reviews'),
    },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#862045" />
        <Text className="text-on-surface-variant font-body mt-3 text-sm">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <View>
          <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
            Dashboard
          </Text>
          {profile && (
            <Text className="text-on-surface-variant text-[10px] font-body mt-0.5">
              {profile.business_name}
            </Text>
          )}
        </View>
        <AnimatedButton
          className="w-8 h-8 rounded-md bg-surface-container-high items-center justify-center p-0"
          onPress={() => signOut()}
        >
          <MaterialIcons name="logout" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#862045" />
        }
      >
        <View className="px-4 pt-2">
          {/* Rating Card */}
          <AnimatedEntrance index={0} delay={100}>
            <View className="bg-primary p-4 rounded-md shadow-sm mb-4 mt-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white font-headline text-sm font-bold">Your Rating</Text>
                <MaterialIcons name="star" size={18} color="#FFD700" />
              </View>
              <Text className="text-white font-headline font-black text-3xl tracking-tighter mb-1">
                {(stats?.averageRating || 0) > 0
                  ? stats!.averageRating.toFixed(1)
                  : '—'}
              </Text>
              <Text className="text-white/80 font-body text-xs">
                {stats?.totalReviews || 0} total reviews from customers
              </Text>
            </View>
          </AnimatedEntrance>

          {/* Quick Stats Grid */}
          <View className="flex-row gap-3 mb-3">
            <AnimatedEntrance index={1} delay={150} className="flex-1">
              <View className="bg-surface-container-lowest p-3 rounded-md border-outline-variant/10 shadow-sm">
                <MaterialIcons name="local-offer" size={18} color="#862045" />
                <Text className="font-headline font-bold text-xl text-on-surface mb-0.5 mt-2">
                  {stats?.activeDeals || 0}
                </Text>
                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                  Active Deals
                </Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={2} delay={200} className="flex-1">
              <View className="bg-surface-container-lowest p-3 rounded-md border-outline-variant/10 shadow-sm">
                <MaterialIcons name="qr-code" size={18} color="#00694d" />
                <Text className="font-headline font-bold text-xl text-on-surface mb-0.5 mt-2">
                  {stats?.totalRedemptions || 0}
                </Text>
                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                  Redemptions
                </Text>
              </View>
            </AnimatedEntrance>
          </View>

          {/* Detailed Stats */}
          <View className="flex-row gap-3 mb-5">
            <AnimatedEntrance index={3} delay={250} className="flex-1">
              <View className="bg-surface-container-lowest p-3 rounded-md border-outline-variant/10 shadow-sm">
                <MaterialIcons name="hourglass-top" size={18} color="#f59e0b" />
                <Text className="font-headline font-bold text-xl text-on-surface mb-0.5 mt-2">
                  {stats?.claimedRedemptions || 0}
                </Text>
                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                  Pending
                </Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={4} delay={300} className="flex-1">
              <View className="bg-surface-container-lowest p-3 rounded-md border-outline-variant/10 shadow-sm">
                <MaterialIcons name="check-circle" size={18} color="#10b981" />
                <Text className="font-headline font-bold text-xl text-on-surface mb-0.5 mt-2">
                  {stats?.redeemedRedemptions || 0}
                </Text>
                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                  Completed
                </Text>
              </View>
            </AnimatedEntrance>
          </View>

          {/* Recent Activity */}
          {stats?.recentRedemptions && stats.recentRedemptions.length > 0 && (
            <AnimatedEntrance index={5} delay={350}>
              <Text className="font-headline font-bold text-base text-on-surface mb-3">
                Recent Activity
              </Text>
              <View className="bg-surface-container-lowest rounded-md border-outline-variant/10 overflow-hidden mb-5">
                {stats.recentRedemptions.map((redemption, idx) => (
                  <View
                    key={redemption.id}
                    className={`flex-row items-center p-3 ${idx !== stats.recentRedemptions.length - 1
                      ? 'border-b border-surface-container'
                      : ''
                      }`}
                  >
                    <View className={`w-8 h-8 rounded-md items-center justify-center mr-3 ${redemption.status === 'redeemed'
                      ? 'bg-green-500/10'
                      : 'bg-amber-500/10'
                      }`}>
                      <MaterialIcons
                        name={redemption.status === 'redeemed' ? 'check-circle' : 'hourglass-top'}
                        size={16}
                        color={redemption.status === 'redeemed' ? '#10b981' : '#f59e0b'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-headline font-semibold text-xs text-on-surface" numberOfLines={1}>
                        {(redemption.discount as any)?.title || 'Deal'}
                      </Text>
                      <Text className="text-on-surface-variant text-[10px] font-body mt-0.5">
                        {redemption.status === 'redeemed' ? 'Redeemed' : 'Claimed'} •{' '}
                        {new Date(redemption.claimed_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className={`px-2 py-0.5 rounded-md ${redemption.status === 'redeemed'
                      ? 'bg-green-500/10'
                      : 'bg-amber-500/10'
                      }`}>
                      <Text className={`text-[9px] font-bold uppercase tracking-wider ${redemption.status === 'redeemed'
                        ? 'text-green-600'
                        : 'text-amber-600'
                        }`}>
                        {redemption.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </AnimatedEntrance>
          )}

          {/* Quick Actions */}
          <AnimatedEntrance index={6} delay={400}>
            <Text className="font-headline font-bold text-base text-on-surface mb-3">Quick Actions</Text>
            <View className="flex-col gap-2">
              {quickActions.map((action) => (
                <AnimatedButton
                  key={action.label}
                  className="flex-row items-center p-3 bg-surface-container-lowest rounded-xl border-outline-variant/10"
                  onPress={action.onPress}
                >
                  <View className="w-8 h-8 rounded-md bg-surface-container-high items-center justify-center mr-3">
                    <MaterialIcons name={action.icon} size={18} color={action.color} />
                  </View>
                  <Text className="flex-1 font-headline font-semibold text-sm text-on-surface">
                    {action.label}
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color="#85736f" />
                </AnimatedButton>
              ))}
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
