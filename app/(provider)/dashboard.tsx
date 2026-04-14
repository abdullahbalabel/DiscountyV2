import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, I18nManager, RefreshControl, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { HeaderBar } from '../../components/ui/HeaderBar';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useAuth } from '../../contexts/auth';
import { useNotifications } from '../../contexts/notifications';
import type { ProviderStats } from '../../lib/api';
import { fetchOwnProviderProfile, fetchProviderStats, getProviderPlanFeatures } from '../../lib/api';
import { useThemeColors, Radius, TAB_BAR_OFFSET } from '../../hooks/use-theme-colors';
import type { ProviderProfile, PlanFeatures } from '../../lib/types';

export default function ProviderDashboard() {
  const { t } = useTranslation();
  const { signOut, session } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [stats, setStats] = useState<ProviderStats | null>(null);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [statsData, profileData, featuresData] = await Promise.all([fetchProviderStats(), fetchOwnProviderProfile(), getProviderPlanFeatures()]);
      setStats(statsData);
      setProfile(profileData);
      setPlanFeatures(featuresData);
    } catch (err) { console.error('Dashboard load error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { if (session?.user) loadData(); }, [session, loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const quickActions = [
    { icon: 'add-circle' as const, label: t('provider.createNewDeal'), color: colors.primary, onPress: () => router.push('/(provider)/create-deal') },
    { icon: 'qr-code-scanner' as const, label: t('provider.scanCustomerQR'), color: colors.success, onPress: () => router.push('/(provider)/scan') },
    { icon: 'rate-review' as const, label: t('provider.viewReviews'), color: colors.brown, onPress: () => router.push('/(provider)/reviews') },
  ];

  if (loading) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', marginTop: 12, fontSize: 14 }}>{t('provider.loadingDashboard')}</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <HeaderBar
        title={t('provider.dashboard')}
        subtitle={profile?.business_name || undefined}
        rightActions={[
          { icon: 'notifications', onPress: () => router.push('/(provider)/notifications' as any), badge: unreadCount },
          { icon: 'logout', onPress: () => signOut() },
        ]}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: TAB_BAR_OFFSET }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: colors.primary, padding: 16, borderRadius: Radius.md, marginBottom: 16, marginTop: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 14 }}>{t('provider.yourRating')}</Text>
                <MaterialIcons name="star" size={18} color="#FFD700" />
              </View>
              <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_800ExtraBold', fontSize: 30, letterSpacing: -0.5, marginBottom: 4 }}>
                {(stats?.averageRating || 0) > 0 ? stats!.averageRating.toFixed(1) : '—'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo', fontSize: 12 }}>
                {stats?.totalReviews || 0} {t('provider.totalReviews')}
              </Text>
            </View>
          </AnimatedEntrance>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <AnimatedEntrance index={1} delay={150} style={{ flex: 1 }}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="local-offer" size={18} color={colors.primary} />
                </View>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 2 }}>{stats?.activeDeals || 0}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('provider.activeDeals')}</Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={2} delay={200} style={{ flex: 1 }}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="qr-code" size={18} color={colors.success} />
                </View>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 2 }}>{stats?.totalRedemptions || 0}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('provider.redemptions')}</Text>
              </View>
            </AnimatedEntrance>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
            <AnimatedEntrance index={3} delay={250} style={{ flex: 1 }}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="hourglass-top" size={18} color={colors.warning} />
                </View>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 2 }}>{stats?.claimedRedemptions || 0}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('provider.pending')}</Text>
              </View>
            </AnimatedEntrance>
            <AnimatedEntrance index={4} delay={300} style={{ flex: 1 }}>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: colors.outlineVariant }}>
                <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  <MaterialIcons name="check-circle" size={18} color={colors.success} />
                </View>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 2 }}>{stats?.redeemedRedemptions || 0}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('provider.completed')}</Text>
              </View>
            </AnimatedEntrance>
          </View>

          {/* Analytics Section - Gated */}
          {planFeatures && !planFeatures.has_analytics ? (
            <AnimatedEntrance index={5} delay={350}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>{t('provider.recentActivity')}</Text>
              <View style={{
                backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.md, overflow: 'hidden',
                borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 20,
                alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24,
              }}>
                <View style={{ width: 48, height: 48, borderRadius: Radius.full, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <MaterialIcons name="analytics" size={24} color={colors.iconDefault} />
                </View>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.onSurface, textAlign: 'center', marginBottom: 6 }}>
                  {t('provider.advancedAnalytics')}
                </Text>
                <Text style={{ fontFamily: 'Cairo', fontSize: 12, color: colors.onSurfaceVariant, textAlign: 'center', marginBottom: 16, lineHeight: 18 }}>
                  {t('provider.upgradeToUnlock')}
                </Text>
                <AnimatedButton
                  variant="gradient"
                  style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: Radius.full }}
                  onPress={() => router.push('/(provider)/subscription')}
                >
                  <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 13 }}>
                    {t('provider.upgradePlan')}
                  </Text>
                </AnimatedButton>
              </View>
            </AnimatedEntrance>
          ) : stats?.recentRedemptions && stats.recentRedemptions.length > 0 ? (
            <AnimatedEntrance index={5} delay={350}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>{t('provider.recentActivity')}</Text>
              <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 20 }}>
                {stats.recentRedemptions.map((redemption, idx) => (
                  <View key={redemption.id} style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== stats.recentRedemptions.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}>
                    <View style={{ width: 32, height: 32, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginEnd: 12, backgroundColor: redemption.status === 'redeemed' ? colors.successBg : colors.warningBg }}>
                      <MaterialIcons name={redemption.status === 'redeemed' ? 'check-circle' : 'hourglass-top'} size={16} color={redemption.status === 'redeemed' ? colors.success : colors.warning} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.onSurface }} numberOfLines={1}>{(redemption.discount as any)?.title || t('provider.deal')}</Text>
                      <Text style={{ color: colors.onSurfaceVariant, fontSize: 10, fontFamily: 'Cairo', marginTop: 2 }}>
                        {redemption.status === 'redeemed' ? t('provider.redeemed') : t('provider.claimed')} • {new Date(redemption.claimed_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, backgroundColor: redemption.status === 'redeemed' ? colors.successBg : colors.warningBg }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: redemption.status === 'redeemed' ? colors.success : colors.warning }}>{redemption.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </AnimatedEntrance>
          ) : null}

          <AnimatedEntrance index={6} delay={400}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>{t('provider.quickActions')}</Text>
            <View style={{ gap: 8 }}>
              {quickActions.map((action) => (
                <AnimatedButton
                  key={action.label}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.lg, borderWidth: 1, borderColor: colors.outlineVariant }}
                  onPress={action.onPress}
                >
                  <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                    <MaterialIcons name={action.icon} size={18} color={action.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>{action.label}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
                </AnimatedButton>
              ))}
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
