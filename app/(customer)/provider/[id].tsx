import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { DealCard } from '../../../components/ui/DealCard';
import { fetchProviderById, fetchProviderDeals, fetchProviderReviews } from '../../../lib/api';
import type { Discount, ProviderProfile as ProviderProfileType, Review } from '../../../lib/types';

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ProviderProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const router = useRouter();
  const isDark = colorScheme === 'dark';

  const [provider, setProvider] = useState<ProviderProfileType | null>(null);
  const [deals, setDeals] = useState<Discount[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProvider = async () => {
      if (!id) return;
      try {
        const [providerData, dealsData, reviewsData] = await Promise.all([
          fetchProviderById(id),
          fetchProviderDeals(id),
          fetchProviderReviews(id),
        ]);
        setProvider(providerData);
        setDeals(dealsData);
        setReviews(reviewsData);
      } catch (err) {
        console.error('Error loading provider:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProvider();
  }, [id]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#862045" />
      </View>
    );
  }

  if (!provider) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <MaterialIcons name="store" size={48} color="#85736f" />
        <Text className="font-headline font-bold text-xl text-on-surface mt-4">Provider Not Found</Text>
        <AnimatedButton
          className="mt-6 px-6 py-3 bg-primary rounded-md"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </AnimatedButton>
      </View>
    );
  }

  const socialLinks = provider.social_links as Record<string, string> | null;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-4">
          <AnimatedButton
            className="w-10 h-10 rounded-md bg-surface-container-high shadow-sm items-center justify-center p-0"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <Text className="font-headline font-bold tracking-tighter text-xl text-on-surface">
            Discounty
          </Text>
        </View>
        <AnimatedButton className="w-10 h-10 rounded-md bg-surface-container-high items-center justify-center p-0">
          <MaterialIcons name="share" size={24} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Hero Image */}
        <View className="relative h-48 md:h-64 w-full">
          <Image
            source={{ uri: provider.logo_url || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800' }}
            className="w-full h-full"
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(26,17,15,0.8)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
          />
        </View>

        {/* Floating Identity Card */}
        <AnimatedEntrance index={0} delay={100}>
          <View className="mx-6 -mt-16 bg-surface-container-lowest rounded-2xl p-6 shadow-xl flex-col items-center mb-8 border border-outline-variant/10">
            {/* Logo */}
            {provider.logo_url ? (
              <View className="w-24 h-24 rounded-2xl bg-surface-container-high -mt-16 mb-4 shadow-sm border-2 border-surface-container-lowest overflow-hidden">
                <Image
                  source={{ uri: provider.logo_url }}
                  className="w-full h-full"
                  contentFit="cover"
                />
              </View>
            ) : (
              <View className="w-24 h-24 rounded-2xl bg-primary/10 -mt-16 mb-4 items-center justify-center border-2 border-surface-container-lowest">
                <MaterialIcons name="store" size={40} color="#862045" />
              </View>
            )}

            <Text className="font-headline text-xl font-bold tracking-tighter text-on-surface mb-2 text-center">
              {provider.business_name}
            </Text>

            {/* Stats Row */}
            <View className="flex-row items-center gap-4 mb-4">
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="star" size={16} color="#862045" />
                <Text className="text-sm font-bold text-primary">
                  {provider.average_rating?.toFixed(1) || '—'}
                </Text>
                <Text className="text-on-surface-variant text-xs font-medium">
                  ({provider.total_reviews || 0} reviews)
                </Text>
              </View>
              {provider.category && (
                <View className="flex-row items-center gap-1">
                  <MaterialIcons name="category" size={14} color="#85736f" />
                  <Text className="text-on-surface-variant text-xs font-medium">{provider.category}</Text>
                </View>
              )}
            </View>

            {/* About */}
            {provider.description && (
              <Text className="text-on-surface-variant text-center text-sm mb-6 leading-5 font-body">
                {provider.description}
              </Text>
            )}

            {/* Contact Row */}
            <View className="flex-row gap-3 mb-4">
              {provider.phone && (
                <View className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-md">
                  <MaterialIcons name="phone" size={14} color="#85736f" />
                  <Text className="text-xs font-medium text-on-surface-variant">{provider.phone}</Text>
                </View>
              )}
              {provider.website && (
                <View className="flex-row items-center gap-1.5 bg-surface-container px-3 py-1.5 rounded-md">
                  <MaterialIcons name="language" size={14} color="#85736f" />
                  <Text className="text-xs font-medium text-on-surface-variant">Website</Text>
                </View>
              )}
            </View>

            {/* Social Links */}
            {socialLinks && Object.keys(socialLinks).length > 0 && (
              <View className="flex-row gap-3">
                {socialLinks.instagram && (
                  <View className="w-10 h-10 rounded-md bg-surface-container-high items-center justify-center">
                    <Text className="text-sm">📸</Text>
                  </View>
                )}
                {socialLinks.tiktok && (
                  <View className="w-10 h-10 rounded-md bg-surface-container-high items-center justify-center">
                    <Text className="text-sm">🎵</Text>
                  </View>
                )}
                {socialLinks.x && (
                  <View className="w-10 h-10 rounded-md bg-surface-container-high items-center justify-center">
                    <Text className="text-sm">𝕏</Text>
                  </View>
                )}
                {socialLinks.snapchat && (
                  <View className="w-10 h-10 rounded-md bg-surface-container-high items-center justify-center">
                    <Text className="text-sm">👻</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </AnimatedEntrance>

        {/* Content Area */}
        <View className="px-6 space-y-10">
          {/* Active Deals */}
          <View className="mb-10">
            <View className="flex-row justify-between items-end mb-6">
              <Text className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
                Active Deals
              </Text>
              <Text className="text-primary font-bold text-xs uppercase tracking-widest">
                {deals.length} deals
              </Text>
            </View>

            {deals.length === 0 ? (
              <View className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 items-center">
                <MaterialIcons name="local-offer" size={40} color="#85736f" />
                <Text className="font-headline font-bold text-base text-on-surface mt-3">No Active Deals</Text>
                <Text className="text-on-surface-variant text-sm mt-1 text-center">
                  This provider doesn't have any active deals right now.
                </Text>
              </View>
            ) : (
              deals.map((deal, index) => {
                const category = deal.category as any;
                const badge = deal.type === 'percentage'
                  ? `-${deal.discount_value}%`
                  : `-$${deal.discount_value}`;

                return (
                  <AnimatedEntrance key={deal.id} index={index} delay={100}>
                    <DealCard
                      id={deal.id}
                      title={deal.title}
                      provider={provider.business_name}
                      providerLogo={provider.logo_url}
                      imageUri={deal.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                      discountBadge={badge}
                      description={deal.description || undefined}
                      categoryName={category?.name}
                      categoryIcon={category?.icon}
                      endTime={deal.end_time}
                      onPress={() => router.push(`/(customer)/deals/${deal.id}`)}
                      className="mb-4 shadow-none border border-outline-variant/10 rounded-2xl"
                    />
                  </AnimatedEntrance>
                );
              })
            )}
          </View>

          {/* Reviews Section */}
          <View className="mb-8">
            <View className="flex-row justify-between items-end mb-6">
              <Text className="font-headline text-2xl font-bold tracking-tighter text-on-surface">
                Reviews
              </Text>
              <Text className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">
                {reviews.length} reviews
              </Text>
            </View>

            {reviews.length === 0 ? (
              <View className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 items-center">
                <MaterialIcons name="rate-review" size={40} color="#85736f" />
                <Text className="font-headline font-bold text-base text-on-surface mt-3">No Reviews Yet</Text>
                <Text className="text-on-surface-variant text-sm mt-1 text-center">
                  Be the first to review this provider!
                </Text>
              </View>
            ) : (
              reviews.map((review, index) => {
                const customerProfile = (review as any).customer_profile;
                return (
                  <AnimatedEntrance key={review.id} index={index} delay={80}>
                    <View className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm mb-4">
                      <View className="flex-row items-center gap-4 mb-4">
                        <View className="w-12 h-12 rounded-md overflow-hidden bg-surface-container-high">
                          {customerProfile?.avatar_url ? (
                            <Image
                              source={{ uri: customerProfile.avatar_url }}
                              className="w-full h-full"
                              contentFit="cover"
                            />
                          ) : (
                            <View className="w-full h-full items-center justify-center bg-primary/10">
                              <Text className="font-headline font-bold text-primary text-lg">
                                {(customerProfile?.display_name || 'U').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="font-bold text-on-surface">
                            {customerProfile?.display_name || 'Anonymous'}
                          </Text>
                          <Text className="text-xs text-on-surface-variant font-medium mt-1">
                            {timeAgo(review.created_at)}
                          </Text>
                        </View>
                        <View className="flex-row gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <MaterialIcons
                              key={i}
                              name="star"
                              size={12}
                              color={i <= review.rating ? '#862045' : '#d8c2bd'}
                            />
                          ))}
                        </View>
                      </View>
                      {review.comment && (
                        <Text className="text-on-surface-variant italic font-body text-sm leading-relaxed">
                          "{review.comment}"
                        </Text>
                      )}
                      {/* Provider Reply */}
                      {review.provider_reply && (
                        <View className="mt-4 p-4 rounded-xl bg-surface-container">
                          <View className="flex-row items-center gap-2 mb-2">
                            <MaterialIcons name="reply" size={14} color="#862045" />
                            <Text className="text-xs font-bold text-primary">Business Response</Text>
                          </View>
                          <Text className="text-on-surface-variant text-sm font-body leading-relaxed">
                            {review.provider_reply}
                          </Text>
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
