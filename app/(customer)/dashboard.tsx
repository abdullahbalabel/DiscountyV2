import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { fetchCustomerStats, fetchMyRedemptions, getActiveSlotCount } from '../../lib/api';
import type { Redemption } from '../../lib/types';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardScreen() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState({ totalClaimed: 0, totalRedeemed: 0, totalSaved: 0 });
  const [slotCount, setSlotCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [redemptionsData, statsData, slots] = await Promise.all([
        fetchMyRedemptions(),
        fetchCustomerStats(),
        getActiveSlotCount(),
      ]);
      setRedemptions(redemptionsData);
      setStats(statsData);
      setSlotCount(slots);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(false);
  };

  // Active redemptions = claimed or redeemed-but-not-reviewed
  const activeRedemptions = redemptions.filter(r =>
    r.status === 'claimed' || r.status === 'redeemed'
  );
  const completedRedemptions = redemptions.filter(r => r.status === 'expired');

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-2">
          <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
            My Deals
          </Text>
        </View>
        <AnimatedButton className="w-8 h-8 rounded-md bg-surface-container-high items-center justify-center p-0">
          <MaterialIcons name="notifications" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#862045" colors={['#862045']} />
        }
      >
        <View className="px-4 pt-2">
          {/* Slot Indicator */}
          <AnimatedEntrance index={0} delay={100}>
            <View className="bg-primary p-4 rounded-md shadow-sm mb-4 mt-2">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white font-headline text-sm font-bold">Deal Slots</Text>
                <MaterialIcons name="confirmation-number" size={18} color="#FFD700" />
              </View>

              {/* Slot Dots */}
              <View className="flex-row items-center gap-3 mb-3">
                {[0, 1, 2].map(i => (
                  <View key={i} className="flex-1 items-center">
                    <View className={`w-10 h-10 rounded-md items-center justify-center mb-1 ${i < slotCount ? 'bg-white/30 border-2 border-white' : 'bg-white/10 border border-white/20'
                      }`}>
                      <MaterialIcons
                        name={i < slotCount ? 'confirmation-number' : 'add'}
                        size={16}
                        color={i < slotCount ? 'white' : 'rgba(255,255,255,0.4)'}
                      />
                    </View>
                    <Text className={`text-[9px] font-bold uppercase tracking-wider ${i < slotCount ? 'text-white' : 'text-white/40'
                      }`}>
                      Slot {i + 1}
                    </Text>
                  </View>
                ))}
              </View>

              <Text className="text-white/80 font-body text-xs text-center">
                {slotCount === 0
                  ? 'All slots free! Claim a deal from the Feed.'
                  : slotCount >= 3
                    ? 'All slots used. Rate a deal to free a slot.'
                    : `${3 - slotCount} slot${3 - slotCount > 1 ? 's' : ''} available.`
                }
              </Text>
            </View>
          </AnimatedEntrance>

          {/* Quick Stats */}
          <View className="flex-row gap-3 mb-5">
            <AnimatedEntrance index={1} delay={150} className="flex-1">
              <View className="bg-surface-container-lowest p-3 rounded-md shadow-sm">
                <MaterialIcons name="local-offer" size={18} color="#862045" style={{ marginBottom: 6 }} />
                <Text className="font-headline font-bold text-xl text-on-surface mb-0.5">{stats.totalClaimed}</Text>
                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Claimed</Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={2} delay={200} className="flex-1">
              <View className="bg-surface-container-lowest p-3 rounded-md shadow-sm">
                <MaterialIcons name="qr-code-scanner" size={18} color="#00694d" style={{ marginBottom: 6 }} />
                <Text className="font-headline font-bold text-xl text-on-surface mb-0.5">{stats.totalRedeemed}</Text>
                <Text className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">Redeemed</Text>
              </View>
            </AnimatedEntrance>
          </View>

          {/* Active Redemptions */}
          <AnimatedEntrance index={3} delay={250}>
            <Text className="font-headline font-bold text-base text-on-surface mb-3">Active Deals</Text>

            {isLoading ? (
              <View className="py-6 items-center">
                <ActivityIndicator size="large" color="#862045" />
              </View>
            ) : activeRedemptions.length === 0 ? (
              <View className="rounded-md p-5 items-center bg-surface-container-lowest">
                <MaterialIcons name="local-mall" size={32} color="#85736f" />
                <Text className="font-headline font-bold text-sm text-on-surface mt-3">No Active Deals</Text>
                <Text className="text-on-surface-variant text-xs mt-1 text-center">
                  Head to the Feed to discover amazing deals!
                </Text>
                <AnimatedButton
                  variant="gradient"
                  className="mt-4 px-6 py-2 rounded-md"
                  onPress={() => router.push('/(customer)/feed')}
                >
                  <Text className="text-white font-bold text-sm">Browse Deals</Text>
                </AnimatedButton>
              </View>
            ) : (
              <View className="bg-surface-container-lowest rounded-md p-1.5">
                {activeRedemptions.map((redemption, idx) => {
                  const discount = (redemption as any).discount;
                  const provider = discount?.provider;
                  const needsReview = redemption.status === 'redeemed';

                  return (
                    <AnimatedButton
                      key={redemption.id}
                      className={`flex-row items-center p-3 bg-transparent ${idx !== activeRedemptions.length - 1 ? 'border-b border-surface-container' : ''
                        }`}
                      onPress={() => {
                        if (needsReview) {
                          router.push({ pathname: '/(customer)/rate/[redemptionId]', params: { redemptionId: redemption.id } } as any);
                        } else {
                          router.push({ pathname: '/(customer)/qr/[redemptionId]', params: { redemptionId: redemption.id } } as any);
                        }
                      }}
                    >
                      <View className="w-10 h-10 rounded-md overflow-hidden mr-3 bg-surface-container-high">
                        {discount?.image_url ? (
                          <Image source={{ uri: discount.image_url }} className="w-full h-full" contentFit="cover" />
                        ) : (
                          <View className="w-full h-full items-center justify-center bg-primary/10">
                            <MaterialIcons name="local-offer" size={18} color="#862045" />
                          </View>
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="font-headline font-bold text-sm text-on-surface" numberOfLines={1}>
                          {discount?.title || 'Deal'}
                        </Text>
                        <Text className="text-on-surface-variant text-[10px] font-medium mt-0.5">
                          {provider?.business_name || 'Provider'} • {timeAgo(redemption.claimed_at)}
                        </Text>
                      </View>
                      <View className={`px-2 py-1 rounded-md ${needsReview
                        ? 'bg-amber-100 dark:bg-amber-900/30'
                        : 'bg-green-100 dark:bg-green-900/30'
                        }`}>
                        <Text className={`text-[9px] font-bold uppercase tracking-wider ${needsReview ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'
                          }`}>
                          {needsReview ? 'Rate' : 'Active'}
                        </Text>
                      </View>
                    </AnimatedButton>
                  );
                })}
              </View>
            )}
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
