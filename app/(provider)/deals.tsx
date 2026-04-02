import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
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
import { resolveMaterialIcon } from '../../lib/iconMapping';
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
      case 'active': return { bg: { backgroundColor: 'rgba(16,185,129,0.1)' }, text: { color: '#16a34a' } };
      case 'paused': return { bg: { backgroundColor: 'rgba(245,158,11,0.1)' }, text: { color: '#d97706' } };
      case 'draft': return { bg: { backgroundColor: 'rgba(123,87,51,0.1)' }, text: { color: '#7b5733' } };
      default: return { bg: { backgroundColor: isDark ? '#534340' : '#f5ddd9' }, text: { color: isDark ? '#d8c2bd' : '#564340' } };
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
          style={{
            backgroundColor: isDark ? '#322825' : '#ffffff',
            borderRadius: 6,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)',
            shadowOpacity: 0.1,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            shadowColor: '#000',
            marginBottom: 12,
            overflow: 'hidden',
          }}
          onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
        >
          {/* Image Header */}
          {item.image_url ? (
            <View style={{ height: 96, width: '100%' }}>
              <Image source={{ uri: item.image_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.5)']}
                style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 48 }}
              />
              <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#862045', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color: 'white', fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 12 }}>
                  {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{ padding: 12 }}>
            {/* Title + Status */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 14, color: isDark ? '#f1dfda' : '#231917' }} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.category && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialIcons name={resolveMaterialIcon(item.category.icon)} size={12} color="#85736f" />
                    <Text style={{ color: isDark ? '#d8c2bd' : '#564340', fontSize: 10 }}>{item.category.name}</Text>
                  </View>
                )}
              </View>
              <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }, statusColors.bg]}>
                <Text style={[{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5 }, statusColors.text]}>
                  {expired && item.status === 'active' ? 'EXPIRED' : item.status}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="people" size={12} color="#85736f" />
                <Text style={{ fontSize: 10, color: isDark ? '#d8c2bd' : '#564340', fontWeight: '600' }}>
                  {item.current_redemptions}/{item.max_redemptions}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="calendar-today" size={12} color="#85736f" />
                <Text style={{ fontSize: 10, color: isDark ? '#d8c2bd' : '#564340', fontWeight: '600' }}>
                  {expired ? 'Expired' : `Ends ${new Date(item.end_time).toLocaleDateString()}`}
                </Text>
              </View>
              {!item.image_url && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: '#862045', fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 12 }}>
                    {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 6, paddingTop: 8, borderTopColor: isDark ? '#3d3230' : '#f0e0dc', borderTopWidth: 1 }}>
              {item.status === 'active' && (
                <AnimatedButton
                  style={{ flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(245,158,11,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleStatusChange(item, 'paused');
                  }}
                >
                  <MaterialIcons name="pause" size={14} color="#f59e0b" />
                  <Text style={{ color: '#d97706', fontSize: 10, fontWeight: 'bold' }}>Pause</Text>
                </AnimatedButton>
              )}
              {(item.status === 'paused' || item.status === 'draft') && (
                <AnimatedButton
                  style={{ flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleStatusChange(item, 'active');
                  }}
                >
                  <MaterialIcons name="play-arrow" size={14} color="#10b981" />
                  <Text style={{ color: '#16a34a', fontSize: 10, fontWeight: 'bold' }}>Activate</Text>
                </AnimatedButton>
              )}
              <AnimatedButton
                style={{ flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: 'rgba(123,87,51,0.1)', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
              >
                <MaterialIcons name="edit" size={14} color="#7b5733" />
                <Text style={{ color: '#7b5733', fontSize: 10, fontWeight: 'bold' }}>Edit</Text>
              </AnimatedButton>
              <AnimatedButton
                style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}
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
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6' }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#1a110f' : '#fff8f6' }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', letterSpacing: -0.5, fontSize: 18, color: isDark ? '#f1dfda' : '#231917' }}>
          My Deals
        </Text>
        <AnimatedButton
          style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: '#862045', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          onPress={() => router.push('/(provider)/create-deal')}
        >
          <MaterialIcons name="add" size={18} color="white" />
        </AnimatedButton>
      </View>

      {/* Filter Tabs */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {filters.map((f) => (
            <AnimatedButton
              key={f.key}
              style={[
                { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
                activeFilter === f.key
                  ? { backgroundColor: '#862045' }
                  : { backgroundColor: isDark ? '#322825' : '#ffffff', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[{ fontSize: 12, fontFamily: 'Manrope', fontWeight: 'bold' }, activeFilter === f.key ? { color: 'white' } : { color: isDark ? '#d8c2bd' : '#564340' }]}>
                {f.label}
              </Text>
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Deals List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View style={{ width: 64, height: 64, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 16, backgroundColor: 'rgba(134,32,69,0.1)' }}>
                <MaterialIcons name="local-offer" size={32} color="#862045" />
              </View>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 18, color: isDark ? '#f1dfda' : '#231917', textAlign: 'center', marginBottom: 8 }}>
                No Deals Yet
              </Text>
              <Text style={{ fontFamily: 'Manrope', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 14, lineHeight: 20, maxWidth: 240, marginBottom: 20 }}>
                Create your first deal to start attracting customers.
              </Text>
              <AnimatedButton
                variant="gradient"
                style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                onPress={() => router.push('/(provider)/create-deal')}
              >
                <MaterialIcons name="add" size={16} color="white" />
                <Text style={{ color: 'white', fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 14 }}>Create Deal</Text>
              </AnimatedButton>
            </View>
          }
        />
      )}
    </View>
  );
}
