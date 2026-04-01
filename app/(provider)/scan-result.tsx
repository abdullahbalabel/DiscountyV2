import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';

export default function ScanResultScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { success, dealTitle, discountValue, discountType, redemptionId } = useLocalSearchParams<{
    success: string;
    dealTitle: string;
    discountValue: string;
    discountType: string;
    redemptionId: string;
  }>();

  const isSuccess = success === 'true';
  const formattedDiscount = discountType === 'percentage'
    ? `${discountValue}%`
    : `$${discountValue}`;

  return (
    <View className="flex-1 bg-surface items-center justify-center px-8">
      <AnimatedEntrance index={0} delay={100}>
        <View className="items-center">
          {/* Status Icon */}
          <View className={`w-32 h-32 rounded-full items-center justify-center mb-8 ${isSuccess
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-red-100 dark:bg-red-900/30'
            }`}>
            <MaterialIcons
              name={isSuccess ? 'check-circle' : 'cancel'}
              size={72}
              color={isSuccess ? '#16a34a' : '#dc2626'}
            />
          </View>

          {/* Title */}
          <Text className="font-headline font-black text-3xl text-on-surface text-center tracking-tight mb-3">
            {isSuccess ? 'Deal Redeemed!' : 'Scan Failed'}
          </Text>

          {/* Subtitle */}
          <Text className="text-on-surface-variant font-body text-base text-center leading-relaxed max-w-[280px]">
            {isSuccess
              ? 'The deal has been successfully redeemed for this customer.'
              : 'The QR code could not be validated. It may have already been used or expired.'}
          </Text>
        </View>
      </AnimatedEntrance>

      {/* Deal Details Card (success only) */}
      {isSuccess && dealTitle && (
        <AnimatedEntrance index={1} delay={200}>
          <View className="mt-8 w-full max-w-sm rounded-3xl p-6 bg-surface-container-lowest border-outline-variant/10">
            <View className="flex-row items-center gap-4 mb-4">
              <View className="w-12 h-12 rounded-2xl bg-primary/10 items-center justify-center">
                <MaterialIcons name="local-offer" size={24} color="#862045" />
              </View>
              <View className="flex-1">
                <Text className="font-headline font-bold text-base text-on-surface" numberOfLines={2}>
                  {dealTitle}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between pt-4 border-t border-outline-variant/10">
              <Text className="text-on-surface-variant text-sm">Discount Applied</Text>
              <View className="bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full">
                <Text className="text-green-700 dark:text-green-300 font-headline font-bold text-lg">
                  {formattedDiscount}
                </Text>
              </View>
            </View>
          </View>
        </AnimatedEntrance>
      )}

      {/* Actions */}
      <AnimatedEntrance index={2} delay={300}>
        <View className="mt-10 w-full max-w-sm gap-3">
          <AnimatedButton
            variant="gradient"
            className="py-4 rounded-2xl"
            onPress={() => router.replace('/(provider)/scan')}
          >
            <View className="flex-row items-center justify-center gap-2">
              <MaterialIcons name="qr-code-scanner" size={20} color="white" />
              <Text className="text-white font-headline font-bold text-base">Scan Another</Text>
            </View>
          </AnimatedButton>

          <AnimatedButton
            className="py-4 rounded-2xl border-outline-variant/20"
            onPress={() => router.replace('/(provider)/dashboard')}
          >
            <Text className="text-on-surface font-headline font-bold text-base text-center">
              Back to Dashboard
            </Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
