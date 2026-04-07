import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { DealCard } from '../../components/ui/DealCard';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { EmptyState } from '../../components/ui/EmptyState';
import { fetchSavedDeals } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useSavedDeals } from '../../contexts/savedDeals';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import type { Discount } from '../../lib/types';

export default function SavedScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { toggleSave, savedIds } = useSavedDeals();
  const { t } = useTranslation();

  const [allDeals, setAllDeals] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const deals = useMemo(() => allDeals.filter(d => savedIds.has(d.id)), [allDeals, savedIds]);

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
      icon="bookmark-border"
      title={t('customer.noSavedDeals')}
      message={t('customer.saveBookmarkHint')}
      ctaLabel={t('customer.browseDeals')}
      onCtaPress={() => router.push('/(customer)/feed')}
    />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('customer.saved')}</Text>
        </View>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="search" size={18} color={colors.iconDefault} />
        </AnimatedButton>
      </View>

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
                      imageUri={item.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800'}
                      discountBadge={formatBadge(item)}
                      description={item.description || undefined}
                      categoryName={category?.name}
                      categoryIcon={category?.icon}
                      rating={provider?.average_rating}
                      reviewCount={provider?.total_reviews}
                      endTime={item.end_time}
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
