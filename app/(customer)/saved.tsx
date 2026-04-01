import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, useColorScheme, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { DealCard } from '../../components/ui/DealCard';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { fetchSavedDeals } from '../../lib/api';
import type { Discount } from '../../lib/types';

export default function SavedScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [deals, setDeals] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const savedDeals = await fetchSavedDeals();
      setDeals(savedDeals);
    } catch (err) {
      console.error('Error loading saved deals:', err);
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

  const handleDealPress = (id: string) => {
    router.push(`/(customer)/deals/${id}`);
  };

  const formatBadge = (deal: Discount): string => {
    if (deal.type === 'percentage') return `-${deal.discount_value}%`;
    return `-$${deal.discount_value}`;
  };

  const renderEmptyState = () => (
    <View className="items-center justify-center py-12 px-6">
      <View className="w-14 h-14 rounded-full items-center justify-center mb-4 bg-surface-container-high">
        <MaterialIcons name="bookmark-border" size={28} color="#85736f" />
      </View>
      <Text className="font-headline font-bold text-base text-on-surface text-center mb-1">
        No Saved Deals
      </Text>
      <Text className="font-body text-on-surface-variant text-center text-xs leading-4">
        Tap the bookmark icon on any deal to save it for later.
      </Text>
      <AnimatedButton
        variant="gradient"
        className="mt-4 px-6 py-2 rounded-full"
        onPress={() => router.push('/(customer)/feed')}
      >
        <Text className="text-white font-bold text-sm">Browse Deals</Text>
      </AnimatedButton>
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-2">
          <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
            Saved
          </Text>
        </View>
        <AnimatedButton className="w-8 h-8 rounded-full bg-surface-container-high items-center justify-center p-0">
          <MaterialIcons name="search" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#862045" />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const provider = item.provider as any;
            const category = item.category as any;
            return (
              <AnimatedEntrance index={index} delay={80}>
                <View className="px-4 mb-1">
                  <DealCard
                    id={item.id}
                    title={item.title}
                    provider={provider?.business_name || 'Unknown'}
                    providerLogo={provider?.logo_url}
                    imageUri={item.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                    discountBadge={formatBadge(item)}
                    description={item.description || undefined}
                    categoryName={category?.name}
                    categoryIcon={category?.icon}
                    rating={provider?.average_rating}
                    reviewCount={provider?.total_reviews}
                    endTime={item.end_time}
                    onPress={() => handleDealPress(item.id)}
                  />
                </View>
              </AnimatedEntrance>
            );
          }}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#862045"
              colors={['#862045']}
            />
          }
        />
      )}
    </View>
  );
}
