import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { DealCard } from '../../components/ui/DealCard';
import { fetchActiveDeals, fetchCategories } from '../../lib/api';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { useSavedDeals } from '../../contexts/savedDeals';
import type { Category, Discount } from '../../lib/types';

export default function CustomerFeed() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { savedIds, toggleSave } = useSavedDeals();

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
        fetchActiveDeals({ categoryId: selectedCategory || undefined, search: searchQuery || undefined }),
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

  useEffect(() => { loadData(); }, [loadData]);

  const handleRefresh = () => { setIsRefreshing(true); loadData(false); };
  const handleDealPress = (id: string) => { router.push(`/(customer)/deals/${id}`); };

  const formatBadge = (deal: Discount): string => {
    if (deal.type === 'percentage') return `-${deal.discount_value}%`;
    return `-$${deal.discount_value}`;
  };

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';

  const renderHeader = () => (
    <View style={{ paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, marginBottom: 8, letterSpacing: -0.5, lineHeight: 26, maxWidth: '80%', color: onSurface }}>
          Find the <Text style={{ color: '#862045' }}>Best Deals</Text> curated for you.
        </Text>
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: surfaceContainerLowest, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}>
          <MaterialIcons name="search" size={18} color="#85736f" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontFamily: 'Manrope', fontSize: 14, color: onSurface }}
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
              style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setSearchQuery(''); loadData(); }}
            >
              <MaterialIcons name="close" size={14} color="#85736f" />
            </AnimatedButton>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <AnimatedButton
          style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6, marginRight: 8, backgroundColor: !selectedCategory ? '#862045' : surfaceContainerHigh }}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={{ fontWeight: '600', fontSize: 12, color: !selectedCategory ? '#fff' : onSurface }}>All Deals</Text>
        </AnimatedButton>
        {categories.map((cat) => (
          <AnimatedButton
            key={cat.id}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: selectedCategory === cat.id ? '#862045' : surfaceContainerHigh,
            }}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <MaterialIcons name={resolveMaterialIcon(cat.icon)} size={12} color={selectedCategory === cat.id ? 'white' : '#85736f'} />
            <Text style={{ fontWeight: '600', fontSize: 12, color: selectedCategory === cat.id ? '#fff' : onSurface }}>{cat.name}</Text>
          </AnimatedButton>
        ))}
      </ScrollView>

      <Text style={{ fontFamily: 'Manrope', fontSize: 10, color: onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700', paddingHorizontal: 4 }}>
        {isLoading ? 'Loading...' : `${deals.length} deals available`}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: surfaceContainerHigh }}>
        <MaterialIcons name="search-off" size={28} color="#85736f" />
      </View>
      <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, textAlign: 'center', marginBottom: 4 }}>No Deals Found</Text>
      <Text style={{ fontFamily: 'Manrope', color: onSurfaceVariant, textAlign: 'center', fontSize: 12, lineHeight: 16 }}>
        {searchQuery ? `No results for "${searchQuery}". Try a different search.` : selectedCategory ? 'No active deals in this category right now.' : 'No active deals available at the moment. Check back soon!'}
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#862045', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14 }}>D</Text>
          </View>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>Discounty</Text>
        </View>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="notifications" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AnimatedEntrance index={index} delay={80}>
            <View style={{ paddingHorizontal: 16, marginBottom: 4 }}>
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
                isSaved={savedIds.has(item.id)}
                onToggleSave={() => toggleSave(item.id)}
                onPress={() => handleDealPress(item.id)}
              />
            </View>
          </AnimatedEntrance>
        )}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        contentContainerStyle={{ paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#862045" colors={['#862045']} />}
      />
    </View>
  );
}
