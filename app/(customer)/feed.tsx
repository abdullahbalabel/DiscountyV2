import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import Carousel from 'react-native-reanimated-carousel';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { DealCard } from '../../components/ui/DealCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { FeaturedDealCard } from '../../components/ui/FeaturedDealCard';
import { HeaderBar } from '../../components/ui/HeaderBar';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useNotifications } from '../../contexts/notifications';
import { fetchActiveDeals, fetchCategories, fetchFeaturedDeals } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { useSavedDeals } from '../../contexts/savedDeals';
import { useThemeColors, Radius, Shadows, Spacing, TAB_BAR_OFFSET } from '../../hooks/use-theme-colors';
import type { Category, Discount } from '../../lib/types';

const CATEGORY_PILL_HEIGHT = 36;

export default function CustomerFeed() {
  const colors = useThemeColors();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const { t, i18n } = useTranslation();
  const { savedIds, toggleSave } = useSavedDeals();
  const { unreadCount } = useNotifications();

  const [deals, setDeals] = useState<Discount[]>([]);
  const [featuredDeals, setFeaturedDeals] = useState<Discount[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(text), 400);
  };

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const [dealsData, catsData, featuredData] = await Promise.all([
        fetchActiveDeals({
          categoryId: selectedCategory || undefined,
          search: debouncedQuery || undefined,
          limit: selectedCategory ? undefined : 10,
        }),
        fetchCategories(),
        fetchFeaturedDeals().catch(err => { console.error('[Feed] fetchFeaturedDeals error:', err); return []; }),
      ]);
      const featured = featuredData.length > 0
        ? featuredData
        : dealsData.filter(d => d.is_featured).slice(0, 5);
      // For testing: if no featured deals exist at all, use top 5 regular deals
      const finalFeatured = featured.length > 0 ? featured : dealsData.slice(0, 5);
      const featuredIds = new Set(finalFeatured.map(d => d.id));
      setDeals(dealsData.filter(d => !featuredIds.has(d.id)));
      setCategories(catsData);
      setFeaturedDeals(finalFeatured);
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, debouncedQuery]);

  useEffect(() => {
    loadData(isFirstLoad.current);
    isFirstLoad.current = false;
  }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('discounts-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, () => {
        loadData(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const handleRefresh = () => { setIsRefreshing(true); loadData(false); };
  const handleDealPress = (id: string) => { router.push(`/(customer)/deals/${id}`); };

  const formatBadge = (deal: Discount): string => {
    if (deal.type === 'percentage') return `-${deal.discount_value}%`;
    return `-$${deal.discount_value}`;
  };

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }
    return (
      <EmptyState
        icon="search-off"
        title={t('feed.noDealsFound')}
        message={
          searchQuery
            ? t('feed.noSearchResults', { query: searchQuery })
            : selectedCategory
              ? t('feed.noCategoryDeals')
              : t('feed.noActiveDeals')
        }
      />
    );
  };

  const listHeader = (
    <View>
      {/* Category pills — fixed-height container */}
      <View style={{
        height: CATEGORY_PILL_HEIGHT + Spacing.lg,
        paddingVertical: Spacing.sm,
        justifyContent: 'center',
      }}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm }}
          scrollEnabled={categories.length > 0}
          ListHeaderComponent={
            <CategoryPill
              label={t('feed.allDeals')}
              isActive={!selectedCategory}
              colors={colors}
              onPress={() => setSelectedCategory(null)}
            />
          }
          renderItem={({ item: cat }) => (
            <CategoryPill
              label={i18n.language === 'ar' ? cat.name_ar : cat.name}
              icon={resolveMaterialIcon(cat.icon)}
              isActive={selectedCategory === cat.id}
              colors={colors}
              onPress={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
            />
          )}
        />
      </View>

      {/* Featured Deals Section */}
      {!isLoading && featuredDeals.length > 0 && !selectedCategory && !debouncedQuery && screenWidth > 0 && (
        <View style={{ marginBottom: Spacing.lg }}>
          <Text style={{
            fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface,
            paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
          }}>
            {t('provider.featuredDeals')}
          </Text>
          <View style={{ alignItems: 'center' }}>
          <Carousel
            loop={featuredDeals.length > 1}
            width={screenWidth * 0.99}
            height={225}
            data={featuredDeals}
            scrollAnimationDuration={400}
            onSnapToItem={setCarouselIndex}
            mode="parallax"
            modeConfig={{
              parallaxScrollingScale: 0.92,
              parallaxScrollingOffset: 50,
            }}
            renderItem={({ item }) => (
              <View style={{ flex: 1, paddingHorizontal: Spacing.xs }}>
                <FeaturedDealCard
                  id={item.id}
                  title={item.title}
                  provider={(item.provider as any)?.business_name || t('customer.unknown')}
                  providerLogo={(item.provider as any)?.logo_url}
                  providerBadge={(item.provider as any)?.profile_badge}
                  providerBadgeAr={(item.provider as any)?.profile_badge_ar}
                  imageUri={item.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                  discountBadge={formatBadge(item)}
                  description={item.description || undefined}
                  categoryName={i18n.language === 'ar' ? (item.category as any)?.name_ar : (item.category as any)?.name}
                  endTime={item.end_time}
                  isSaved={savedIds.has(item.id)}
                  onToggleSave={() => toggleSave(item.id)}
                  onPress={() => handleDealPress(item.id)}
                />
              </View>
            )}
          />
          {/* Pagination dots */}
          {featuredDeals.length > 1 && (
            <View style={{
              flexDirection: 'row', justifyContent: 'center',
              gap: 6, marginTop: Spacing.md,
            }}>
              {featuredDeals.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === carouselIndex ? 20 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === carouselIndex ? colors.primary : colors.surfaceContainerHigh,
                  }}
                />
              ))}
            </View>
          )}
          </View>
        </View>
      )}

      {/* Deals counter */}
      <Text style={{
        fontFamily: 'Cairo_700Bold', fontSize: 10, color: colors.onSurfaceVariant,
        textTransform: 'uppercase', letterSpacing: 0.5,
        paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm,
      }}>
        {isLoading ? t('feed.loading') : t('feed.dealsAvailable', { count: deals.length })}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper>

      {/* ── Fixed header + search (outside FlatList so keyboard stays open) ── */}

      <HeaderBar
        title={t('discounty')}
        showLogo
        rightActions={[{
          icon: 'notifications',
          onPress: () => router.push('/(customer)/notifications' as any),
          badge: unreadCount,
        }]}
      />

      {/* Tagline + Search */}
      <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xs }}>
        <Text style={{
          fontFamily: 'Cairo_700Bold', fontSize: 16,
          marginBottom: Spacing.sm, letterSpacing: -0.5,
          lineHeight: 22, maxWidth: '80%', color: colors.onSurface,
        }}>
          {t('feed.tagline').replace('<0>', '').replace('</0>', '')}
        </Text>
        <View style={{
          width: '100%', flexDirection: 'row', alignItems: 'center',
          backgroundColor: colors.surfaceContainerLowest,
          borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
          paddingVertical: 10, marginTop: Spacing.xs, ...Shadows.xs,
        }}>
          <MaterialIcons name="search" size={18} color={colors.iconDefault} style={{ marginEnd: Spacing.sm }} />
          <TextInput
            style={{ flex: 1, fontFamily: 'Cairo', fontSize: 14, color: colors.onSurface }}
            placeholder={t('feed.searchPlaceholder')}
            placeholderTextColor={colors.onSurfaceVariant}
            clearButtonMode="while-editing"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={() => loadData(true)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <AnimatedButton
              style={{
                width: 24, height: 24, borderRadius: Radius.sm,
                backgroundColor: colors.surfaceContainerHigh,
                alignItems: 'center', justifyContent: 'center',
              }}
              onPress={() => { setSearchQuery(''); setDebouncedQuery(''); }}
            >
              <MaterialIcons name="close" size={14} color={colors.iconDefault} />
            </AnimatedButton>
          )}
        </View>
      </View>

      {/* ── Deals list (categories + counter in header, cards below) ── */}
      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.xs }}>
              <DealCard
                id={item.id}
                title={item.title}
                provider={(item.provider as any)?.business_name || t('customer.unknown')}
                providerLogo={(item.provider as any)?.logo_url}
                providerBadge={(item.provider as any)?.profile_badge}
                providerBadgeAr={(item.provider as any)?.profile_badge_ar}
                businessHours={(item.provider as any)?.business_hours}
                imageUri={item.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                discountBadge={formatBadge(item)}
                description={item.description || undefined}
                categoryName={i18n.language === 'ar' ? (item.category as any)?.name_ar : (item.category as any)?.name}
                categoryIcon={(item.category as any)?.icon}
                rating={(item.provider as any)?.average_rating}
                reviewCount={(item.provider as any)?.total_reviews}
                endTime={item.end_time}
                isFeatured={item.is_featured}
                isSaved={savedIds.has(item.id)}
                onToggleSave={() => toggleSave(item.id)}
                onPress={() => handleDealPress(item.id)}
              />
          </View>
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingBottom: TAB_BAR_OFFSET }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </ScreenWrapper>
  );
}

/* ── Pure component for a single category pill ── */

interface CategoryPillProps {
  label: string;
  icon?: string;
  isActive: boolean;
  colors: ReturnType<typeof useThemeColors>;
  onPress: () => void;
}

function CategoryPill({ label, icon, isActive, colors, onPress }: CategoryPillProps) {
  return (
    <AnimatedButton
      style={{
        paddingHorizontal: Spacing.lg,
        height: CATEGORY_PILL_HEIGHT,
        borderRadius: Radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: isActive ? colors.primary : colors.surfaceContainerHigh,
      }}
      onPress={onPress}
    >
      {icon && (
        <MaterialIcons
          name={icon as any}
          size={14}
          color={isActive ? colors.onPrimary : colors.iconDefault}
        />
      )}
      <Text style={{
        fontWeight: '700',
        fontSize: 13,
        color: isActive ? colors.onPrimary : colors.onSurface,
      }}>
        {label}
      </Text>
    </AnimatedButton>
  );
}
