import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { DealCard } from '../../components/ui/DealCard';
import { useAuth } from '../../contexts/auth';
import { fetchActiveDeals, fetchCategories } from '../../lib/api';
import type { Category, Discount } from '../../lib/types';

export default function CustomerFeed() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { session } = useAuth();

  const [deals, setDeals] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [dealsData, catsData] = await Promise.all([
        fetchActiveDeals({
          categoryId: selectedCategory || undefined,
          search: searchQuery || undefined,
        }),
        fetchCategories(),
      ]);
      setDeals(dealsData);
      setCategories(catsData);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData(false);
  };

  const handleDealPress = (id: string) => {
    router.push(`/(customer)/deals/${id}`);
  };

  const handleProviderPress = (providerId: string) => {
    router.push(`/(customer)/provider/${providerId}`);
  };

  // Helper to format discount badge
  const formatBadge = (deal: Discount): string => {
    if (deal.type === 'percentage') return `-${deal.discount_value}%`;
    return `-$${deal.discount_value}`;
  };

  const renderHeader = () => (
    <View className="pt-4 pb-3 px-4">
      {/* Hero & Search */}
      <View className="mb-4">
        <Text className="font-headline font-bold text-xl mb-2 tracking-tighter leading-tight max-w-[80%] text-on-surface">
          Find the <Text className="text-primary">Best Deals</Text> curated for you.
        </Text>

        <View className="relative w-full flex-row items-center bg-surface-container-lowest rounded-xl shadow-sm px-3 py-2.5 mt-1">
          <MaterialIcons name="search" size={18} color="#85736f" style={{ marginRight: 8 }} />
          <TextInput
            className="flex-1 font-body text-sm text-on-surface"
            placeholder="Search deals, brands, or categories..."
            placeholderTextColor="#85736f"
            clearButtonMode="while-editing"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadData()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <AnimatedButton
              className="w-6 h-6 rounded-md bg-surface-container-high items-center justify-center"
              onPress={() => { setSearchQuery(''); loadData(); }}
            >
              <MaterialIcons name="close" size={14} color="#85736f" />
            </AnimatedButton>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3 overflow-visible">
        {/* All Deals chip */}
        <AnimatedButton
          className={`px-4 py-1.5 rounded-md mr-2 ${!selectedCategory ? 'bg-primary' : 'bg-surface-container-high'
            }`}
          onPress={() => setSelectedCategory(null)}
        >
          <Text className={`font-semibold text-xs ${!selectedCategory ? 'text-white' : 'text-on-surface'}`}>
            All Deals
          </Text>
        </AnimatedButton>

        {categories.map((cat) => (
          <AnimatedButton
            key={cat.id}
            className={`px-3.5 py-1.5 rounded-md mr-2 flex-row items-center gap-1.5 ${selectedCategory === cat.id
              ? 'bg-primary'
              : 'bg-surface-container-high'
              }`}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <MaterialIcons
              name={cat.icon as any}
              size={12}
              color={selectedCategory === cat.id ? 'white' : '#85736f'}
            />
            <Text className={`font-semibold text-xs ${selectedCategory === cat.id ? 'text-white' : 'text-on-surface'
              }`}>
              {cat.name}
            </Text>
          </AnimatedButton>
        ))}
      </ScrollView>

      {/* Results Count */}
      <Text className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-bold px-1">
        {isLoading ? 'Loading...' : `${deals.length} deals available`}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View className="items-center justify-center py-12 px-6">
      <View className="w-14 h-14 rounded-md items-center justify-center mb-4 bg-surface-container-high">
        <MaterialIcons name="search-off" size={28} color="#85736f" />
      </View>
      <Text className="font-headline font-bold text-base text-on-surface text-center mb-1">
        No Deals Found
      </Text>
      <Text className="font-body text-on-surface-variant text-center text-xs leading-4">
        {searchQuery
          ? `No results for "${searchQuery}". Try a different search.`
          : selectedCategory
            ? 'No active deals in this category right now.'
            : 'No active deals available at the moment. Check back soon!'
        }
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-md bg-primary items-center justify-center">
            <Text className="text-white font-headline font-bold text-sm">D</Text>
          </View>
          <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
            Discounty
          </Text>
        </View>
        <AnimatedButton className="w-8 h-8 rounded-md bg-surface-container-high items-center justify-center p-0">
          <MaterialIcons name="notifications" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedEntrance index={index} delay={80}>
            <View className="px-4 mb-1">
              <DealCard
                id={item.id}
                title={item.title}
                provider={(item.provider as any)?.business_name || 'Unknown'}
                providerLogo={(item.provider as any)?.logo_url}
                imageUri={item.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                discountBadge={formatBadge(item)}
                description={item.description || undefined}
                categoryName={(item.category as any)?.name}
                categoryIcon={(item.category as any)?.icon}
                rating={(item.provider as any)?.average_rating}
                reviewCount={(item.provider as any)?.total_reviews}
                endTime={item.end_time}
                onPress={() => handleDealPress(item.id)}
              />
            </View>
          </AnimatedEntrance>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={{ paddingBottom: 12 }}
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
    </View>
  );
}
