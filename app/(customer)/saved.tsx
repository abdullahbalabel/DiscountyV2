import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Pressable, View, Text, useColorScheme, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { DealCard } from '../../components/ui/DealCard';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { fetchSavedDeals } from '../../lib/api';
import { useSavedDeals } from '../../contexts/savedDeals';
import type { Discount } from '../../lib/types';

export default function SavedScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { toggleSave, savedIds } = useSavedDeals();

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

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';

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
        marginLeft: 4,
        borderRadius: 12,
        backgroundColor: '#ba1a1a',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <MaterialIcons name="delete-outline" size={24} color="white" />
      <Text style={{ color: 'white', fontFamily: 'Manrope', fontSize: 10, fontWeight: '700', marginTop: 4 }}>Remove</Text>
    </Pressable>
  );

  const renderEmptyState = () => (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: surfaceContainerHigh }}>
        <MaterialIcons name="bookmark-border" size={28} color="#85736f" />
      </View>
      <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, textAlign: 'center', marginBottom: 4 }}>
        No Saved Deals
      </Text>
      <Text style={{ fontFamily: 'Manrope', color: onSurfaceVariant, textAlign: 'center', fontSize: 12, lineHeight: 16 }}>
        Tap the bookmark icon on any deal to save it for later.
      </Text>
      <AnimatedButton
        variant="gradient"
        style={{ marginTop: 16, paddingHorizontal: 24, paddingVertical: 8, borderRadius: 999 }}
        onPress={() => router.push('/(customer)/feed')}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Browse Deals</Text>
      </AnimatedButton>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>Saved</Text>
        </View>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="search" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#862045" colors={['#862045']} />
          }
        />
      )}
    </View>
  );
}
