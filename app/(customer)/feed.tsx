import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { DealCard } from '../../components/ui/DealCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchActiveDeals, fetchCategories } from '../../lib/api';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { useSavedDeals } from '../../contexts/savedDeals';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import type { Category, Discount } from '../../lib/types';

export default function CustomerFeed() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
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

  const renderHeader = () => (
    <View style={{ paddingTop: 16, paddingBottom: 12, paddingHorizontal: 16 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, marginBottom: 8, letterSpacing: -0.5, lineHeight: 26, maxWidth: '80%', color: colors.onSurface }}>
          {t('feed.tagline').replace('<0>', '').replace('</0>', '')}
        </Text>
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4, ...Shadows.xs }}>
          <MaterialIcons name="search" size={18} color={colors.iconDefault} style={{ marginEnd: 8 }} />
          <TextInput
            style={{ flex: 1, fontFamily: 'Manrope', fontSize: 14, color: colors.onSurface }}
            placeholder={t('feed.searchPlaceholder')}
            placeholderTextColor={colors.onSurfaceVariant}
            clearButtonMode="while-editing"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadData()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <AnimatedButton
              style={{ width: 24, height: 24, borderRadius: Radius.sm, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => { setSearchQuery(''); loadData(); }}
            >
              <MaterialIcons name="close" size={14} color={colors.iconDefault} />
            </AnimatedButton>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        <AnimatedButton
          style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, marginEnd: 8, backgroundColor: !selectedCategory ? colors.primary : colors.surfaceContainerHigh }}
          onPress={() => setSelectedCategory(null)}
        >
          <Text style={{ fontWeight: '700', fontSize: 12, color: !selectedCategory ? '#fff' : colors.onSurface }}>{t('feed.allDeals')}</Text>
        </AnimatedButton>
        {categories.map((cat) => (
          <AnimatedButton
            key={cat.id}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full, marginEnd: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: selectedCategory === cat.id ? colors.primary : colors.surfaceContainerHigh,
            }}
            onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
          >
            <MaterialIcons name={resolveMaterialIcon(cat.icon)} size={12} color={selectedCategory === cat.id ? 'white' : colors.iconDefault} />
            <Text style={{ fontWeight: '700', fontSize: 12, color: selectedCategory === cat.id ? '#fff' : colors.onSurface }}>{cat.name}</Text>
          </AnimatedButton>
        ))}
      </ScrollView>

      <Text style={{ fontFamily: 'Manrope', fontSize: 10, color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700', paddingHorizontal: 4 }}>
        {isLoading ? t('feed.loading') : t('feed.dealsAvailable', { count: deals.length })}
      </Text>
    </View>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon="search-off"
      title={t('feed.noDealsFound')}
      message={searchQuery ? t('feed.noSearchResults', { query: searchQuery }) : selectedCategory ? t('feed.noCategoryDeals') : t('feed.noActiveDeals')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14 }}>D</Text>
          </View>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>Discounty</Text>
        </View>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="notifications" size={18} color={colors.iconDefault} />
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
                provider={(item.provider as any)?.business_name || t('customer.unknown')}
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
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
      />
    </View>
  );
}
