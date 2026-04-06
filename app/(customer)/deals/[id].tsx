import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, I18nManager, Modal, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { claimDeal, fetchDealById, getActiveSlotCount, hasClaimedDeal } from '../../../lib/api';
import { useSavedDeals } from '../../../contexts/savedDeals';
import { resolveMaterialIcon } from '../../../lib/iconMapping';
import { useThemeColors, Radius, Shadows } from '../../../hooks/use-theme-colors';
import type { Discount } from '../../../lib/types';

function useCountdown(endTime: string, t: (key: string) => string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft(t('deal.expired')); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}h : ${String(m).padStart(2, '0')}m : ${String(s).padStart(2, '0')}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);
  return timeLeft;
}

export default function DealDetails() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useThemeColors();
  const { savedIds, toggleSave } = useSavedDeals();

  const [deal, setDeal] = useState<Discount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [slotCount, setSlotCount] = useState(0);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redemptionId, setRedemptionId] = useState<string | null>(null);

  const isSaved = deal ? savedIds.has(deal.id) : false;

  const timeLeft = useCountdown(deal?.end_time || new Date().toISOString(), t);

  useEffect(() => {
    const loadDeal = async () => {
      if (!id) return;
      try {
        const [dealData, slots, claimed] = await Promise.all([fetchDealById(id), getActiveSlotCount(), hasClaimedDeal(id)]);
        setDeal(dealData);
        setSlotCount(slots);
        setAlreadyClaimed(claimed);
      } catch (err) { console.error('Error loading deal:', err); }
      finally { setIsLoading(false); }
    };
    loadDeal();
  }, [id]);

  const handleClaim = async () => {
    if (!deal) return;
    if (slotCount >= 3) { Alert.alert(t('customer.dealSlotsFull'), t('customer.dealSlotsFullMsg'), [{ text: 'OK' }]); return; }
    setIsClaiming(true);
    const result = await claimDeal(deal.id);
    setIsClaiming(false);
    if (result.success) {
      setSlotCount((prev) => prev + 1);
      setAlreadyClaimed(true);
      setRedemptionId(result.redemption_id || null);
      setShowSuccess(true);
    } else {
      Alert.alert(t('customer.couldNotClaim'), result.error || t('customer.tryAgain'));
    }
  };

  const handleViewQR = () => {
    setShowSuccess(false);
    if (redemptionId) {
      router.push({ pathname: '/(customer)/qr/[redemptionId]', params: { redemptionId } } as any);
    } else {
      router.replace('/(customer)/dashboard');
    }
  };

  const handleToggleSave = async () => {
    if (!deal) return;
    await toggleSave(deal.id);
  };

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!deal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <MaterialIcons name="error-outline" size={36} color={colors.iconDefault} />
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginTop: 12 }}>{t('customer.dealNotFound')}</Text>
        <Text style={{ fontFamily: 'Cairo', color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14, marginTop: 4 }}>{t('customer.dealRemovedOrExpired')}</Text>
        <AnimatedButton style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: colors.primary, borderRadius: Radius.md }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>{t('customer.goBack')}</Text>
        </AnimatedButton>
      </View>
    );
  }

  const provider = deal.provider as any;
  const category = deal.category as any;
  const formattedDiscount = deal.type === 'percentage' ? `${deal.discount_value}%` : `$${deal.discount_value}`;
  const spotsLeft = deal.max_redemptions - deal.current_redemptions;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }} onPress={() => router.back()}>
            <MaterialIcons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={18} color="white" />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('discounty')}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="share" size={16} color="white" />
          </AnimatedButton>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' }} onPress={handleToggleSave}>
            <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? colors.warning : 'white'} />
          </AnimatedButton>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ position: 'relative', width: '100%', aspectRatio: 16/10, backgroundColor: colors.surfaceContainerHigh }}>
          <Image source={{ uri: deal.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(26,17,15,0.9)']} style={{ position: 'absolute', bottom: 0, start: 0, end: 0, height: '60%' }} />
          <View style={{ position: 'absolute', top: 64, end: 16, backgroundColor: colors.primary, padding: 12, borderRadius: Radius.lg, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 18, color: '#fff', letterSpacing: -0.5 }}>{formattedDiscount}</Text>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 8, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,  }}>{t('customer.discount')}</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            {category && (
              <View style={{ backgroundColor: colors.brown, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name={resolveMaterialIcon(category.icon)} size={10} color="white" />
                <Text style={{ color: '#fff', fontFamily: 'Cairo', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>{category.name}</Text>
              </View>
            )}
            <Text style={{ fontFamily: 'Cairo_800ExtraBold', color: '#fff', fontSize: 20, letterSpacing: -0.5 }}>{deal.title}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {provider && (
            <AnimatedButton
              style={{ backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', marginBottom: 16, ...Shadows.sm }}
              onPress={() => router.push(`/(customer)/provider/${provider.id}`)}
            >
              {provider.logo_url ? (
                <Image source={{ uri: provider.logo_url }} style={{ width: 40, height: 40, borderRadius: Radius.md, marginEnd: 12 }} contentFit="cover" />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                  <MaterialIcons name="store" size={18} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface }}>{provider.business_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <MaterialIcons name="star" size={12} color={colors.warning} />
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
                     {provider.average_rating?.toFixed(1) || '—'} ({provider.total_reviews || 0} {t('customer.reviews')})
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
            </AnimatedButton>
          )}

          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: colors.surfaceContainerLow, padding: 16, borderRadius: Radius.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: 'rgba(134,32,69,0.1)', padding: 8, borderRadius: Radius.md }}>
                  <MaterialIcons name="timer" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.onSurfaceVariant,  }}>{t('customer.dealExpiresIn')}</Text>
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface,  }}>{timeLeft}</Text>
                </View>
              </View>
            </View>
          </AnimatedEntrance>

          {deal.description && (
            <AnimatedEntrance index={1} delay={150}>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontFamily: 'Cairo', fontSize: 16, color: colors.onSurface, marginBottom: 8, letterSpacing: -0.5 }}>{t('customer.aboutThisDeal')}</Text>
                <Text style={{ color: colors.onSurfaceVariant, lineHeight: 22, fontSize: 14, fontFamily: 'Cairo' }}>{deal.description}</Text>
              </View>
            </AnimatedEntrance>
          )}

          <AnimatedEntrance index={2} delay={200}>
            <View style={{ backgroundColor: colors.surfaceContainerHigh, padding: 16, borderRadius: Radius.xl, overflow: 'hidden', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Cairo', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.onSurfaceVariant, marginBottom: 4 }}>{t('customer.dealStats')}</Text>
              <Text style={{ fontFamily: 'Cairo', fontSize: 24, color: colors.onSurface, letterSpacing: -0.5, marginBottom: 16 }}>
                {formattedDiscount} <Text style={{ fontSize: 12, fontWeight: '400', color: colors.onSurfaceVariant }}>{t('customer.off')}</Text>
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{t('customer.merchantRating')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="star" size={12} color={colors.warning} />
                  <Text style={{ fontWeight: '700', color: colors.onSurface, fontSize: 12 }}>{provider?.average_rating?.toFixed(1) || '—'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{t('customer.totalClaims')}</Text>
                <Text style={{ fontWeight: '700', color: colors.onSurface, fontSize: 12 }}>{deal.current_redemptions} {t('customer.users')}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.onSurfaceVariant }}>{t('customer.spotsRemaining')}</Text>
                <Text style={{ fontWeight: '700', fontSize: 12, color: spotsLeft <= 10 ? colors.error : colors.onSurface }}>{spotsLeft > 0 ? `${spotsLeft} ${t('customer.left')}` : t('customer.soldOut')}</Text>
              </View>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={3} delay={250}>
            <View style={{ borderRadius: Radius.lg, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 20, backgroundColor: colors.surfaceContainer }}>
              <MaterialIcons name="info" size={16} color={colors.brown} />
              <Text style={{ flex: 1, fontSize: 12, lineHeight: 16, color: colors.onSurfaceVariant }}>
                {t('customer.dealSlotsUsed', { count: slotCount })}
                {slotCount >= 3 && ` ${t('customer.reviewToFreeSlot')}`}
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={4} delay={300}>
            {spotsLeft <= 0 ? (
              <View style={{ paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 14 }}>{t('customer.soldOut')}</Text>
               </View>
             ) : timeLeft === t('deal.expired') ? (
               <View style={{ paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 14 }}>{t('customer.dealExpired')}</Text>
               </View>
             ) : alreadyClaimed ? (
               <View style={{ paddingVertical: 12, borderRadius: Radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 14 }}>{t('customer.alreadyClaimed')}</Text>
              </View>
            ) : (
              <AnimatedButton
                variant="gradient"
                style={{ paddingVertical: 12, ...Shadows.md, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 20, opacity: (isClaiming || slotCount >= 3) ? 0.6 : 1 }}
                onPress={handleClaim}
                disabled={isClaiming || slotCount >= 3}
              >
                <Text style={{ color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 14, textAlign: 'center' }}>
                  {isClaiming ? t('customer.claiming') : slotCount >= 3 ? t('customer.slotsFullReview') : t('customer.claimDealNow')}
                </Text>
              </AnimatedButton>
            )}
          </AnimatedEntrance>
        </View>
      </ScrollView>

      <Modal visible={showSuccess} transparent animationType="fade" onRequestClose={() => setShowSuccess(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.surfaceBg, borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340, ...Shadows.lg }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
              <MaterialIcons name="celebration" size={40} color="#16a34a" />
            </View>
            <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 22, color: colors.onSurface, textAlign: 'center', letterSpacing: -0.5 }}>
              {t('customer.dealClaimed')}
            </Text>
            <Text style={{ fontFamily: 'Cairo', fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
              {t('customer.qrCodeReady')}
            </Text>
            <View style={{ width: '100%', marginTop: 24, gap: 10 }}>
              <AnimatedButton
                variant="gradient"
                style={{ width: '100%', paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' }}
                onPress={handleViewQR}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons name="qr-code" size={20} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 15 }}>
                    {t('customer.viewQRCode')}
                  </Text>
                </View>
              </AnimatedButton>
              <AnimatedButton
                variant="outline"
                style={{ width: '100%', paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => setShowSuccess(false)}
              >
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo_700Bold', fontSize: 15 }}>
                  {t('customer.stayHere')}
                </Text>
              </AnimatedButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
