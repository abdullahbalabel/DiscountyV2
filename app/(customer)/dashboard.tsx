import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { CircularProgress } from '../../components/ui/CircularProgress';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotifications } from '../../contexts/notifications';
import { fetchCustomerStats, fetchMyRedemptions, getActiveSlotCount } from '../../lib/api';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { useOfflineWallet } from '../../hooks/use-offline-wallet';
import type { Redemption } from '../../lib/types';

export default function DashboardScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { unreadCount } = useNotifications();
  const { cachedRedemptions, lastSyncedAt, isOffline, syncWithServer } = useOfflineWallet();

  const timeAgo = useCallback((date: string): string => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return t('customer.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${t('customer.ago')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${t('customer.ago')}`;
    const days = Math.floor(hours / 24);
    return `${days}d ${t('customer.ago')}`;
  }, [t]);

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState({ totalClaimed: 0, totalRedeemed: 0, totalSaved: 0 });
  const [slotCount, setSlotCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [redemptionsData, statsData, slots] = await Promise.all([
        fetchMyRedemptions(), fetchCustomerStats(), getActiveSlotCount(),
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
  const handleRefresh = () => { setIsRefreshing(true); loadData(false); syncWithServer(); };

  const activeRedemptions = redemptions.filter(r => {
    if (r.status === 'claimed') return true;
    if (r.status === 'redeemed') return !r.review;
    return false;
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <GlassHeader style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface, flexShrink: 1 }}>{t('customer.myDeals')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.push('/(customer)/history')}>
            <MaterialIcons name="history" size={18} color={colors.iconDefault} />
          </AnimatedButton>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', position: 'relative' }} onPress={() => router.push('/(customer)/notifications' as any)}>
            <MaterialIcons name="notifications" size={18} color={colors.iconDefault} />
            {unreadCount > 0 && (
              <View style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </AnimatedButton>
        </View>
      </GlassHeader>

      {/* Wallet Badge */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
        <View style={{
          backgroundColor: colors.surfaceContainerLowest,
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: Radius.full,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.outlineVariant,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialIcons name="account-balance-wallet" size={16} color={colors.primary} />
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, color: colors.onSurface }}>
              {t('wallet.title')}: {cachedRedemptions.filter(r => r.status === 'claimed').length} {t('wallet.activeCount', { count: cachedRedemptions.filter(r => r.status === 'claimed').length }).replace(/\d+ /, '')}
            </Text>
          </View>
          <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>
            {t('wallet.synced')}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: colors.primary, padding: 16, borderRadius: Radius.md, marginBottom: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 14 }}>{t('customer.dealSlots')}</Text>
                <MaterialIcons name="confirmation-number" size={18} color="#FFD700" />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{
                      width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 4,
                      backgroundColor: i < slotCount ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                      borderWidth: i < slotCount ? 2 : 1, borderColor: i < slotCount ? '#fff' : 'rgba(255,255,255,0.2)',
                    }}>
                      <MaterialIcons name={i < slotCount ? 'confirmation-number' : 'add'} size={16} color={i < slotCount ? 'white' : 'rgba(255,255,255,0.4)'} />
                    </View>
                    <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: i < slotCount ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      {t('customer.slot')} {i + 1}
                    </Text>
                  </View>
                ))}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo', fontSize: 12, textAlign: 'center' }}>
                {slotCount === 0 ? t('customer.allSlotsFree') : slotCount >= 3 ? t('customer.allSlotsUsed') : t('customer.slotsAvailable', { count: 3 - slotCount })}
              </Text>
            </View>
          </AnimatedEntrance>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <AnimatedEntrance index={1} delay={150} style={{ flex: 1 }}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                <MaterialIcons name="local-offer" size={18} color={colors.primary} style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 2 }}>{stats.totalClaimed}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('customer.claimed')}</Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={2} delay={200} style={{ flex: 1 }}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                <MaterialIcons name="qr-code-scanner" size={18} color={colors.success} style={{ marginBottom: 6 }} />
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 2 }}>{stats.totalRedeemed}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('customer.redeemed')}</Text>
              </View>
            </AnimatedEntrance>
          </View>

          <AnimatedEntrance index={3} delay={250}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>{t('customer.activeDeals')}</Text>
            {isLoading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : activeRedemptions.length === 0 ? (
              <EmptyState
                icon="local-mall"
                title={t('customer.noActiveDeals')}
                message={t('customer.noActiveDealsDesc')}
                ctaLabel={t('customer.browseDeals')}
                onCtaPress={() => router.push('/(customer)/feed')}
              />
            ) : (
              <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.md, padding: 6 }}>
                {activeRedemptions.map((redemption, idx) => {
                  const discount = (redemption as any).discount;
                  const provider = discount?.provider;
                  const needsReview = redemption.status === 'redeemed';
                  const isActive = redemption.status === 'claimed';

                  let daysLeft = 0;
                  let progress = 0;
                  if (isActive && discount?.end_time) {
                    const now = Date.now();
                    const end = new Date(discount.end_time).getTime();
                    const start = new Date(redemption.claimed_at).getTime();
                    const totalDuration = end - start;
                    const elapsed = now - start;
                    daysLeft = Math.max(0, Math.ceil((end - now) / 86400000));
                    progress = totalDuration > 0 ? Math.max(0, Math.min(1, 1 - elapsed / totalDuration)) : 0;
                  }

                  return (
                    <AnimatedButton
                      key={redemption.id}
                      style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'transparent', borderBottomWidth: idx !== activeRedemptions.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}
                      onPress={() => {
                        if (needsReview) {
                          router.push({ pathname: '/(customer)/rate/[redemptionId]', params: { redemptionId: redemption.id } } as any);
                        } else {
                          router.push({ pathname: '/(customer)/qr/[redemptionId]', params: { redemptionId: redemption.id } } as any);
                        }
                      }}
                    >
                      <View style={{ width: 40, height: 40, borderRadius: Radius.md, overflow: 'hidden', marginEnd: 12, backgroundColor: colors.surfaceContainerHigh }}>
                        {discount?.image_url ? (
                          <Image source={{ uri: discount.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(134,32,69,0.1)' }}>
                            <MaterialIcons name="local-offer" size={18} color={colors.primary} />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface }} numberOfLines={1}>{discount?.title || t('customer.deal')}</Text>
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '500', marginTop: 2 }}>{provider?.business_name || t('customer.provider')} • {timeAgo(redemption.claimed_at)}
                        {cachedRedemptions.some(c => c.redemptionId === redemption.id) && isOffline && (
                          <Text> </Text>
                        )}
                        {cachedRedemptions.some(c => c.redemptionId === redemption.id) && isOffline && (
                          <MaterialIcons name="cloud-off" size={10} color={colors.onSurfaceVariant} />
                        )}
                      </Text>
                      </View>
                      {isActive ? (
                        <CircularProgress size={44} strokeWidth={3} progress={progress} daysLeft={daysLeft} isDark={colors.isDark} />
                      ) : (
                        <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: colors.warningBg, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <MaterialIcons name="star" size={12} color={colors.warning} />
                          <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.warningText }}>
                            {t('customer.review')}
                          </Text>
                        </View>
                      )}
                    </AnimatedButton>
                  );
                })}
              </View>
            )}
          </AnimatedEntrance>

          {/* Last synced footer */}
          {lastSyncedAt && (
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, fontFamily: 'Cairo' }}>
                {t('wallet.lastSynced', { time: timeAgo(lastSyncedAt) })}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
