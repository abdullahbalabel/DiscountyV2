import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';

export default function ProviderReviewsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
        <Text className="font-headline font-bold tracking-tight text-xl text-on-surface">
          Reviews
        </Text>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <AnimatedEntrance index={0}>
          <View className="items-center">
            <View className="w-28 h-28 rounded-full items-center justify-center mb-6 bg-surface-container-high">
              <MaterialIcons name="rate-review" size={56} color="#7b5733" />
            </View>
            <Text className="font-headline font-bold text-2xl text-on-surface text-center mb-3">
              No Reviews Yet
            </Text>
            <Text className="font-body text-on-surface-variant text-center text-base leading-6 max-w-[280px]">
              Customer reviews will appear here after they redeem your deals.
            </Text>
          </View>
        </AnimatedEntrance>
      </View>
    </View>
  );
}
