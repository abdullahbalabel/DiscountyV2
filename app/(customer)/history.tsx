import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchMyRedemptions } from '../../lib/api';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import type { Redemption } from '../../lib/types';

function formatDate(date: string, locale: string = 'en-US'): string {
  return new Date(date).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
}

function StarRating({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <MaterialIcons key={i} name="star" size={size} color={i <= rating ? '#f59e0b' : '#e5e7eb'} />
      ))}
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ar') ? 'ar' : 'en-US';

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'reviewed' | 'expired'>('all');

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await fetchMyRedemptions();
      setRedemptions(data);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const handleRefresh = () => { setIsRefreshing(true); loadData(false); };

  const reviewedDeals = redemptions.filter(r => r.status === 'redeemed' && !!r.review);
  const expiredDeals = redemptions.filter(r => r.status === 'expired');
  const completedDeals = [...reviewedDeals, ...expiredDeals].sort((a, b) =>
    new Date(b.redeemed_at || b.claimed_at).getTime() - new Date(a.redeemed_at || a.claimed_at).getTime()
  );

  const filteredDeals = filter === 'all' ? completedDeals : filter === 'reviewed' ? reviewedDeals : expiredDeals;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('customer.history')}</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['all', 'reviewed', 'expired'] as const).map(f => (
          <AnimatedButton
            key={f}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
              backgroundColor: filter === f ? colors.primary : colors.surfaceContainerLowest,
              borderWidth: filter === f ? 0 : 1,
              borderColor: colors.surfaceContainer,
            }}
            onPress={() => setFilter(f)}
          >
            <Text style={{
              fontSize: 12, fontWeight: '700', fontFamily: 'Manrope', textTransform: 'capitalize',
              color: filter === f ? '#fff' : colors.onSurfaceVariant,
            }}>
              {f === 'all' ? t('customer.all') : f === 'reviewed' ? t('customer.reviewed') : t('deal.expired')}
            </Text>
          </AnimatedButton>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredDeals.length === 0 ? (
          <EmptyState
            icon="history"
            title={t('customer.noHistoryYet')}
            message={filter === 'reviewed' ? t('customer.noReviewedDeals') : filter === 'expired' ? t('customer.noExpiredDeals') : t('customer.completedDealsAppear')}
          />
        ) : (
          <View style={{ gap: 12 }}>
            {filteredDeals.map((redemption, idx) => {
              const discount = (redemption as any).discount;
              const provider = discount?.provider;
              const category = discount?.category;
              const review = redemption.review;
              const isExpired = redemption.status === 'expired';
              const dateStr = formatDate(redemption.redeemed_at || redemption.claimed_at, locale);

              return (
                <AnimatedEntrance key={redemption.id} index={idx} delay={60}>
                  <View style={{
                    backgroundColor: colors.surfaceContainerLowest,
                    borderRadius: Radius.lg,
                    ...Shadows.sm,
                  }}>
                    <View style={{ flexDirection: 'row', padding: 12 }}>
                      <View style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', marginEnd: 12, backgroundColor: colors.surfaceContainerHigh }}>
                        {discount?.image_url ? (
                          <Image source={{ uri: discount.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(134,32,69,0.1)' }}>
                            <MaterialIcons name="local-offer" size={22} color={colors.primary} />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: colors.onSurface }} numberOfLines={1}>
                          {discount?.title || t('customer.deal')}
                        </Text>
                        <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                          {provider?.business_name || t('customer.provider')}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        {isExpired ? (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, backgroundColor: colors.isDark ? 'rgba(156,163,175,0.2)' : '#f3f4f6' }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: colors.onSurfaceVariant }}>{t('deal.expired')}</Text>
                          </View>
                        ) : review ? (
                          <View style={{ alignItems: 'flex-end' }}>
                            <StarRating rating={review.rating} size={10} />
                            <Text style={{ fontSize: 9, color: colors.onSurfaceVariant, marginTop: 2 }}>{dateStr}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {review && (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                        {review.comment && (
                          <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18, fontStyle: 'italic', marginBottom: 6 }}>
                            &ldquo;{review.comment}&rdquo;
                          </Text>
                        )}
                        {review.provider_reply && (
                          <View style={{ backgroundColor: colors.surfaceContainer, borderRadius: Radius.md, padding: 10, marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <MaterialIcons name="store" size={12} color={colors.onSurfaceVariant} />
                              <Text style={{ fontSize: 10, fontWeight: '700', color: colors.onSurface }}>{t('customer.providerReply')}</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 18 }}>
                              {review.provider_reply}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </AnimatedEntrance>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
