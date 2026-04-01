import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  RefreshControl,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import {
  activateDeal, deleteDeal,
  fetchProviderDealsList, pauseDeal,
} from '../../lib/api';
import type { Discount, DiscountStatus } from '../../lib/types';

type FilterTab = 'all' | 'active' | 'paused' | 'draft';

export default function ProviderDealsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [deals, setDeals] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const loadDeals = useCallback(async () => {
    try {
      const statusFilter = activeFilter === 'all' ? undefined : activeFilter as DiscountStatus;
      const data = await fetchProviderDealsList({ status: statusFilter });
      setDeals(data);
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    setLoading(true);
    loadDeals();
  }, [loadDeals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDeals();
  }, [loadDeals]);

  const handleStatusChange = async (deal: Discount, newStatus: 'active' | 'paused' | 'deleted') => {
    const actionLabels = {
      active: 'Activate',
      paused: 'Pause',
      deleted: 'Delete',
    };

    Alert.alert(
      `${actionLabels[newStatus]} Deal`,
      `Are you sure you want to ${actionLabels[newStatus].toLowerCase()} "${deal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: actionLabels[newStatus],
          style: newStatus === 'deleted' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              if (newStatus === 'paused') await pauseDeal(deal.id);
              else if (newStatus === 'active') await activateDeal(deal.id);
              else if (newStatus === 'deleted') await deleteDeal(deal.id);
              loadDeals();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-500/10', text: 'text-green-600' };
      case 'paused': return { bg: 'bg-amber-500/10', text: 'text-amber-600' };
      case 'draft': return { bg: 'bg-secondary/10', text: 'text-secondary' };
      default: return { bg: 'bg-surface-container-high', text: 'text-on-surface-variant' };
    }
  };

  const isExpired = (deal: Discount) => new Date(deal.end_time) < new Date();

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'paused', label: 'Paused' },
    { key: 'draft', label: 'Draft' },
  ];

  const renderDeal = ({ item, index }: { item: Discount; index: number }) => {
    const statusColors = getStatusColor(item.status);
    const expired = isExpired(item);

    return (
      <AnimatedEntrance index={index} delay={50}>
        <AnimatedButton
          className="bg-surface-container-lowest rounded-md border-outline-variant/10 shadow-sm mb-3 overflow-hidden"
          onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
        >
          {/* Image Header */}
          {item.image_url ? (
            <View className="h-24 w-full">
              <Image source={{ uri: item.image_url }} className="w-full h-full" contentFit="cover" />
              <View className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
              <View className="absolute top-2 right-2 bg-primary px-2 py-0.5 rounded-md">
                <Text className="text-white font-headline font-bold text-xs">
                  {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                </Text>
              </View>
            </View>
          ) : null}

          <View className="p-3">
            {/* Title + Status */}
            <View className="flex-row items-start justify-between mb-1.5">
              <View className="flex-1 mr-2">
                <Text className="font-headline font-bold text-sm text-on-surface" numberOfLines={2}>
                  {item.title}
                </Text>
                {item.category && (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MaterialIcons name={(item.category.icon || 'category') as any} size={12} color="#85736f" />
                    <Text className="text-on-surface-variant text-[10px]">{item.category.name}</Text>
                  </View>
                )}
              </View>
              <View className={`px-2 py-0.5 rounded-md ${statusColors.bg}`}>
                <Text className={`text-[9px] font-bold uppercase tracking-wider ${statusColors.text}`}>
                  {expired && item.status === 'active' ? 'EXPIRED' : item.status}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View className="flex-row items-center gap-3 mb-2 mt-0.5">
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="people" size={12} color="#85736f" />
                <Text className="text-[10px] text-on-surface-variant font-semibold">
                  {item.current_redemptions}/{item.max_redemptions}
                </Text>
              </View>
              <View className="flex-row items-center gap-1">
                <MaterialIcons name="calendar-today" size={12} color="#85736f" />
                <Text className="text-[10px] text-on-surface-variant font-semibold">
                  {expired ? 'Expired' : `Ends ${new Date(item.end_time).toLocaleDateString()}`}
                </Text>
              </View>
              {!item.image_url && (
                <View className="flex-row items-center gap-1">
                  <Text className="text-primary font-headline font-bold text-xs">
                    {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Action Buttons */}
            <View className="flex-row gap-1.5 pt-2  border-surface-container">
              {item.status === 'active' && (
                <AnimatedButton
                  className="flex-1 py-1.5 rounded-md bg-amber-500/10 items-center justify-center flex-row gap-1"
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleStatusChange(item, 'paused');
                  }}
                >
                  <MaterialIcons name="pause" size={14} color="#f59e0b" />
                  <Text className="text-amber-600 text-[10px] font-bold">Pause</Text>
                </AnimatedButton>
              )}
              {(item.status === 'paused' || item.status === 'draft') && (
                <AnimatedButton
                  className="flex-1 py-1.5 rounded-md bg-green-500/10 items-center justify-center flex-row gap-1"
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleStatusChange(item, 'active');
                  }}
                >
                  <MaterialIcons name="play-arrow" size={14} color="#10b981" />
                  <Text className="text-green-600 text-[10px] font-bold">Activate</Text>
                </AnimatedButton>
              )}
              <AnimatedButton
                className="flex-1 py-1.5 rounded-md bg-secondary/10 items-center justify-center flex-row gap-1"
                onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
              >
                <MaterialIcons name="edit" size={14} color="#7b5733" />
                <Text className="text-secondary text-[10px] font-bold">Edit</Text>
              </AnimatedButton>
              <AnimatedButton
                className="py-1.5 px-2.5 rounded-md bg-red-500/10 items-center justify-center"
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleStatusChange(item, 'deleted');
                }}
              >
                <MaterialIcons name="delete-outline" size={14} color="#ef4444" />
              </AnimatedButton>
            </View>
          </View>
        </AnimatedButton>
      </AnimatedEntrance>
    );
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
          My Deals
        </Text>
        <AnimatedButton
          className="w-8 h-8 rounded-md bg-primary items-center justify-center p-0"
          onPress={() => router.push('/(provider)/create-deal')}
        >
          <MaterialIcons name="add" size={18} color="white" />
        </AnimatedButton>
      </View>

      {/* Filter Tabs */}
      <View className="w-full px-4 pb-2">
        <View className="flex-row gap-1.5">
          {filters.map((f) => (
            <AnimatedButton
              key={f.key}
              className={`px-3 py-1.5 rounded-md ${activeFilter === f.key
                ? 'bg-primary'
                : 'bg-surface-container-lowest border-outline-variant/10'
                }`}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text className={`text-xs font-body font-bold ${activeFilter === f.key ? 'text-white' : 'text-on-surface-variant'
                }`}>
                {f.label}
              </Text>
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Deals List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#862045" />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={renderDeal}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#862045" />
          }
          ListEmptyComponent={
            <View className="items-center py-12">
              <View className="w-16 h-16 rounded-md items-center justify-center mb-4 bg-primary/10">
                <MaterialIcons name="local-offer" size={32} color="#862045" />
              </View>
              <Text className="font-headline font-bold text-lg text-on-surface text-center mb-2">
                No Deals Yet
              </Text>
              <Text className="font-body text-on-surface-variant text-center text-sm leading-5 max-w-[240px] mb-5">
                Create your first deal to start attracting customers.
              </Text>
              <AnimatedButton
                variant="gradient"
                className="px-6 py-2.5 rounded-md items-center justify-center flex-row gap-2"
                onPress={() => router.push('/(provider)/create-deal')}
              >
                <MaterialIcons name="add" size={16} color="white" />
                <Text className="text-white font-body font-bold text-sm">Create Deal</Text>
              </AnimatedButton>
            </View>
          }
        />
      )}
    </View>
  );
}
