import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, Pressable, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import {
  fetchOwnProviderProfile,
  fetchProviderSubscription,
  fetchSubscriptionPlans,
  checkProviderDealLimit,
  cancelSubscriptionDowngrade,
  scheduleSubscriptionDowngrade,
} from '../../lib/api';
import { openStripeCheckout } from '../../lib/stripe';
import type { SubscriptionPlan, ProviderSubscription, DealLimitCheck } from '../../lib/types';

export default function SubscriptionScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscription, setSubscription] = useState<ProviderSubscription | null>(null);
  const [dealLimit, setDealLimit] = useState<DealLimitCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [cancelling, setCancelling] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [plansData, subData, profile] = await Promise.all([
        fetchSubscriptionPlans(),
        fetchProviderSubscription(),
        fetchOwnProviderProfile(),
      ]);
      setPlans(plansData);
      setSubscription(subData);
      if (subData) setBillingCycle(subData.billing_cycle);

      if (profile) {
        const limit = await checkProviderDealLimit(profile.id);
        setDealLimit(limit);
      }
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Listen for deep link redirects from Stripe checkout
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      if (url.includes('subscription-success')) {
        loadData();
        Alert.alert(
          t('common.ok'),
          t('provider.checkoutSuccess'),
        );
      }
    });
    return () => subscription.remove();
  }, [loadData, t]);

  const handleCheckout = async (planId: string) => {
    setCheckoutLoading(planId);
    try {
      const success = await openStripeCheckout(planId, billingCycle);
      if (success) {
        await loadData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Checkout failed';
      Alert.alert(t('common.error'), message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleCancelDowngrade = async () => {
    if (!subscription) return;
    setCancelling(true);
    try {
      await cancelSubscriptionDowngrade(subscription.id);
      await loadData();
    } catch (err: any) {
      Alert.alert(t('common.error'), err.message);
    } finally {
      setCancelling(false);
    }
  };

  const handleDowngrade = async (planId: string) => {
    if (!subscription) return;
    setCheckoutLoading(planId);
    try {
      await scheduleSubscriptionDowngrade(subscription.id, planId, billingCycle);
      await loadData();
      Alert.alert(
        t('common.ok'),
        t('provider.pendingDowngrade', {
          plan: plans.find(p => p.id === planId)?.name || '',
          date: subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : '',
        }),
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Downgrade failed';
      Alert.alert(t('common.error'), message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const currentPlan = subscription?.plan;
  const isAr = i18n.language === 'ar';

  const getPlanPrice = (plan: SubscriptionPlan) => {
    const price = billingCycle === 'yearly' ? plan.yearly_price_sar : plan.monthly_price_sar;
    if (!price || price === 0) return t('provider.freePlan');
    return `${t('provider.sar')} ${price}${billingCycle === 'yearly' ? t('provider.perYear') : t('provider.perMonth')}`;
  };

  const getPlanTier = (plan: SubscriptionPlan) => {
    return plan.max_active_deals;
  };

  const currentTier = currentPlan ? getPlanTier(currentPlan) : 0;

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <GlassHeader style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AnimatedButton
            style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>
            {t('provider.subscriptionPlan')}
          </Text>
        </View>
      </GlassHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
        {/* Current Plan Header */}
        {currentPlan && (
          <AnimatedEntrance index={0} delay={100}>
            <View style={{
              backgroundColor: colors.primary, padding: 16, borderRadius: Radius.xl, marginBottom: 16, marginTop: 8,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Cairo', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
                  {t('provider.currentPlan')}
                </Text>
                {currentPlan.profile_badge && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 2, borderRadius: Radius.full }}>
                    <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 11 }}>
                      {isAr ? currentPlan.profile_badge_ar : currentPlan.profile_badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={{ color: 'white', fontFamily: 'Cairo_800ExtraBold', fontSize: 22, letterSpacing: -0.5, marginBottom: 4 }}>
                {isAr ? currentPlan.name_ar : currentPlan.name}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Cairo', fontSize: 12, marginBottom: 12 }}>
                {getPlanPrice(currentPlan)}
              </Text>
              {subscription?.current_period_end && (
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontFamily: 'Cairo', fontSize: 11 }}>
                  {t('provider.activeUntil', { date: new Date(subscription.current_period_end).toLocaleDateString() })}
                </Text>
              )}
              {/* Deals Progress */}
              {dealLimit && (
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'Cairo', fontSize: 11 }}>
                      {t('provider.dealsUsed', { current: dealLimit.current_count, max: dealLimit.max_allowed })}
                    </Text>
                  </View>
                  <View style={{ height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
                    <View style={{
                      height: '100%', borderRadius: 2,
                      backgroundColor: dealLimit.current_count >= dealLimit.max_allowed ? colors.warning : 'white',
                      width: `${dealLimit.max_allowed > 0 ? Math.min((dealLimit.current_count / dealLimit.max_allowed) * 100, 100) : 0}%`,
                    }} />
                  </View>
                </View>
              )}
            </View>
          </AnimatedEntrance>
        )}

        {/* Pending Downgrade Banner */}
        {subscription?.pending_plan_id && (
          <AnimatedEntrance index={1} delay={150}>
            <View style={{
              backgroundColor: colors.warningBg, borderWidth: 1, borderColor: colors.warning,
              padding: 12, borderRadius: Radius.lg, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 10,
            }}>
              <MaterialIcons name="warning" size={20} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.warningText, fontFamily: 'Cairo_600SemiBold', fontSize: 13 }}>
                  {t('provider.pendingDowngrade', {
                    plan: plans.find(p => p.id === subscription.pending_plan_id)?.name || '',
                    date: subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : '',
                  })}
                </Text>
                <Pressable onPress={handleCancelDowngrade} disabled={cancelling} style={{ marginTop: 6 }}>
                  <Text style={{ color: colors.warning, fontFamily: 'Cairo_700Bold', fontSize: 12 }}>
                    {cancelling ? t('common.sending') : t('provider.cancelDowngrade')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </AnimatedEntrance>
        )}

        {/* Billing Cycle Toggle */}
        <AnimatedEntrance index={2} delay={200}>
          <View style={{
            flexDirection: 'row', backgroundColor: colors.surfaceContainerLowest,
            borderRadius: Radius.full, padding: 3, marginBottom: 20,
            borderWidth: 1, borderColor: colors.outlineVariant,
          }}>
            {(['monthly', 'yearly'] as const).map((cycle) => (
              <Pressable
                key={cycle}
                onPress={() => setBillingCycle(cycle)}
                style={{
                  flex: 1, paddingVertical: 8, borderRadius: Radius.full,
                  backgroundColor: billingCycle === cycle ? colors.primary : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{
                  fontFamily: 'Cairo_700Bold', fontSize: 13,
                  color: billingCycle === cycle ? 'white' : colors.onSurfaceVariant,
                }}>
                  {cycle === 'monthly' ? t('provider.monthly') : t('provider.yearly')}
                </Text>
              </Pressable>
            ))}
          </View>
        </AnimatedEntrance>

        {/* Plan Cards */}
        {plans.map((plan, idx) => {
          const isCurrent = currentPlan?.id === plan.id;
          const planTier = getPlanTier(plan);
          const isUpgrade = !isCurrent && planTier > currentTier;
          const isDowngrade = !isCurrent && planTier < currentTier;

          const features = [
            { icon: 'local-offer', label: `${plan.max_active_deals} ${t('provider.active').toLowerCase()} ${t('provider.myDeals').toLowerCase()}` },
            ...(plan.max_featured_deals > 0 ? [{ icon: 'star', label: `${plan.max_featured_deals} ${t('provider.featuredDeals')}` }] : []),
            ...(plan.has_analytics ? [{ icon: 'analytics', label: t('provider.advancedAnalytics') }] : []),
            ...(plan.max_push_notifications > 0 ? [{ icon: 'notifications', label: `${plan.max_push_notifications} ${t('provider.pushNotifications')}` }] : []),
            ...(plan.has_priority_support ? [{ icon: 'support-agent', label: t('provider.prioritySupport') }] : []),
            ...(plan.has_homepage_placement ? [{ icon: 'home', label: t('provider.homepagePlacement') }] : []),
          ];

          return (
            <AnimatedEntrance key={plan.id} index={idx + 3} delay={250 + idx * 50}>
              <View style={{
                backgroundColor: colors.surfaceContainerLowest,
                borderRadius: Radius.xl, borderWidth: isCurrent ? 2 : 1,
                borderColor: isCurrent ? colors.primary : colors.outlineVariant,
                padding: 16, marginBottom: 12,
                ...Shadows.sm,
              }}>
                {/* Plan Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 18, color: colors.onSurface }}>
                      {isAr ? plan.name_ar : plan.name}
                    </Text>
                    {plan.profile_badge && (
                      <View style={{ backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 1, borderRadius: Radius.full }}>
                        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, color: colors.primary }}>
                          {isAr ? plan.profile_badge_ar : plan.profile_badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  {isCurrent && (
                    <View style={{ backgroundColor: colors.successBg, paddingHorizontal: 10, paddingVertical: 2, borderRadius: Radius.full }}>
                      <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, color: colors.successText }}>
                        {t('provider.currentPlan')}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Price */}
                <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 24, color: colors.primary, marginBottom: 12, letterSpacing: -0.5 }}>
                  {getPlanPrice(plan)}
                </Text>

                {/* Features */}
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {features.map((f, fi) => (
                    <View key={fi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialIcons name={f.icon as any} size={16} color={colors.primary} />
                      <Text style={{ fontFamily: 'Cairo', fontSize: 13, color: colors.onSurfaceVariant }}>
                        {f.label}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                {!isCurrent && (
                  <>
                    {isUpgrade ? (
                      <AnimatedButton
                        variant="gradient"
                        disabled={checkoutLoading !== null}
                        style={{ paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' }}
                        onPress={() => handleCheckout(plan.id)}
                      >
                        {checkoutLoading === plan.id ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Text style={{ fontFamily: 'Cairo_700Bold', color: 'white', fontSize: 14 }}>
                            {t('provider.upgradePlan')}
                          </Text>
                        )}
                      </AnimatedButton>
                    ) : isDowngrade ? (
                      <AnimatedButton
                        variant="outline"
                        disabled={checkoutLoading !== null}
                        style={{ paddingVertical: 12, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', borderColor: colors.outlineVariant }}
                        onPress={() => handleDowngrade(plan.id)}
                      >
                        {checkoutLoading === plan.id ? (
                          <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurfaceVariant }}>
                            {t('provider.downgradePlan')}
                          </Text>
                        )}
                      </AnimatedButton>
                    ) : null}
                  </>
                )}
              </View>
            </AnimatedEntrance>
          );
        })}

        {/* No plan action CTA */}
        <AnimatedEntrance index={plans.length + 3} delay={250}>
          <Pressable
            onPress={() => {
              // Scroll to plans — just a no-op visual hint
            }}
            style={{
              backgroundColor: colors.surfaceContainerHigh, padding: 14, borderRadius: Radius.lg,
              alignItems: 'center', marginTop: 8, marginBottom: 20,
            }}
          >
            <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.onSurfaceVariant }}>
              {t('provider.changePlan')}
            </Text>
          </Pressable>
        </AnimatedEntrance>
      </ScrollView>
    </View>
  );
}
