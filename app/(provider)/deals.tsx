import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator, Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  activateDeal, deleteDeal,
  fetchProviderDealsList, pauseDeal,
} from '../../lib/api';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import type { Discount, DiscountStatus } from '../../lib/types';

type FilterTab = 'all' | 'active' | 'paused' | 'draft';

export default function ProviderDealsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
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
      active: t('provider.activateDeal'),
      paused: t('provider.pauseDeal'),
      deleted: t('provider.deleteDeal'),
    };

    Alert.alert(
      `${actionLabels[newStatus]} ${t('provider.deal')}`,
      t('provider.confirmAction', { action: actionLabels[newStatus].toLowerCase(), title: deal.title }),
      [
        { text: t('common.cancel'), style: 'cancel' },
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
              Alert.alert(t('auth.error'), err.message);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: { backgroundColor: colors.successBg }, text: { color: colors.successText } };
      case 'paused': return { bg: { backgroundColor: colors.warningBg }, text: { color: colors.warningText } };
      case 'draft': return { bg: { backgroundColor: colors.brownBg }, text: { color: colors.brown } };
      default: return { bg: { backgroundColor: colors.surfaceContainerHigh }, text: { color: colors.onSurfaceVariant } };
    }
  };

  const isExpired = (deal: Discount) => new Date(deal.end_time) < new Date();

  const filters: { key: FilterTab; label: string }[] = [
    { key: 'all', label: t('provider.all') },
    { key: 'active', label: t('provider.active') },
    { key: 'paused', label: t('provider.paused') },
    { key: 'draft', label: t('provider.draft') },
  ];

  const renderDeal = ({ item, index }: { item: Discount; index: number }) => {
    const statusColors = getStatusColor(item.status);
    const expired = isExpired(item);

    return (
      <AnimatedEntrance index={index} delay={50}>
        <AnimatedButton
          style={{
            backgroundColor: colors.surfaceContainerLowest,
            borderRadius: Radius.lg,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            ...Shadows.sm,
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
                style={{ position: 'absolute', bottom: 0, start: 0, end: 0, height: 48 }}
              />
              <View style={{ position: 'absolute', top: 8, end: 8, backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm }}>
                <Text style={{ color: 'white', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 12 }}>
                  {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={{ padding: 12 }}>
            {/* Title + Status */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: colors.onSurface }} numberOfLines={2}>
                  {item.title}
                </Text>
                {item.category && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialIcons name={resolveMaterialIcon(item.category.icon)} size={12} color={colors.iconDefault} />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 10 }}>{item.category.name}</Text>
                  </View>
                )}
              </View>
              <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm }, statusColors.bg]}>
                <Text style={[{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }, statusColors.text]}>
                  {expired && item.status === 'active' ? t('provider.expired').toUpperCase() : item.status}
                </Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8, marginTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="people" size={12} color={colors.iconDefault} />
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: '600' }}>
                  {item.current_redemptions}/{item.max_redemptions}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name="calendar-today" size={12} color={colors.iconDefault} />
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, fontWeight: '600' }}>
                  {expired ? t('provider.expired') : t('provider.endsOn', { date: new Date(item.end_time).toLocaleDateString() })}
                </Text>
              </View>
              {!item.image_url && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: colors.primary, fontFamily: 'Epilogue', fontWeight: '700', fontSize: 12 }}>
                    {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Quick Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 6, paddingTop: 8, borderTopColor: colors.surfaceContainer, borderTopWidth: 1 }}>
              {item.status === 'active' && (
                <AnimatedButton
                  style={{ flex: 1, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: colors.warningBg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleStatusChange(item, 'paused');
                  }}
                >
                  <MaterialIcons name="pause" size={14} color={colors.warning} />
                  <Text style={{ color: colors.warningText, fontSize: 10, fontWeight: '700' }}>{t('provider.pauseDeal')}</Text>
                </AnimatedButton>
              )}
              {(item.status === 'paused' || item.status === 'draft') && (
                <AnimatedButton
                  style={{ flex: 1, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    handleStatusChange(item, 'active');
                  }}
                >
                  <MaterialIcons name="play-arrow" size={14} color={colors.success} />
                  <Text style={{ color: colors.successText, fontSize: 10, fontWeight: '700' }}>{t('provider.activateDeal')}</Text>
                </AnimatedButton>
              )}
              <AnimatedButton
                style={{ flex: 1, paddingVertical: 6, borderRadius: Radius.sm, backgroundColor: colors.brownBg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 4 }}
                onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
              >
                <MaterialIcons name="edit" size={14} color={colors.brown} />
                <Text style={{ color: colors.brown, fontSize: 10, fontWeight: '700' }}>{t('provider.edit')}</Text>
              </AnimatedButton>
              <AnimatedButton
                style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: Radius.sm, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleStatusChange(item, 'deleted');
                }}
              >
                <MaterialIcons name="delete-outline" size={14} color={colors.error} />
              </AnimatedButton>
            </View>
          </View>
        </AnimatedButton>
      </AnimatedEntrance>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>
          {t('provider.myDeals')}
        </Text>
        <AnimatedButton
          style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', padding: 0 }}
          onPress={() => router.push('/(provider)/create-deal')}
        >
          <MaterialIcons name="add" size={18} color="white" />
        </AnimatedButton>
      </View>

      {/* Filter Tabs */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {filters.map((f) => (
            <AnimatedButton
              key={f.key}
              style={[
                { paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full },
                activeFilter === f.key
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant }
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text style={[{ fontSize: 12, fontFamily: 'Manrope', fontWeight: '700' }, activeFilter === f.key ? { color: 'white' } : { color: colors.onSurfaceVariant }]}>
                {f.label}
              </Text>
            </AnimatedButton>
          ))}
        </View>
      </View>

      {/* Deals List */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={deals}
          keyExtractor={(item) => item.id}
          renderItem={renderDeal}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="local-offer"
              title={t('provider.noDeals')}
              message={t('provider.noDealsDesc')}
              ctaLabel={t('provider.createDeal')}
              onCtaPress={() => router.push('/(provider)/create-deal')}
              primaryIcon
            />
          }
        />
      )}
    </View>
  );
}
