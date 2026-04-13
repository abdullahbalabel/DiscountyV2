import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, Text, TextInput, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { DealCard } from '../../components/ui/DealCard';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { fetchSavedDeals } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useSavedDeals } from '../../contexts/savedDeals';
import { useThemeColors, Radius, Shadows, Spacing } from '../../hooks/use-theme-colors';
import type { Discount } from '../../lib/types';

export default function SavedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { toggleSave, savedIds } = useSavedDeals();
  const { t, i18n } = useTranslation();

  const [allDeals, setAllDeals] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  const deals = useMemo(() => {
    const saved = allDeals.filter(d => savedIds.has(d.id));
    if (!searchQuery.trim()) return saved;
    const q = searchQuery.toLowerCase().trim();
    return saved.filter(d => {
      const provider = d.provider as any;
      return (
        d.title?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        provider?.business_name?.toLowerCase().includes(q)
      );
    });
  }, [allDeals, savedIds, searchQuery]);

  const loadData = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const savedDeals = await fetchSavedDeals();
      setAllDeals(savedDeals);
    } catch (err) {
      console.error('Error loading saved deals:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    const channel = supabase
      .channel('discounts-saved')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'discounts' }, () => {
        loadData(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

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

  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const renderRightActions = (dealId: string) => (
    <Pressable
      onPress={() => {
        swipeableRefs.current.get(dealId)?.close();
        toggleSave(dealId);
      }}
      style={{
        width: 80,
        marginBottom: 12,
        marginStart: 4,
        borderRadius: Radius.lg,
        backgroundColor: colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <MaterialIcons name="delete-outline" size={24} color="white" />
      <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 10, marginTop: 4 }}>{t('customer.remove')}</Text>
    </Pressable>
  );

  const renderEmptyState = () => (
    <EmptyState
      icon={searchQuery.trim() ? 'search-off' : 'bookmark-border'}
      title={searchQuery.trim() ? t('feed.noSearchResults', { query: searchQuery }) : t('customer.noSavedDeals')}
      message={searchQuery.trim() ? '' : t('customer.saveBookmarkHint')}
      ctaLabel={searchQuery.trim() ? undefined : t('customer.browseDeals')}
      onCtaPress={searchQuery.trim() ? undefined : () => router.push('/(customer)/feed')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <GlassHeader style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface, flexShrink: 1 }}>{t('customer.saved')}</Text>
        </View>
        <AnimatedButton
          style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => {
            setShowSearch((prev) => {
              if (!prev) {
                setTimeout(() => searchInputRef.current?.focus(), 100);
              } else {
                setSearchQuery('');
              }
              return !prev;
            });
          }}
        >
          <MaterialIcons name={showSearch ? 'close' : 'search'} size={18} color={colors.iconDefault} />
        </AnimatedButton>
      </GlassHeader>

      {showSearch && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{
            width: '100%', flexDirection: 'row', alignItems: 'center',
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: Radius.lg, paddingHorizontal: Spacing.md,
            paddingVertical: 10, ...Shadows.xs,
          }}>
            <MaterialIcons name="search" size={18} color={colors.iconDefault} style={{ marginEnd: Spacing.sm }} />
            <TextInput
              ref={searchInputRef}
              style={{ flex: 1, fontFamily: 'Cairo', fontSize: 14, color: colors.onSurface }}
              placeholder={t('feed.searchPlaceholder')}
              placeholderTextColor={colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <AnimatedButton
                style={{
                  width: 24, height: 24, borderRadius: Radius.sm,
                  backgroundColor: colors.surfaceContainerHigh,
                  alignItems: 'center', justifyContent: 'center',
                }}
                onPress={() => setSearchQuery('')}
              >
                <MaterialIcons name="close" size={14} color={colors.iconDefault} />
              </AnimatedButton>
            )}
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => {
            const provider = item.provider as any;
            const category = item.category as any;
            return (
              <Swipeable
                ref={(ref) => { if (ref) swipeableRefs.current.set(item.id, ref); else swipeableRefs.current.delete(item.id); }}
                renderRightActions={() => renderRightActions(item.id)}
                overshootRight={false}
              >
                <AnimatedEntrance index={index} delay={80}>
                  <View style={{ paddingHorizontal: 16 }}>
                    <DealCard
                      id={item.id}
                      title={item.title}
                      provider={provider?.business_name || t('customer.unknown')}
                      providerLogo={provider?.logo_url}
                      providerBadge={provider?.profile_badge}
                      providerBadgeAr={provider?.profile_badge_ar}
                      businessHours={provider?.business_hours}
                      imageUri={item.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                      discountBadge={formatBadge(item)}
                      description={item.description || undefined}
                      categoryName={i18n.language === 'ar' ? category?.name_ar : category?.name}
                      categoryIcon={category?.icon}
                      rating={provider?.average_rating}
                      reviewCount={provider?.total_reviews}
                      endTime={item.end_time}
                      isFeatured={item.is_featured}
                      isSaved={true}
                      onToggleSave={() => {
                        swipeableRefs.current.get(item.id)?.close();
                        toggleSave(item.id);
                      }}
                      onPress={() => handleDealPress(item.id)}
                    />
                  </View>
                </AnimatedEntrance>
              </Swipeable>
            );
          }}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
        />
      )}
    </View>
  );
}
