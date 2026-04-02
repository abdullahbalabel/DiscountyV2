import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { claimDeal, fetchDealById, getActiveSlotCount, hasClaimedDeal } from '../../../lib/api';
import { useSavedDeals } from '../../../contexts/savedDeals';
import { resolveMaterialIcon } from '../../../lib/iconMapping';
import type { Discount } from '../../../lib/types';

function useCountdown(endTime: string) {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); return; }
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { savedIds, toggleSave } = useSavedDeals();

  const [deal, setDeal] = useState<Discount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [slotCount, setSlotCount] = useState(0);
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);

  const isSaved = deal ? savedIds.has(deal.id) : false;

  const timeLeft = useCountdown(deal?.end_time || new Date().toISOString());

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
    if (slotCount >= 3) { Alert.alert('Deal Slots Full', 'You have 3 active deal slots. Please review a redeemed deal to free a slot.', [{ text: 'OK' }]); return; }
    setIsClaiming(true);
    const result = await claimDeal(deal.id);
    setIsClaiming(false);
    if (result.success) {
      Alert.alert('Deal Claimed!', 'Your QR code is ready. Show it to the provider to redeem your deal.', [
        { text: 'View My Deals', onPress: () => router.replace('/(customer)/dashboard') },
        { text: 'Stay Here', style: 'cancel' },
      ]);
      setSlotCount((prev) => prev + 1);
    } else {
      Alert.alert('Could Not Claim', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleToggleSave = async () => {
    if (!deal) return;
    await toggleSave(deal.id);
  };

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainerLow = isDark ? '#271d1b' : '#fff0ed';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color="#862045" /></View>;
  }

  if (!deal) {
    return (
      <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <MaterialIcons name="error-outline" size={36} color="#85736f" />
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, marginTop: 12 }}>Deal Not Found</Text>
        <Text style={{ fontFamily: 'Manrope', color: onSurfaceVariant, textAlign: 'center', fontSize: 14, marginTop: 4 }}>This deal may have been removed or expired.</Text>
        <AnimatedButton style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#862045', borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Go Back</Text>
        </AnimatedButton>
      </View>
    );
  }

  const provider = deal.provider as any;
  const category = deal.category as any;
  const formattedDiscount = deal.type === 'percentage' ? `${deal.discount_value}%` : `$${deal.discount_value}`;
  const spotsLeft = deal.max_redemptions - deal.current_redemptions;

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={18} color="white" />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>Discounty</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialIcons name="share" size={16} color="white" />
          </AnimatedButton>
          <AnimatedButton style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }} onPress={handleToggleSave}>
            <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? '#f59e0b' : 'white'} />
          </AnimatedButton>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={{ position: 'relative', width: '100%', aspectRatio: 16/10, backgroundColor: isDark ? '#534340' : '#f5ddd9' }}>
          <Image source={{ uri: deal.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          <LinearGradient colors={['transparent', 'rgba(26,17,15,0.9)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }} />
          <View style={{ position: 'absolute', top: 64, right: 16, backgroundColor: '#ffd9de', padding: 12, borderRadius: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '900', fontSize: 18, color: '#fff', letterSpacing: -0.5 }}>{formattedDiscount}</Text>
            <Text style={{ fontFamily: 'Manrope', fontSize: 8, color: '#fff', textTransform: 'uppercase', letterSpacing: 3, fontWeight: '700' }}>Discount</Text>
          </View>
          <View style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            {category && (
              <View style={{ backgroundColor: '#7d5700', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialIcons name={resolveMaterialIcon(category.icon)} size={10} color="white" />
                <Text style={{ color: '#fff', fontFamily: 'Manrope', fontSize: 9, textTransform: 'uppercase', letterSpacing: 3 }}>{category.name}</Text>
              </View>
            )}
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '900', color: '#fff', fontSize: 20, letterSpacing: -0.5 }}>{deal.title}</Text>
          </View>
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          {provider && (
            <AnimatedButton
              style={{ backgroundColor: surfaceContainerLowest, padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 }}
              onPress={() => router.push(`/(customer)/provider/${provider.id}`)}
            >
              {provider.logo_url ? (
                <Image source={{ uri: provider.logo_url }} style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }} contentFit="cover" />
              ) : (
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                  <MaterialIcons name="store" size={18} color="#862045" />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: onSurface }}>{provider.business_name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <MaterialIcons name="star" size={12} color="#f59e0b" />
                  <Text style={{ color: onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>
                    {provider.average_rating?.toFixed(1) || '—'} ({provider.total_reviews || 0} reviews)
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#85736f" />
            </AnimatedButton>
          )}

          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: surfaceContainerLow, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ backgroundColor: 'rgba(134,32,69,0.1)', padding: 8, borderRadius: 8 }}>
                  <MaterialIcons name="timer" size={20} color="#862045" />
                </View>
                <View>
                  <Text style={{ fontFamily: 'Manrope', fontSize: 9, textTransform: 'uppercase', letterSpacing: 3, color: onSurfaceVariant, fontWeight: '700' }}>Deal expires in</Text>
                  <Text style={{ fontFamily: 'Epilogue', fontSize: 14, color: onSurface, fontWeight: '700' }}>{timeLeft}</Text>
                </View>
              </View>
            </View>
          </AnimatedEntrance>

          {deal.description && (
            <AnimatedEntrance index={1} delay={150}>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontFamily: 'Epilogue', fontSize: 16, color: onSurface, marginBottom: 8, letterSpacing: -0.5 }}>About This Deal</Text>
                <Text style={{ color: onSurfaceVariant, lineHeight: 22, fontSize: 14, fontFamily: 'Manrope' }}>{deal.description}</Text>
              </View>
            </AnimatedEntrance>
          )}

          <AnimatedEntrance index={2} delay={200}>
            <View style={{ backgroundColor: surfaceContainerHigh, padding: 16, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              <Text style={{ fontFamily: 'Manrope', fontSize: 9, textTransform: 'uppercase', letterSpacing: 3, color: onSurfaceVariant, marginBottom: 4 }}>Deal Stats</Text>
              <Text style={{ fontFamily: 'Epilogue', fontSize: 24, color: onSurface, letterSpacing: -0.5, marginBottom: 16 }}>
                {formattedDiscount} <Text style={{ fontSize: 12, fontWeight: '400', color: onSurfaceVariant }}>off</Text>
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: onSurfaceVariant }}>Merchant Rating</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <MaterialIcons name="star" size={12} color="#f59e0b" />
                  <Text style={{ fontWeight: '700', color: onSurface, fontSize: 12 }}>{provider?.average_rating?.toFixed(1) || '—'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 10, color: onSurfaceVariant }}>Total Claims</Text>
                <Text style={{ fontWeight: '700', color: onSurface, fontSize: 12 }}>{deal.current_redemptions} users</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: onSurfaceVariant }}>Spots Remaining</Text>
                <Text style={{ fontWeight: '700', fontSize: 12, color: spotsLeft <= 10 ? '#ba1a1a' : onSurface }}>{spotsLeft > 0 ? `${spotsLeft} left` : 'Sold Out'}</Text>
              </View>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={3} delay={250}>
            <View style={{ borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 20, backgroundColor: surfaceContainer }}>
              <MaterialIcons name="info" size={16} color="#7b5733" />
              <Text style={{ flex: 1, fontSize: 12, lineHeight: 16, color: onSurfaceVariant }}>
                You have <Text style={{ fontWeight: '700', color: onSurface }}>{slotCount}/3</Text> deal slots used.
                {slotCount >= 3 && ' Review a redeemed deal to free a slot.'}
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={4} delay={300}>
            {spotsLeft <= 0 ? (
              <View style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: surfaceContainerHigh, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: onSurfaceVariant, fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14 }}>Sold Out</Text>
              </View>
            ) : timeLeft === 'Expired' ? (
              <View style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: surfaceContainerHigh, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: onSurfaceVariant, fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14 }}>Deal Expired</Text>
              </View>
            ) : alreadyClaimed ? (
              <View style={{ paddingVertical: 12, borderRadius: 12, backgroundColor: surfaceContainerHigh, alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ color: onSurfaceVariant, fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14 }}>Already Claimed</Text>
              </View>
            ) : (
              <AnimatedButton
                variant="gradient"
                style={{ paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, opacity: (isClaiming || slotCount >= 3) ? 0.6 : 1 }}
                onPress={handleClaim}
                disabled={isClaiming || slotCount >= 3}
              >
                <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, textAlign: 'center' }}>
                  {isClaiming ? 'Claiming...' : slotCount >= 3 ? 'Slots Full — Review a Deal' : 'Claim Deal Now'}
                </Text>
              </AnimatedButton>
            )}
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
