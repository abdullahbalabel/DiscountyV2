import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { fetchRedemptionById } from '../../../lib/api';

// Conditionally import QR code (not available on web)
let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch {
  // web fallback
}

export default function QRDisplayScreen() {
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [redemption, setRedemption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!redemptionId) return;
      try {
        const data = await fetchRedemptionById(redemptionId);
        setRedemption(data);
      } catch (err) {
        console.error('Error loading redemption:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [redemptionId]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#862045" />
      </View>
    );
  }

  if (!redemption) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <MaterialIcons name="error-outline" size={48} color="#85736f" />
        <Text className="font-headline font-bold text-xl text-on-surface mt-4">Not Found</Text>
        <Text className="font-body text-on-surface-variant text-center mt-2">
          This redemption could not be found.
        </Text>
        <AnimatedButton className="mt-6 px-6 py-3 bg-primary rounded-md" onPress={() => router.back()}>
          <Text className="text-white font-bold">Go Back</Text>
        </AnimatedButton>
      </View>
    );
  }

  const deal = redemption.discount;
  const provider = deal?.provider;
  const isRedeemed = redemption.status === 'redeemed';
  const isClaimed = redemption.status === 'claimed';
  const formattedDiscount = deal?.type === 'percentage'
    ? `${deal?.discount_value}%`
    : `$${deal?.discount_value}`;

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-4">
          <AnimatedButton
            className="w-10 h-10 rounded-md bg-surface-container-high items-center justify-center p-0"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <Text className="font-headline font-bold tracking-tighter text-xl text-on-surface">
            Your QR Code
          </Text>
        </View>
      </View>

      <View className="flex-1 px-6 items-center">
        {/* Deal Info */}
        <AnimatedEntrance index={0} delay={100}>
          <View className="items-center mb-8">
            <Text className="font-headline font-black text-2xl text-on-surface text-center tracking-tight" numberOfLines={2}>
              {deal?.title || 'Deal'}
            </Text>
            <Text className="text-on-surface-variant font-body mt-2 text-center">
              {provider?.business_name || 'Provider'}
            </Text>
            <View className="bg-primary-container mt-3 px-5 py-2 rounded-md">
              <Text className="font-headline font-bold text-white text-lg">{formattedDiscount} OFF</Text>
            </View>
          </View>
        </AnimatedEntrance>

        {/* QR Code Card */}
        <AnimatedEntrance index={1} delay={200}>
          <View className="rounded-[2.5rem] p-8 items-center shadow-2xl bg-white border-outline-variant/10">
            {isClaimed && redemption.qr_code_hash ? (
              <>
                {QRCode && Platform.OS !== 'web' ? (
                  <QRCode
                    value={redemption.qr_code_hash}
                    size={220}
                    color="#231917"
                    backgroundColor="white"
                  />
                ) : (
                  /* Web fallback: show hash as text-based representation */
                  <View className="w-[220px] h-[220px] items-center justify-center border-2 border-dashed border-outline-variant rounded-2xl">
                    <MaterialIcons name="qr-code" size={80} color="#231917" />
                    <Text className="text-on-surface text-xs mt-3 text-center font-mono px-4" numberOfLines={3}>
                      {redemption.qr_code_hash}
                    </Text>
                  </View>
                )}
                <Text className="text-on-surface-variant text-xs mt-4 text-center font-body">
                  Show this to the provider to redeem
                </Text>
              </>
            ) : isRedeemed ? (
              <View className="w-[220px] h-[220px] items-center justify-center">
                <View className="w-20 h-20 rounded-md bg-green-100 items-center justify-center mb-4">
                  <MaterialIcons name="check-circle" size={48} color="#16a34a" />
                </View>
                <Text className="text-green-700 font-headline font-bold text-lg">Redeemed!</Text>
                <Text className="text-on-surface-variant text-sm mt-2 text-center font-body">
                  This deal has been successfully redeemed.
                </Text>
              </View>
            ) : (
              <View className="w-[220px] h-[220px] items-center justify-center">
                <MaterialIcons name="error-outline" size={48} color="#85736f" />
                <Text className="text-on-surface-variant text-sm mt-2 text-center font-body">
                  QR code not available
                </Text>
              </View>
            )}
          </View>
        </AnimatedEntrance>

        {/* Status Badge */}
        <AnimatedEntrance index={2} delay={300}>
          <View className={`mt-6 px-5 py-3 rounded-md flex-row items-center gap-2 ${isClaimed
            ? 'bg-secondary-container'
            : isRedeemed
              ? 'bg-tertiary-container'
              : 'bg-surface-container-high'
            }`}>
            <MaterialIcons
              name={isClaimed ? 'pending' : isRedeemed ? 'check-circle' : 'cancel'}
              size={18}
              color={isClaimed ? '#7b5733' : isRedeemed ? '#16a34a' : '#85736f'}
            />
            <Text className={`font-bold text-sm uppercase tracking-wider ${isClaimed
              ? 'text-on-secondary-container'
              : isRedeemed
                ? 'text-on-tertiary-container'
                : 'text-on-surface-variant'
              }`}>
              {isClaimed ? 'Ready to Scan' : isRedeemed ? 'Redeemed' : redemption.status}
            </Text>
          </View>
        </AnimatedEntrance>

        {/* Rate CTA for redeemed */}
        {isRedeemed && (
          <AnimatedEntrance index={3} delay={400}>
            <AnimatedButton
              variant="gradient"
              className="mt-8 px-10 py-4 rounded-2xl"
              onPress={() => router.push({ pathname: '/(customer)/rate/[redemptionId]', params: { redemptionId: redemptionId! } } as any)}
            >
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="star" size={20} color="white" />
                <Text className="text-white font-headline font-bold text-base">Rate This Experience</Text>
              </View>
            </AnimatedButton>
          </AnimatedEntrance>
        )}

        {/* Instructions */}
        {isClaimed && (
          <AnimatedEntrance index={3} delay={400}>
            <View className="mt-8 p-5 rounded-2xl bg-surface-container-lowest border-outline-variant/10">
              <Text className="font-headline font-bold text-base text-on-surface mb-3">How to Redeem</Text>
              {[
                { icon: 'store', text: 'Visit the store location' },
                { icon: 'qr-code', text: 'Show this QR code to staff' },
                { icon: 'check-circle', text: 'Staff scans to confirm' },
                { icon: 'star', text: 'Rate your experience after' },
              ].map((step, i) => (
                <View key={i} className="flex-row items-center gap-3 mb-2">
                  <View className="w-8 h-8 rounded-md bg-primary/10 items-center justify-center">
                    <MaterialIcons name={step.icon as any} size={16} color="#862045" />
                  </View>
                  <Text className="text-on-surface-variant text-sm font-body flex-1">{step.text}</Text>
                </View>
              ))}
            </View>
          </AnimatedEntrance>
        )}
      </View>
    </View>
  );
}
