import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, I18nManager, Platform, ScrollView, Share, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { TabBar, TabView } from 'react-native-tab-view';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { BusinessHoursDisplay } from '../../../components/ui/BusinessHoursDisplay';
import { DealCard } from '../../../components/ui/DealCard';
import { SocialLinksBar } from '../../../components/ui/SocialLinksBar';
import { fetchProviderById, fetchProviderDeals, fetchProviderReviews } from '../../../lib/api';
import { useSavedDeals } from '../../../contexts/savedDeals';
import { useThemeColors } from '../../../hooks/use-theme-colors';
import type { Discount, ProviderProfile as ProviderProfileType, Review } from '../../../lib/types';

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

function openInMaps(lat: number, lng: number) {
  const url = Platform.select({
    ios: `maps:?q=&ll=${lat},${lng}`,
    android: `geo:${lat},${lng}?q=${lat},${lng}`,
    default: `https://maps.google.com/?q=${lat},${lng}`,
  })!;
  Linking.openURL(url);
}

// ─── About Tab ────────────────────────────────────────────────────────────

interface AboutSceneProps {
  provider: ProviderProfileType;
  providerAddress: string | null;
  t: (key: string, opts?: Record<string, unknown>) => string;
  colors: ReturnType<typeof useThemeColors>;
}

