import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { fetchMyRedemptions } from '../../lib/api';
import type { Redemption } from '../../lib/types';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>History</Text>
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['all', 'reviewed', 'expired'] as const).map(f => (
          <AnimatedButton
            key={f}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
              backgroundColor: filter === f ? '#862045' : surfaceContainerLowest,
              borderWidth: filter === f ? 0 : 1,
              borderColor: surfaceContainer,
            }}
            onPress={() => setFilter(f)}
          >
            <Text style={{
              fontSize: 12, fontWeight: '700', fontFamily: 'Manrope', textTransform: 'capitalize',
              color: filter === f ? '#fff' : onSurfaceVariant,
            }}>
              {f === 'all' ? 'All' : f === 'reviewed' ? 'Reviewed' : 'Expired'}
            </Text>
          </AnimatedButton>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 16 }}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#862045" colors={['#862045']} />}
      >
        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#862045" />
          </View>
        ) : filteredDeals.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <MaterialIcons name="history" size={40} color="#85736f" />
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, marginTop: 12 }}>No History Yet</Text>
            <Text style={{ color: onSurfaceVariant, fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              {filter === 'reviewed' ? 'You haven\'t reviewed any deals yet.' : filter === 'expired' ? 'No expired deals.' : 'Your completed deals will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredDeals.map((redemption, idx) => {
              const discount = (redemption as any).discount;
              const provider = discount?.provider;
              const category = discount?.category;
              const review = redemption.review;
              const isExpired = redemption.status === 'expired';
              const dateStr = formatDate(redemption.redeemed_at || redemption.claimed_at);

              return (
                <AnimatedEntrance key={redemption.id} index={idx} delay={60}>
                  <View style={{
                    backgroundColor: surfaceContainerLowest,
                    borderRadius: 12,
                    overflow: 'hidden',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                    elevation: 1,
                  }}>
                    <View style={{ flexDirection: 'row', padding: 12 }}>
                      <View style={{ width: 56, height: 56, borderRadius: 10, overflow: 'hidden', marginRight: 12, backgroundColor: surfaceContainerHigh }}>
                        {discount?.image_url ? (
                          <Image source={{ uri: discount.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(134,32,69,0.1)' }}>
                            <MaterialIcons name="local-offer" size={22} color="#862045" />
                          </View>
                        )}
                      </View>
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: onSurface }} numberOfLines={1}>
                          {discount?.title || 'Deal'}
                        </Text>
                        <Text style={{ color: onSurfaceVariant, fontSize: 11, fontWeight: '500', marginTop: 2 }}>
                          {provider?.business_name || 'Provider'}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        {isExpired ? (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: isDark ? 'rgba(156,163,175,0.2)' : '#f3f4f6' }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: onSurfaceVariant }}>Expired</Text>
                          </View>
                        ) : review ? (
                          <View style={{ alignItems: 'flex-end' }}>
                            <StarRating rating={review.rating} size={10} />
                            <Text style={{ fontSize: 9, color: onSurfaceVariant, marginTop: 2 }}>{dateStr}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    {review && (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 12 }}>
                        {review.comment && (
                          <Text style={{ fontSize: 12, color: onSurfaceVariant, lineHeight: 18, fontStyle: 'italic', marginBottom: 6 }}>
                            &ldquo;{review.comment}&rdquo;
                          </Text>
                        )}
                        {review.provider_reply && (
                          <View style={{ backgroundColor: surfaceContainer, borderRadius: 8, padding: 10, marginTop: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <MaterialIcons name="store" size={12} color={onSurfaceVariant} />
                              <Text style={{ fontSize: 10, fontWeight: '700', color: onSurface }}>Provider Reply</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: onSurfaceVariant, lineHeight: 18 }}>
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
