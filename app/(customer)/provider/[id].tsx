import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, I18nManager, Platform, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { DealCard } from '../../../components/ui/DealCard';
import { fetchProviderById, fetchProviderDeals, fetchProviderReviews } from '../../../lib/api';
import { useSavedDeals } from '../../../contexts/savedDeals';
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

export default function ProviderProfile() {
  const { t, i18n } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';
  const { savedIds, toggleSave } = useSavedDeals();

  const [provider, setProvider] = useState<ProviderProfileType | null>(null);
  const [deals, setDeals] = useState<Discount[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [providerAddress, setProviderAddress] = useState<string | null>(null);

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

  const openInMaps = (lat: number, lng: number) => {
    const url = Platform.select({
      ios: `maps:?q=&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}`,
      default: `https://maps.google.com/?q=${lat},${lng}`,
    })!;
    Linking.openURL(url);
  };

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#862045" /></View>;
  }

  if (!provider) {
    return (
      <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <MaterialIcons name="store" size={48} color="#85736f" />
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: onSurface, marginTop: 16 }}>{t('customer.providerNotFound')}</Text>
        <AnimatedButton style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#862045', borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('customer.goBack')}</Text>
        </AnimatedButton>
      </View>
    );
  }

  const socialLinks = provider.social_links as Record<string, string> | null;

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <AnimatedButton style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#85736f" style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 20, color: onSurface, flexShrink: 1 }}>{t('discounty')}</Text>
        </View>
        <AnimatedButton style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="share" size={24} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={{ position: 'relative', height: 192, width: '100%' }}>
          <Image source={{ uri: provider.logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(26,17,15,0.8)']} style={{ position: 'absolute', bottom: 0, start: 0, end: 0, height: '60%' }} />
        </View>

        <AnimatedEntrance index={0} delay={100}>
          <View style={{ marginHorizontal: 24, marginTop: -64, backgroundColor: surfaceContainerLowest, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: outlineVariant }}>
            {provider.logo_url ? (
              <View style={{ width: 96, height: 96, borderRadius: 16, backgroundColor: surfaceContainerHigh, marginTop: -64, marginBottom: 16, borderWidth: 2, borderColor: surfaceContainerLowest, overflow: 'hidden' }}>
                <Image source={{ uri: provider.logo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              </View>
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 16, backgroundColor: 'rgba(134,32,69,0.1)', marginTop: -64, marginBottom: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: surfaceContainerLowest }}>
                <MaterialIcons name="store" size={40} color="#862045" />
              </View>
            )}
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, letterSpacing: -0.5, color: onSurface, marginBottom: 8, textAlign: 'center' }}>{provider.business_name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="star" size={16} color="#862045" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#862045' }}>{provider.average_rating?.toFixed(1) || '—'}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 12, fontWeight: '500' }}>({provider.total_reviews || 0} {t('customer.reviews')})</Text>
              </View>
              {provider.category && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="category" size={14} color="#85736f" />
                  <Text style={{ color: onSurfaceVariant, fontSize: 12, fontWeight: '500' }}>{provider.category}</Text>
                </View>
              )}
            </View>
            {provider.description && (
              <Text style={{ color: onSurfaceVariant, textAlign: 'center', fontSize: 14, marginBottom: 24, lineHeight: 20, fontFamily: 'Cairo' }}>{provider.description}</Text>
            )}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {provider.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: surfaceContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                  <MaterialIcons name="phone" size={14} color="#85736f" />
                  <Text style={{ fontSize: 12, fontWeight: '500', color: onSurfaceVariant }}>{provider.phone}</Text>
                </View>
              )}
              {provider.website && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: surfaceContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}>
                  <MaterialIcons name="language" size={14} color="#85736f" />
                  <Text style={{ fontSize: 12, fontWeight: '500', color: onSurfaceVariant }}>{t('customer.website')}</Text>
                </View>
              )}
            </View>
            {provider.latitude != null && provider.longitude != null && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openInMaps(provider.latitude, provider.longitude)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: surfaceContainer, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, marginBottom: 16, alignSelf: 'stretch' }}
              >
                <MaterialIcons name="location-on" size={14} color="#862045" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#862045' }}>{t('customer.viewLocation')}</Text>
                  {providerAddress && (
                    <Text style={{ fontSize: 11, color: onSurfaceVariant, marginTop: 2 }} numberOfLines={1}>{providerAddress}</Text>
                  )}
                </View>
                <MaterialIcons name="open-in-new" size={14} color="#85736f" />
              </TouchableOpacity>
            )}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {socialLinks.instagram && <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14 }}>📸</Text></View>}
                {socialLinks.tiktok && <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14 }}>🎵</Text></View>}
                {socialLinks.x && <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14 }}>𝕏</Text></View>}
                {socialLinks.snapchat && <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 14 }}>👻</Text></View>}
              </View>
            )}
          </View>
        </AnimatedEntrance>

        <View style={{ paddingHorizontal: 24 }}>
          <View style={{ marginBottom: 40 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 24, letterSpacing: -0.5, color: onSurface }}>{t('customer.activeDealsCount')}</Text>
               <Text style={{ color: '#862045', fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{deals.length} {t('customer.dealsCount')}</Text>
            </View>
            {deals.length === 0 ? (
              <View style={{ backgroundColor: surfaceContainerLowest, padding: 32, borderRadius: 16, borderWidth: 1, borderColor: outlineVariant, alignItems: 'center' }}>
                <MaterialIcons name="local-offer" size={40} color="#85736f" />
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: onSurface, marginTop: 12 }}>{t('customer.noActiveDeals')}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{t('customer.noActiveDealsProvider')}</Text>
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
                      categoryName={i18n.language === 'ar' ? category?.name_ar : category?.name} categoryIcon={category?.icon} endTime={deal.end_time}
                      isSaved={savedIds.has(deal.id)}
                      onToggleSave={() => toggleSave(deal.id)}
                      onPress={() => router.push(`/(customer)/deals/${deal.id}`)}
                    />
                  </AnimatedEntrance>
                );
              })
            )}
          </View>

          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 24, letterSpacing: -0.5, color: onSurface }}>{t('tabs.reviews')}</Text>
               <Text style={{ color: onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{reviews.length} {t('customer.reviews')}</Text>
            </View>
            {reviews.length === 0 ? (
              <View style={{ backgroundColor: surfaceContainerLowest, padding: 32, borderRadius: 16, borderWidth: 1, borderColor: outlineVariant, alignItems: 'center' }}>
                <MaterialIcons name="rate-review" size={40} color="#85736f" />
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: onSurface, marginTop: 12 }}>{t('customer.noReviewsYet')}</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 14, marginTop: 4, textAlign: 'center' }}>{t('customer.beFirstToReview')}</Text>
              </View>
            ) : (
              reviews.map((review, index) => {
                const customerProfile = (review as any).customer_profile;
                return (
                  <AnimatedEntrance key={review.id} index={index} delay={80}>
                    <View style={{ backgroundColor: surfaceContainerLowest, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: outlineVariant, marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', backgroundColor: surfaceContainerHigh }}>
                          {customerProfile?.avatar_url ? (
                            <Image source={{ uri: customerProfile.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                          ) : (
                            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(134,32,69,0.1)' }}>
                              <Text style={{ fontFamily: 'Cairo_700Bold', color: '#862045', fontSize: 18 }}>{(customerProfile?.display_name || 'U').charAt(0).toUpperCase()}</Text>
                            </View>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '700', color: onSurface }}>{customerProfile?.display_name || t('customer.anonymous')}</Text>
                          <Text style={{ fontSize: 12, color: onSurfaceVariant, fontWeight: '500', marginTop: 4 }}>{timeAgo(review.created_at, t)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(i => (
                            <MaterialIcons key={i} name="star" size={12} color={i <= review.rating ? '#862045' : '#d8c2bd'} />
                          ))}
                        </View>
                      </View>
                      {review.comment && (
                        <Text style={{ color: onSurfaceVariant, fontStyle: 'italic', fontFamily: 'Cairo', fontSize: 14, lineHeight: 22 }}>"{review.comment}"</Text>
                      )}
                      {review.provider_reply && (
                        <View style={{ marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: surfaceContainer }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <MaterialIcons name="reply" size={14} color="#862045" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: '#862045' }}>{t('customer.businessResponse')}</Text>
                          </View>
                          <Text style={{ color: onSurfaceVariant, fontSize: 14, fontFamily: 'Cairo', lineHeight: 22 }}>{review.provider_reply}</Text>
                        </View>
                      )}
                    </View>
                  </AnimatedEntrance>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