function AboutScene({ provider, providerAddress, t, colors }: AboutSceneProps) {
  const socialLinks = provider.social_links as Record<string, string> | null;
  const businessHours = provider.business_hours as Record<string, { open: string; close: string; closed: boolean }> | null;

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
      {provider.description && (
        <AnimatedEntrance index={0} delay={50}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 8 }}>
              {t('provider.about')}
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 22, fontFamily: 'Cairo' }}>
              {provider.description}
            </Text>
          </View>
        </AnimatedEntrance>
      )}

      <AnimatedEntrance index={1} delay={80}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>
            {t('provider.businessHours')}
          </Text>
          <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, borderWidth: 1, borderColor: colors.outlineVariant, padding: 4 }}>
            <BusinessHoursDisplay businessHours={businessHours} />
          </View>
        </View>
      </AnimatedEntrance>

      {socialLinks && Object.keys(socialLinks).length > 0 && (
        <AnimatedEntrance index={2} delay={110}>
          <View style={{ marginBottom: 24 }}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>
              {t('provider.socialLinks')}
            </Text>
            <SocialLinksBar links={provider.social_links} />
          </View>
        </AnimatedEntrance>
      )}

      {(provider.phone || provider.website) && (
        <AnimatedEntrance index={3} delay={140}>
          <View style={{ marginBottom: 24, gap: 8 }}>
            {provider.phone && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${provider.phone}`)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: colors.surfaceContainerLowest, borderRadius: 12,
                  padding: 16, borderWidth: 1, borderColor: colors.outlineVariant,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="phone" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, fontFamily: 'Cairo' }}>{t('provider.call')}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onSurface }} dir="ltr">{provider.phone}</Text>
                </View>
                <MaterialIcons name={I18nManager.isRTL ? 'chevron-left' : 'chevron-right'} size={20} color={colors.iconDefault} />
              </TouchableOpacity>
            )}
            {provider.website && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => Linking.openURL(provider.website!)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12,
                  backgroundColor: colors.surfaceContainerLowest, borderRadius: 12,
                  padding: 16, borderWidth: 1, borderColor: colors.outlineVariant,
                }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="language" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, fontFamily: 'Cairo' }}>{t('provider.website')}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.onSurface }} numberOfLines={1}>{provider.website}</Text>
                </View>
                <MaterialIcons name="open-in-new" size={18} color={colors.iconDefault} />
              </TouchableOpacity>
            )}
          </View>
        </AnimatedEntrance>
      )}

      {provider.latitude != null && provider.longitude != null && (
        <AnimatedEntrance index={4} delay={170}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openInMaps(provider.latitude, provider.longitude)}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: colors.surfaceContainerLowest, borderRadius: 12,
              padding: 16, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 24,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>{t('provider.viewOnMap')}</Text>
              {providerAddress && (
                <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>{providerAddress}</Text>
              )}
            </View>
            <MaterialIcons name="open-in-new" size={18} color={colors.iconDefault} />
          </TouchableOpacity>
        </AnimatedEntrance>
      )}
    </ScrollView>
  );
}

// ─── Deals Tab ────────────────────────────────────────────────────────────

interface DealsSceneProps {
  deals: Discount[];
  provider: ProviderProfileType;
  savedIds: Set<string>;
  toggleSave: (id: string) => void;
  router: ReturnType<typeof useRouter>;
  i18nLang: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
  colors: ReturnType<typeof useThemeColors>;
}

function DealsScene({ deals, provider, savedIds, toggleSave, router, i18nLang, t, colors }: DealsSceneProps) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, letterSpacing: -0.5, color: colors.onSurface }}>
          {t('provider.myDeals')}
        </Text>
        <Text style={{ color: colors.primary, fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {deals.length} {t('customer.dealsCount')}
        </Text>
      </View>
      {deals.length === 0 ? (
        <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center' }}>
          <MaterialIcons name="local-offer" size={40} color={colors.iconDefault} />
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginTop: 12 }}>{t('customer.noActiveDeals')}</Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{t('customer.noActiveDealsProvider')}</Text>
        </View>
      ) : (
        deals.map((deal, index) => {
          const category = deal.category as any;
          const badge = deal.type === 'percentage' ? `-${deal.discount_value}%` : `-$${deal.discount_value}`;
          return (
            <AnimatedEntrance key={deal.id} index={index} delay={100}>
              <DealCard
                id={deal.id} title={deal.title} provider={provider.business_name} providerLogo={provider.logo_url}
                imageUri={deal.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                discountBadge={badge} description={deal.description || undefined}
                categoryName={i18nLang === 'ar' ? category?.name_ar : category?.name} categoryIcon={category?.icon} endTime={deal.end_time}
                isSaved={savedIds.has(deal.id)}
                onToggleSave={() => toggleSave(deal.id)}
                onPress={() => router.push(`/(customer)/deals/${deal.id}`)}
              />
            </AnimatedEntrance>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Reviews Tab ──────────────────────────────────────────────────────────

interface ReviewsSceneProps {
  reviews: Review[];
  t: (key: string, opts?: Record<string, unknown>) => string;
  colors: ReturnType<typeof useThemeColors>;
}

function ReviewsScene({ reviews, t, colors }: ReviewsSceneProps) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, letterSpacing: -0.5, color: colors.onSurface }}>
          {t('provider.reviewsTab')}
        </Text>
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {reviews.length} {t('customer.reviews')}
        </Text>
      </View>
      {reviews.length === 0 ? (
        <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.outlineVariant, alignItems: 'center' }}>
          <MaterialIcons name="rate-review" size={40} color={colors.iconDefault} />
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginTop: 12 }}>{t('customer.noReviewsYet')}</Text>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{t('customer.beFirstToReview')}</Text>
        </View>
      ) : (
        reviews.map((review, index) => {
          const customerProfile = (review as any).customer_profile;
          return (
            <AnimatedEntrance key={review.id} index={index} delay={80}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.surfaceContainerHigh }}>
                    {customerProfile?.avatar_url ? (
                      <Image source={{ uri: customerProfile.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : (
                      <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(134,32,69,0.1)' }}>
                        <Text style={{ fontFamily: 'Cairo_700Bold', color: colors.primary, fontSize: 18 }}>{(customerProfile?.display_name || 'U').charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: colors.onSurface }}>{customerProfile?.display_name || t('customer.anonymous')}</Text>
                    <Text style={{ fontSize: 12, color: colors.onSurfaceVariant, fontWeight: '500', marginTop: 4 }}>{timeAgo(review.created_at, t)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <MaterialIcons key={i} name="star" size={12} color={i <= review.rating ? colors.primary : colors.surfaceContainerHigh} />
                    ))}
                  </View>
                </View>
                {review.comment && (
                  <Text style={{ color: colors.onSurfaceVariant, fontStyle: 'italic', fontFamily: 'Cairo', fontSize: 14, lineHeight: 22 }}>
                    {'\u201C'}{review.comment}{'\u201D'}
                  </Text>
                )}
                {review.provider_reply && (
                  <View style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: colors.surfaceContainer }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <MaterialIcons name="reply" size={14} color={colors.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>{t('customer.businessResponse')}</Text>
                    </View>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, fontFamily: 'Cairo', lineHeight: 22 }}>{review.provider_reply}</Text>
                  </View>
                )}
              </View>
            </AnimatedEntrance>
          );
        })
      )}
    </ScrollView>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────

export default function ProviderProfile() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const { savedIds, toggleSave } = useSavedDeals();

  const [provider, setProvider] = useState<ProviderProfileType | null>(null);
  const [deals, setDeals] = useState<Discount[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [providerAddress, setProviderAddress] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  const routes = useMemo(() => [
    { key: 'about', title: t('provider.about') },
    { key: 'deals', title: t('provider.myDeals') },
    { key: 'reviews', title: t('provider.reviewsTab') },
  ], [t]);

  useEffect(() => {
    const loadProvider = async () => {
      if (!id) return;
      try {
        const [providerData, dealsData, reviewsData] = await Promise.all([
          fetchProviderById(id), fetchProviderDeals(id), fetchProviderReviews(id),
        ]);
        setProvider(providerData);
        setDeals(dealsData);
        setReviews(reviewsData);

        if (providerData?.latitude != null && providerData?.longitude != null) {
          const results = await Location.reverseGeocodeAsync({ latitude: providerData.latitude, longitude: providerData.longitude });
          if (results.length > 0) {
            const r = results[0];
            setProviderAddress([r.street, r.district, r.city, r.region].filter(Boolean).join(', '));
          }
        }
      } catch (err) { console.error('Error loading provider:', err); }
      finally { setIsLoading(false); }
    };
    loadProvider();
  }, [id]);

  const handleShare = async () => {
    if (!provider) return;
    const rating = provider.average_rating ? `⭐ ${provider.average_rating.toFixed(1)} (${provider.total_reviews || 0} ${t('customer.reviews')})` : '';
    const message = i18n.language === 'ar'
      ? `شوف ${provider.business_name} على Discounty! 🎉\n${rating ? `${rating}\n` : ''}${provider.description ? `${provider.description}\n` : ''}${providerAddress ? `📍 ${providerAddress}\n` : ''}\nحمّل تطبيق Discounty وشوف عروضهم! 📲`
      : `Check out ${provider.business_name} on Discounty! 🎉\n${rating ? `${rating}\n` : ''}${provider.description ? `${provider.description}\n` : ''}${providerAddress ? `📍 ${providerAddress}\n` : ''}\nDownload Discounty to see their deals! 📲`;
    try { await Share.share({ message }); } catch {}
  };

  const renderTabBar = (props: any) => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.primary, height: 3, borderRadius: 2 }}
      style={{ backgroundColor: colors.surfaceBg, elevation: 0, shadowOpacity: 0, borderBottomWidth: 1, borderBottomColor: colors.outlineVariant }}
      labelStyle={{ fontFamily: 'Cairo_700Bold', fontSize: 14, textTransform: 'none' }}
      activeColor={colors.primary}
      inactiveColor={colors.tabBarInactive}
      pressColor="rgba(134,32,69,0.1)"
    />
  );

  const renderScene = ({ route }: { route: { key: string } }) => {
    if (!provider) return null;
    switch (route.key) {
      case 'about':
        return <AboutScene provider={provider} providerAddress={providerAddress} t={t} colors={colors} />;
      case 'deals':
        return <DealsScene deals={deals} provider={provider} savedIds={savedIds} toggleSave={toggleSave} router={router} i18nLang={i18n.language} t={t} colors={colors} />;
      case 'reviews':
        return <ReviewsScene reviews={reviews} t={t} colors={colors} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!provider) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <MaterialIcons name="store" size={48} color={colors.iconDefault} />
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginTop: 16 }}>{t('customer.providerNotFound')}</Text>
        <AnimatedButton style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('customer.goBack')}</Text>
        </AnimatedButton>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Top bar */}
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 44, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AnimatedButton style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface, flexShrink: 1 }}>{t('discounty')}</Text>
        </View>
        <AnimatedButton style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={colors.iconDefault} />
        </AnimatedButton>
      </View>

      {/* Cover photo */}
      <View style={{ position: 'relative', height: 100, width: '100%' }}>
        <Image source={{ uri: provider.cover_photo_url || provider.logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        <LinearGradient colors={['transparent', 'rgba(26,17,15,0.8)']} style={{ position: 'absolute', bottom: 0, start: 0, end: 0, height: '60%' }} />
      </View>

      {/* Provider card */}
      <View style={{ marginHorizontal: 24, marginTop: -32, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.outlineVariant }}>
        {provider.logo_url ? (
          <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.surfaceContainerHigh, marginTop: -36, marginBottom: 8, borderWidth: 2, borderColor: colors.surfaceContainerLowest, overflow: 'hidden' }}>
            <Image source={{ uri: provider.logo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
        ) : (
          <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: 'rgba(134,32,69,0.1)', marginTop: -36, marginBottom: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surfaceContainerLowest }}>
            <MaterialIcons name="store" size={28} color={colors.primary} />
          </View>
        )}
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, letterSpacing: -0.5, color: colors.onSurface, marginBottom: 4, textAlign: 'center' }}>{provider.business_name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialIcons name="star" size={14} color={colors.primary} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>{provider.average_rating?.toFixed(1) || '—'}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '500' }}>({provider.total_reviews || 0} {t('customer.reviews')})</Text>
          </View>
          {provider.category && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialIcons name="category" size={12} color={colors.iconDefault} />
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 11, fontWeight: '500' }}>{provider.category}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tab View */}
      <View style={{ flex: 1, marginTop: 8 }}>
        <TabView
          navigationState={{ index: tabIndex, routes }}
          renderScene={renderScene}
          onIndexChange={setTabIndex}
          initialLayout={{ width }}
          renderTabBar={renderTabBar}
        />
      </View>
    </View>
  );
}
