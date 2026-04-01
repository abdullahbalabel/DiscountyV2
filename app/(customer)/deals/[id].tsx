import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { claimDeal, fetchDealById, getActiveSlotCount, getSavedDealIds, toggleSaveDeal } from '../../../lib/api';
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

  const [deal, setDeal] = useState<Discount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [slotCount, setSlotCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const timeLeft = useCountdown(deal?.end_time || new Date().toISOString());

  useEffect(() => {
    const loadDeal = async () => {
      if (!id) return;
      try {
        const [dealData, slots, savedIds] = await Promise.all([
          fetchDealById(id),
          getActiveSlotCount(),
          getSavedDealIds(),
        ]);
        setDeal(dealData);
        setSlotCount(slots);
        setIsSaved(savedIds.includes(id));
      } catch (err) {
        console.error('Error loading deal:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadDeal();
  }, [id]);

  const handleClaim = async () => {
    if (!deal) return;

    if (slotCount >= 3) {
      Alert.alert(
        'Deal Slots Full',
        'You have 3 active deal slots. Please review a redeemed deal to free a slot.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsClaiming(true);
    const result = await claimDeal(deal.id);
    setIsClaiming(false);

    if (result.success) {
      Alert.alert(
        'Deal Claimed! 🎉',
        'Your QR code is ready. Show it to the provider to redeem your deal.',
        [
          { text: 'View My Deals', onPress: () => router.replace('/(customer)/dashboard') },
          { text: 'Stay Here', style: 'cancel' },
        ]
      );
      setSlotCount((prev) => prev + 1);
    } else {
      Alert.alert('Could Not Claim', result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleToggleSave = async () => {
    if (!deal) return;
    const newState = await toggleSaveDeal(deal.id);
    setIsSaved(newState);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#862045" />
      </View>
    );
  }

  if (!deal) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <MaterialIcons name="error-outline" size={36} color="#85736f" />
        <Text className="font-headline font-bold text-base text-on-surface mt-3">Deal Not Found</Text>
        <Text className="font-body text-on-surface-variant text-center text-sm mt-1">
          This deal may have been removed or expired.
        </Text>
        <AnimatedButton
          className="mt-4 px-5 py-2 bg-primary rounded-md"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold text-sm">Go Back</Text>
        </AnimatedButton>
      </View>
    );
  }

  const provider = deal.provider as any;
  const category = deal.category as any;
  const formattedDiscount = deal.type === 'percentage'
    ? `${deal.discount_value}%`
    : `$${deal.discount_value}`;
  const spotsLeft = deal.max_redemptions - deal.current_redemptions;

  return (
    <View className="flex-1 bg-background">
      {/* Custom Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-3">
          <AnimatedButton
            className="w-8 h-8 rounded-md bg-black/40 shadow-sm items-center justify-center p-0"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={18} color="white" />
          </AnimatedButton>
          <Text className="font-headline font-bold tracking-tighter text-lg text-on-surface">
            Discounty
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <AnimatedButton className="w-8 h-8 rounded-md bg-black/40 shadow-sm items-center justify-center p-0">
            <MaterialIcons name="share" size={16} color="white" />
          </AnimatedButton>
          <AnimatedButton
            className="w-8 h-8 rounded-md bg-black/40 shadow-sm items-center justify-center p-0"
            onPress={handleToggleSave}
          >
            <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? '#f59e0b' : 'white'} />
          </AnimatedButton>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero Section */}
        <View className="relative w-full aspect-[16/10] bg-surface-container-highest">
          <Image
            source={{ uri: deal.image_url || 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800' }}
            className="w-full h-full"
            contentFit="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(26,17,15,0.9)']}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' }}
          />

          {/* Badge */}
          <View className="absolute top-16 right-4 bg-primary-container p-3 rounded-xl items-center shadow-[0_20px_40px_rgba(134,32,69,0.3)]">
            <Text className="font-headline font-black text-lg text-white tracking-tighter">{formattedDiscount}</Text>
            <Text className="font-label text-[8px] text-white uppercase tracking-[0.2em] font-bold">Discount</Text>
          </View>

          {/* Title Area */}
          <View className="absolute bottom-4 left-4 right-4">
            {category && (
              <View className="bg-tertiary self-start px-2 py-0.5 rounded-md mb-2 flex-row items-center gap-1">
                <MaterialIcons name={category.icon} size={10} color="white" />
                <Text className="text-white font-label text-[9px] uppercase tracking-widest">{category.name}</Text>
              </View>
            )}
            <Text className="font-headline font-black text-white text-xl tracking-tighter">{deal.title}</Text>
          </View>
        </View>

        <View className="px-4 mt-4">
          {/* Provider Card (tappable) */}
          {provider && (
            <AnimatedButton
              className="bg-surface-container-lowest p-3 rounded-xl flex-row items-center shadow-sm mb-4"
              onPress={() => handleProviderPress(provider.id)}
            >
              {provider.logo_url ? (
                <Image source={{ uri: provider.logo_url }} className="w-10 h-10 rounded-lg mr-3" contentFit="cover" />
              ) : (
                <View className="w-10 h-10 rounded-lg bg-primary/10 items-center justify-center mr-3">
                  <MaterialIcons name="store" size={18} color="#862045" />
                </View>
              )}
              <View className="flex-1">
                <Text className="font-headline font-bold text-sm text-on-surface">{provider.business_name}</Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  <MaterialIcons name="star" size={12} color="#f59e0b" />
                  <Text className="text-on-surface-variant text-xs font-semibold">
                    {provider.average_rating?.toFixed(1) || '—'} ({provider.total_reviews || 0} reviews)
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#85736f" />
            </AnimatedButton>
          )}

          {/* Timer Widget */}
          <AnimatedEntrance index={0} delay={100}>
            <View className="bg-surface-container-low p-4 rounded-2xl flex-row items-center justify-between mb-5">
              <View className="flex-row items-center gap-3">
                <View className="bg-primary/10 p-2 rounded-md">
                  <MaterialIcons name="timer" size={20} color="#862045" />
                </View>
                <View>
                  <Text className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant font-bold">Deal expires in</Text>
                  <Text className="font-headline text-sm text-on-surface font-bold">{timeLeft}</Text>
                </View>
              </View>
            </View>
          </AnimatedEntrance>

          {/* Description */}
          {deal.description && (
            <AnimatedEntrance index={1} delay={150}>
              <View className="mb-5">
                <Text className="font-headline text-base text-on-surface mb-2 tracking-tight">About This Deal</Text>
                <Text className="text-on-surface-variant leading-relaxed text-sm font-body">
                  {deal.description}
                </Text>
              </View>
            </AnimatedEntrance>
          )}

          {/* Stats Section */}
          <AnimatedEntrance index={2} delay={200}>
            <View className="bg-surface-container-high p-4 rounded-2xl overflow-hidden mb-5">
              <Text className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant mb-1">Deal Stats</Text>
              <Text className="font-headline text-2xl text-on-surface tracking-tighter mb-4">
                {formattedDiscount} <Text className="text-xs font-normal text-on-surface-variant">off</Text>
              </Text>

              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[10px] text-on-surface-variant">Merchant Rating</Text>
                <View className="flex-row items-center gap-1">
                  <MaterialIcons name="star" size={12} color="#f59e0b" />
                  <Text className="font-bold text-on-surface text-xs">
                    {provider?.average_rating?.toFixed(1) || '—'}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[10px] text-on-surface-variant">Total Claims</Text>
                <Text className="font-bold text-on-surface text-xs">{deal.current_redemptions} users</Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-[10px] text-on-surface-variant">Spots Remaining</Text>
                <Text className={`font-bold text-xs ${spotsLeft <= 10 ? 'text-error' : 'text-on-surface'}`}>
                  {spotsLeft > 0 ? `${spotsLeft} left` : 'Sold Out'}
                </Text>
              </View>
            </View>
          </AnimatedEntrance>

          {/* Slot Info */}
          <AnimatedEntrance index={3} delay={250}>
            <View className="rounded-xl p-3 flex-row items-start gap-2 mb-5 bg-surface-container">
              <MaterialIcons name="info" size={16} color="#7b5733" />
              <Text className="flex-1 text-xs leading-4 text-on-surface-variant">
                You have <Text className="font-bold text-on-surface">{slotCount}/3</Text> deal slots used.
                {slotCount >= 3 && ' Review a redeemed deal to free a slot.'}
              </Text>
            </View>
          </AnimatedEntrance>

          {/* Claim Deal CTA */}
          <AnimatedEntrance index={4} delay={300}>
            {spotsLeft <= 0 ? (
              <View className="py-3 rounded-xl bg-surface-container-high items-center mb-5">
                <Text className="text-on-surface-variant font-headline font-bold text-sm">Sold Out</Text>
              </View>
            ) : timeLeft === 'Expired' ? (
              <View className="py-3 rounded-xl bg-surface-container-high items-center mb-5">
                <Text className="text-on-surface-variant font-headline font-bold text-sm">Deal Expired</Text>
              </View>
            ) : (
              <AnimatedButton
                variant="gradient"
                className="py-3 shadow-xl rounded-xl items-center justify-center mb-5"
                onPress={handleClaim}
                disabled={isClaiming || slotCount >= 3}
              >
                <Text className="text-white font-headline font-bold text-sm text-center">
                  {isClaiming ? 'Claiming...' : slotCount >= 3 ? 'Slots Full — Review a Deal' : 'Claim Deal Now'}
                </Text>
              </AnimatedButton>
            )}
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );

  function handleProviderPress(providerId: string) {
    router.push(`/(customer)/provider/${providerId}`);
  }
}
