import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  activateDeal,
  deleteDeal,
  fetchProviderDealsList,
  pauseDeal,
} from '../../lib/api';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import type { Discount } from '../../lib/types';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';

type FilterTab = 'all' | 'active' | 'paused' | 'draft' | 'expired';
type SortOption = 'newest' | 'oldest' | 'mostRedemptions' | 'mostViews' | 'expiringSoon';

const SORT_OPTIONS: { key: SortOption; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'newest', icon: 'schedule' },
  { key: 'oldest', icon: 'history' },
  { key: 'mostRedemptions', icon: 'people' },
  { key: 'mostViews', icon: 'visibility' },
  { key: 'expiringSoon', icon: 'timer' },
];

function SkeletonCard({ colors }: { colors: any }) {
  return (
    <View style={[styles.skeletonCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
      <View style={[styles.skeletonImage, { backgroundColor: colors.surfaceContainerHigh }]} />
      <View style={styles.skeletonContent}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceContainerHigh, width: '70%' }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceContainerHigh, width: '40%', height: 10, marginTop: 6 }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.surfaceContainerHigh, width: '55%', height: 10, marginTop: 10 }]} />
        <View style={styles.skeletonActions}>
          <View style={[styles.skeletonButton, { backgroundColor: colors.surfaceContainerHigh }]} />
          <View style={[styles.skeletonButton, { backgroundColor: colors.surfaceContainerHigh }]} />
          <View style={[styles.skeletonButtonSmall, { backgroundColor: colors.surfaceContainerHigh }]} />
        </View>
      </View>
    </View>
  );
}

