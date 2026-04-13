import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { EmptyState } from '../../components/ui/EmptyState';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { fetchProviderOwnReviews, replyToReview } from '../../lib/api';
import type { Review } from '../../lib/types';

type FilterTab = 'all' | 'unreplied' | 'replied';

function timeAgo(date: string, t: (key: string) => string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return t('customer.justNow');
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${t('customer.ago')}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${t('customer.ago')}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ${t('customer.ago')}`;
  const months = Math.floor(days / 30);
  return `${months}mo ${t('customer.ago')}`;
}

export default function ProviderReviewsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justRepliedId, setJustRepliedId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    try {
      const data = await fetchProviderOwnReviews();
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadReviews(); }, [loadReviews]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReviews();
  }, [loadReviews]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      setReviews(prev => prev.map(r =>
        r.id === reviewId
          ? { ...r, provider_reply: replyText.trim(), replied_at: new Date().toISOString() }
          : r
      ));
      setJustRepliedId(reviewId);
      setReplyingTo(null);
      setReplyText('');
      setTimeout(() => setJustRepliedId(null), 2000);
    } catch (err) {
      console.error('Error replying:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'unreplied') return !r.provider_reply;
    if (filter === 'replied') return !!r.provider_reply;
    return true;
  });

  const unrepliedCount = reviews.filter(r => !r.provider_reply).length;

  const filterTabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: t('provider.allReviews'), count: reviews.length },
    { key: 'unreplied', label: t('provider.needsReply'), count: unrepliedCount },
    { key: 'replied', label: t('provider.repliedFilter'), count: reviews.length - unrepliedCount },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <GlassHeader style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('provider.reviews')}</Text>
        {unrepliedCount > 0 && (
          <View style={{ backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full }}>
            <Text style={{ color: '#fff', fontSize: 11, fontFamily: 'Cairo_700Bold' }}>{t('provider.unrepliedReviews', { count: unrepliedCount })}</Text>
          </View>
        )}
      </GlassHeader>

      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
        {filterTabs.map(tab => (
          <AnimatedButton
            key={tab.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: Radius.full,
              backgroundColor: filter === tab.key ? colors.primary : colors.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: filter === tab.key ? colors.primary : colors.outlineVariant,
            }}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={{
              fontSize: 12,
              fontWeight: '600',
              fontFamily: 'Cairo',
              color: filter === tab.key ? '#fff' : colors.onSurfaceVariant,
            }}>
              {tab.label}
            </Text>
            {tab.count !== undefined && tab.count > 0 && (
              <View style={{
                marginStart: 6,
                backgroundColor: filter === tab.key ? 'rgba(255,255,255,0.2)' : colors.surfaceContainerHigh,
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: Radius.full,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: filter === tab.key ? '#fff' : colors.onSurfaceVariant,
                }}>{tab.count}</Text>
              </View>
            )}
          </AnimatedButton>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {filteredReviews.length === 0 ? (
          <View style={{ paddingTop: 60 }}>
            <EmptyState
              icon="rate-review"
              title={filter === 'unreplied' ? t('provider.noUnrepliedReviews') : filter === 'replied' ? t('provider.noRepliedReviews') : t('provider.noReviewsYetProvider')}
              message={filter === 'all' ? t('provider.reviewsAppearHere') : ''}
            />
          </View>
        ) : (
          filteredReviews.map((review, index) => {
            const customerProfile = (review as any).customer_profile;
            const isReplying = replyingTo === review.id;
            const hasReply = !!review.provider_reply;
            const justReplied = justRepliedId === review.id;

            return (
              <AnimatedEntrance key={review.id} index={index} delay={60}>
                <View style={{
                  backgroundColor: colors.surfaceContainerLowest,
                  padding: 20,
                  borderRadius: Radius.lg,
                  borderWidth: 1,
                  borderColor: justReplied ? colors.success : colors.outlineVariant,
                  marginBottom: 12,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <View style={{ width: 44, height: 44, borderRadius: Radius.md, overflow: 'hidden', backgroundColor: colors.surfaceContainerHigh }}>
                      {customerProfile?.avatar_url ? (
                        <Image source={{ uri: customerProfile.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(134,32,69,0.1)' }}>
                          <Text style={{ fontFamily: 'Cairo_700Bold', color: colors.primary, fontSize: 16 }}>
                            {(customerProfile?.display_name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface }}>
                        {customerProfile?.display_name || t('customer.anonymous')}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.onSurfaceVariant, fontFamily: 'Cairo_500Medium', marginTop: 2 }}>
                        {timeAgo(review.created_at, t)}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <MaterialIcons key={i} name="star" size={14} color={i <= review.rating ? colors.primary : colors.outlineVariant} />
                      ))}
                    </View>
                  </View>

                  {review.comment && (
                    <Text style={{
                      color: colors.onSurfaceVariant,
                      fontStyle: 'italic',
                      fontFamily: 'Cairo',
                      fontSize: 14,
                      lineHeight: 22,
                      marginBottom: hasReply || isReplying ? 12 : 0,
                    }}>
                      &ldquo;{review.comment}&rdquo;
                    </Text>
                  )}

                  {hasReply && (
                    <View style={{
                      marginTop: review.comment ? 0 : 4,
                      padding: 14,
                      borderRadius: Radius.md,
                      backgroundColor: colors.surfaceContainer,
                      borderWidth: justReplied ? 1 : 0,
                      borderColor: justReplied ? colors.success : 'transparent',
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <MaterialIcons name="reply" size={14} color={colors.primary} />
                        <Text style={{ fontSize: 11, color: colors.primary, fontFamily: 'Cairo_700Bold' }}>
                          {t('provider.replied')}
                        </Text>
                        {review.replied_at && (
                          <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontFamily: 'Cairo' }}>
                            • {timeAgo(review.replied_at!, t)}
                          </Text>
                        )}
                        {justReplied && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialIcons name="check-circle" size={12} color={colors.success} />
                            <Text style={{ fontSize: 10, color: colors.success, fontFamily: 'Cairo_700Bold' }}>{t('provider.replySent')}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={{ color: colors.onSurface, fontSize: 14, fontFamily: 'Cairo', lineHeight: 20 }}>
                        {review.provider_reply}
                      </Text>
                    </View>
                  )}

                  {!hasReply && !isReplying && (
                    <AnimatedButton
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 8,
                        alignSelf: 'flex-start',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: Radius.full,
                        backgroundColor: 'rgba(134,32,69,0.08)',
                      }}
                      onPress={() => { setReplyingTo(review.id); setReplyText(''); }}
                    >
                      <MaterialIcons name="reply" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 12, color: colors.primary, fontFamily: 'Cairo_600SemiBold' }}>{t('provider.reply')}</Text>
                    </AnimatedButton>
                  )}

                  {!hasReply && isReplying && (
                    <View style={{ marginTop: 12 }}>
                      <View style={{
                        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
                        alignItems: 'flex-end',
                        gap: 8,
                      }}>
                        <View style={{
                          flex: 1,
                          backgroundColor: colors.surfaceContainer,
                          borderRadius: Radius.md,
                          borderWidth: 1,
                          borderColor: colors.outlineVariant,
                          paddingHorizontal: 14,
                          paddingVertical: 10,
                        }}>
                          <TextInput
                            style={{
                              color: colors.onSurface,
                              fontSize: 14,
                              fontFamily: 'Cairo',
                              minHeight: 36,
                              textAlignVertical: 'top',
                              writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
                            }}
                            placeholder={t('provider.writeReply')}
                            placeholderTextColor={colors.onSurfaceVariant}
                            value={replyText}
                            onChangeText={setReplyText}
                            multiline
                            maxLength={500}
                            autoFocus
                          />
                        </View>
                        <AnimatedButton
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: Radius.md,
                            backgroundColor: replyText.trim() ? colors.primary : colors.surfaceContainerHigh,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          onPress={() => handleReply(review.id)}
                          disabled={!replyText.trim() || submitting}
                        >
                          {submitting ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <MaterialIcons name="send" size={18} color={replyText.trim() ? '#fff' : colors.onSurfaceVariant} />
                          )}
                        </AnimatedButton>
                      </View>
                      <AnimatedButton
                        variant="outline"
                        style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderColor: 'transparent' }}
                        onPress={() => { setReplyingTo(null); setReplyText(''); }}
                      >
                        <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, fontFamily: 'Cairo' }}>{t('common.cancel')}</Text>
                      </AnimatedButton>
                    </View>
                  )}
                </View>
              </AnimatedEntrance>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