function SortPicker({
  visible,
  currentSort,
  onClose,
  onSelect,
  colors,
  t,
}: {
  visible: boolean;
  currentSort: SortOption;
  onClose: () => void;
  onSelect: (sort: SortOption) => void;
  colors: any;
  t: any;
}) {
  if (!visible) return null;

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={[styles.sortDropdown, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
      <Text style={[styles.sortTitle, { color: colors.onSurfaceVariant }]}>{t('provider.sortBy')}</Text>
      {SORT_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.key}
          style={[styles.sortOption, currentSort === opt.key && { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={() => { onSelect(opt.key); onClose(); }}
        >
          <MaterialIcons name={opt.icon} size={16} color={currentSort === opt.key ? colors.primary : colors.onSurfaceVariant} />
          <Text style={[styles.sortOptionText, { color: currentSort === opt.key ? colors.primary : colors.onSurface }]}>
            {t(`provider.${opt.key}`)}
          </Text>
          {currentSort === opt.key && <MaterialIcons name="check" size={16} color={colors.primary} />}
        </TouchableOpacity>
      ))}
    </Animated.View>
  );
}

export default function ProviderDealsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [deals, setDeals] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showSortPicker, setShowSortPicker] = useState(false);

  const loadDeals = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProviderDealsList();
      setDeals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load deals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDeals();
  }, [loadDeals]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDeals();
  }, [loadDeals]);

  const isExpired = (deal: Discount) => new Date(deal.end_time) < new Date();

  const filteredAndSortedDeals = useMemo(() => {
    let result = [...deals];

    // Filter by status
    if (activeFilter === 'expired') {
      result = result.filter((d) => d.status === 'active' && isExpired(d));
    } else if (activeFilter !== 'all') {
      result = result.filter((d) => d.status === activeFilter);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          d.category?.name.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'mostRedemptions':
        result.sort((a, b) => b.current_redemptions - a.current_redemptions);
        break;
      case 'mostViews':
        result.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'expiringSoon':
        result.sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime());
        break;
    }

    return result;
  }, [deals, activeFilter, searchQuery, sortBy]);

  const filterCounts = useMemo(() => {
    const expired = deals.filter((d) => d.status === 'active' && isExpired(d)).length;
    return {
      all: deals.length,
      active: deals.filter((d) => d.status === 'active' && !isExpired(d)).length,
      paused: deals.filter((d) => d.status === 'paused').length,
      draft: deals.filter((d) => d.status === 'draft').length,
      expired,
    };
  }, [deals]);

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

  const getStatusInfo = (deal: Discount) => {
    const expired = isExpired(deal);
    if (expired && deal.status === 'active') {
      return { label: t('provider.expired'), bg: colors.errorBg, textColor: colors.error };
    }
    switch (deal.status) {
      case 'active': return { label: t('provider.active'), bg: colors.successBg, textColor: colors.successText };
      case 'paused': return { label: t('provider.paused'), bg: colors.warningBg, textColor: colors.warningText };
      case 'draft': return { label: t('provider.draft'), bg: colors.brownBg, textColor: colors.brown };
      default: return { label: deal.status, bg: colors.surfaceContainerHigh, textColor: colors.onSurfaceVariant };
    }
  };

  const getRedemptionProgress = (deal: Discount) => {
    if (deal.max_redemptions === 0) return 0;
    return Math.min((deal.current_redemptions / deal.max_redemptions) * 100, 100);
  };

  const filters: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: t('provider.all'), count: filterCounts.all },
    { key: 'active', label: t('provider.active'), count: filterCounts.active },
    { key: 'paused', label: t('provider.paused'), count: filterCounts.paused },
    { key: 'draft', label: t('provider.draft'), count: filterCounts.draft },
    { key: 'expired', label: t('provider.expired'), count: filterCounts.expired },
  ];

  const renderDeal = ({ item, index }: { item: Discount; index: number }) => {
    const statusInfo = getStatusInfo(item);
    const progress = getRedemptionProgress(item);
    const expired = isExpired(item);

    return (
      <AnimatedEntrance index={index} delay={40}>
        <View style={[styles.dealCard, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
          {/* Clickable Header Row */}
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.cardHeader}
            onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
          >
            {/* Thumbnail or Discount placeholder */}
            {item.image_url ? (
              <View style={styles.cardThumb}>
                <Image source={{ uri: item.image_url }} style={styles.cardThumbImg} contentFit="cover" />
                <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.discountBadgeText}>
                    {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.cardThumb, { backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={[styles.noImageDiscount, { color: colors.primary }]}>
                  {item.type === 'percentage' ? `-${item.discount_value}%` : `$${item.discount_value}`}
                </Text>
              </View>
            )}

            {/* Title + Status + Meta */}
            <View style={styles.cardBody}>
              <View style={styles.titleRow}>
                <Text style={[styles.dealTitle, { color: colors.onSurface }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                  <Text style={[styles.statusText, { color: statusInfo.textColor }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              {item.category && (
                <View style={styles.categoryRow}>
                  <MaterialIcons name={resolveMaterialIcon(item.category.icon)} size={11} color={colors.iconDefault} />
                  <Text style={[styles.categoryText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {item.category.name}
                  </Text>
                </View>
              )}

              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <MaterialIcons name="people" size={11} color={colors.iconDefault} />
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {item.current_redemptions}/{item.max_redemptions}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="visibility" size={11} color={colors.iconDefault} />
                  <Text style={[styles.metaText, { color: colors.onSurfaceVariant }]}>
                    {item.view_count}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <MaterialIcons name="event" size={11} color={expired ? colors.error : colors.iconDefault} />
                  <Text style={[styles.metaText, { color: expired ? colors.error : colors.onSurfaceVariant }]}>
                    {expired ? t('provider.expired') : new Date(item.end_time).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Mini progress bar */}
              <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceContainerHigh }]}>
                <View style={[styles.progressBarFill, { backgroundColor: progress >= 80 ? colors.warning : colors.primary, width: `${progress}%` }]} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Action Buttons Row */}
          <View style={[styles.actionsRow, { borderTopColor: colors.surfaceContainerHigh }]}>
            {item.status === 'active' && !expired && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.6}
                onPress={() => handleStatusChange(item, 'paused')}
              >
                <MaterialIcons name="pause-circle-outline" size={18} color={colors.warning} />
                <Text style={[styles.actionLabel, { color: colors.warningText }]}>{t('provider.pauseDeal')}</Text>
              </TouchableOpacity>
            )}
            {(item.status === 'paused' || item.status === 'draft') && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.6}
                onPress={() => handleStatusChange(item, 'active')}
              >
                <MaterialIcons name="play-circle-outline" size={18} color={colors.success} />
                <Text style={[styles.actionLabel, { color: colors.successText }]}>{t('provider.activateDeal')}</Text>
              </TouchableOpacity>
            )}
            {expired && item.status === 'active' && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.6}
                onPress={() => handleStatusChange(item, 'active')}
              >
                <MaterialIcons name="refresh" size={18} color={colors.success} />
                <Text style={[styles.actionLabel, { color: colors.successText }]}>{t('provider.activateDeal')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.6}
              onPress={() => router.push(`/(provider)/edit-deal/${item.id}`)}
            >
              <MaterialIcons name="edit" size={18} color={colors.brown} />
              <Text style={[styles.actionLabel, { color: colors.brown }]}>{t('provider.edit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              activeOpacity={0.6}
              onPress={() => handleStatusChange(item, 'deleted')}
            >
              <MaterialIcons name="delete-outline" size={18} color={colors.error} />
              <Text style={[styles.actionLabel, { color: colors.error }]}>{t('common.delete')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedEntrance>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceBg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surfaceBg }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t('provider.myDeals')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: showSearch ? colors.primary : colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}
              onPress={() => setShowSearch(!showSearch)}
            >
              <MaterialIcons name="search" size={18} color={showSearch ? 'white' : colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: showSortPicker ? colors.primary : colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}
              onPress={() => setShowSortPicker(!showSortPicker)}
            >
              <MaterialIcons name="sort" size={18} color={showSortPicker ? 'white' : colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.primary, borderColor: 'transparent' }]}
              onPress={() => router.push('/(provider)/create-deal')}
            >
              <MaterialIcons name="add" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        {showSearch && (
          <Animated.View entering={FadeInDown.duration(200)} style={[styles.searchBar, { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant }]}>
            <MaterialIcons name="search" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder={t('provider.searchDeals')}
              placeholderTextColor={colors.onSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="close" size={18} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </Animated.View>
        )}

        {/* Sort Picker */}
        <SortPicker
          visible={showSortPicker}
          currentSort={sortBy}
          onClose={() => setShowSortPicker(false)}
          onSelect={setSortBy}
          colors={colors}
          t={t}
        />

        {/* Filter Tabs */}
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterList}
          renderItem={({ item: f }) => (
            <TouchableOpacity
              style={[
                styles.filterTab,
                activeFilter === f.key
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
              ]}
              onPress={() => setActiveFilter(f.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: activeFilter === f.key ? 'white' : colors.onSurfaceVariant },
                ]}
              >
                {f.label}
              </Text>
              {f.count > 0 && (
                <View
                  style={[
                    styles.filterCount,
                    {
                      backgroundColor: activeFilter === f.key ? 'rgba(255,255,255,0.25)' : colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      { color: activeFilter === f.key ? 'white' : colors.onSurfaceVariant },
                    ]}
                  >
                    {f.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.skeletonList}>
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} colors={colors} />
          ))}
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.onSurface }]}>{t('provider.failedToLoadDeals')}</Text>
          <Text style={[errorMessage, { color: colors.onSurfaceVariant }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={loadDeals}
          >
            <MaterialIcons name="refresh" size={16} color="white" />
            <Text style={styles.retryText}>{t('provider.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedDeals}
          keyExtractor={(item) => item.id}
          renderItem={renderDeal}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            searchQuery ? (
              <EmptyState
                icon="search-off"
                title={t('provider.noSearchResults', { query: searchQuery })}
                message={t('provider.tryDifferentSearch')}
              />
            ) : (
              <EmptyState
                icon="local-offer"
                title={t('provider.noDeals')}
                message={t('provider.noDealsDesc')}
                ctaLabel={t('provider.createDeal')}
                onCtaPress={() => router.push('/(provider)/create-deal')}
                primaryIcon
              />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontFamily: 'Cairo',
    fontWeight: '700',
    letterSpacing: -0.5,
    fontSize: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Cairo',
    padding: 0,
  },
  filterList: {
    gap: 8,
    paddingVertical: 4,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: 'Cairo',
    fontWeight: '700',
  },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 4,
  },
  dealCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.sm,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 10,
    gap: 10,
  },
  cardThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  cardThumbImg: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 4,
    start: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  discountBadgeText: {
    color: 'white',
    fontFamily: 'Cairo',
    fontWeight: '700',
    fontSize: 10,
  },
  noImageDiscount: {
    fontFamily: 'Cairo',
    fontWeight: '700',
    fontSize: 16,
  },
  cardBody: {
    flex: 1,
    gap: 3,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  dealTitle: {
    flex: 1,
    fontFamily: 'Cairo',
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  categoryText: {
    fontSize: 10,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    marginTop: 3,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  actionLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  skeletonList: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  skeletonCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
    height: 180,
  },
  skeletonImage: {
    height: 80,
    width: '100%',
  },
  skeletonContent: {
    padding: 12,
    gap: 4,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 4,
  },
  skeletonActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  skeletonButton: {
    flex: 1,
    height: 28,
    borderRadius: Radius.sm,
  },
  skeletonButtonSmall: {
    width: 36,
    height: 28,
    borderRadius: Radius.sm,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  errorTitle: {
    fontFamily: 'Cairo',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    gap: 6,
    marginTop: 8,
  },
  retryText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  sortDropdown: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.md,
    padding: 12,
    marginBottom: 10,
  },
  sortTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
    gap: 10,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Cairo',
  },
});

const errorMessage = {
  fontSize: 13,
  textAlign: 'center' as const,
  lineHeight: 20,
};
