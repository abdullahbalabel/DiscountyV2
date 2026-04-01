import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedButton } from './AnimatedButton';

interface DealCardProps {
  id: string;
  title: string;
  provider: string;
  providerLogo?: string | null;
  imageUri: string;
  discountBadge: string;
  description?: string;
  categoryName?: string;
  categoryIcon?: string;
  currentPrice?: string;
  originalPrice?: string;
  rating?: number;
  reviewCount?: number;
  endTime?: string;
  onPress: () => void;
  className?: string;
}

function formatTimeLeft(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor(diff / (1000 * 60));
  return `${mins}m left`;
}

export function DealCard({
  title,
  provider,
  providerLogo,
  imageUri,
  discountBadge,
  description,
  categoryName,
  categoryIcon,
  currentPrice,
  originalPrice,
  rating,
  reviewCount,
  endTime,
  onPress,
  className = '',
}: DealCardProps) {
  return (
    <AnimatedButton
      variant="solid"
      onPress={onPress}
      className={`relative rounded-md overflow-hidden bg-surface-container-lowest shadow-sm mb-3 ${className}`}
      style={{ padding: 0 }}
    >
      <View className="w-full flex-col">
        <View className="relative w-full h-[140px]">
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={StyleSheet.absoluteFillObject}
          />
          {/* Discount Badge */}
          <View className="absolute top-2.5 right-2.5 bg-primary px-3 py-1 rounded-lg z-10 shadow-[0_10px_20px_rgba(134,32,69,0.3)]">
            <Text className="text-white font-headline font-bold text-xs">
              {discountBadge}
            </Text>
          </View>

          {/* Time Left Badge */}
          {endTime && (
            <View className="absolute top-2.5 left-2.5 bg-black/50 px-2 py-1 rounded-md flex-row items-center gap-1">
              <MaterialIcons name="timer" size={10} color="white" />
              <Text className="text-white font-label text-[9px] font-bold uppercase">
                {formatTimeLeft(endTime)}
              </Text>
            </View>
          )}

          {/* Category Tag */}
          {categoryName && (
            <View className="absolute bottom-2.5 left-2.5 bg-white/20 px-2 py-0.5 rounded-md flex-row items-center gap-1">
              {categoryIcon && (
                <MaterialIcons name={categoryIcon as any} size={10} color="white" />
              )}
              <Text className="text-white font-label text-[9px] font-bold uppercase tracking-wider">
                {categoryName}
              </Text>
            </View>
          )}
        </View>

        <View className="p-3 bg-surface-container-lowest">
          {/* Provider Row */}
          <View className="flex-row items-center gap-1.5 mb-1">
            {providerLogo ? (
              <Image
                source={{ uri: providerLogo }}
                className="w-4 h-4 rounded-md"
                contentFit="cover"
              />
            ) : null}
            <Text className="text-primary font-bold text-[9px] uppercase tracking-[0.15em]">
              {provider}
            </Text>
            {rating != null && rating > 0 && (
              <View className="flex-row items-center gap-0.5 ml-auto">
                <MaterialIcons name="star" size={10} color="#f59e0b" />
                <Text className="text-on-surface-variant text-[9px] font-bold">
                  {rating.toFixed(1)}
                </Text>
                {reviewCount != null && (
                  <Text className="text-on-surface-variant text-[9px]">
                    ({reviewCount})
                  </Text>
                )}
              </View>
            )}
          </View>

          <Text className="font-headline font-bold text-sm text-on-surface mb-1">{title}</Text>

          <Text className="text-secondary text-xs mb-2.5 font-body" numberOfLines={2}>
            {description || 'Exclusive deal. Limited stock available for discerning shoppers.'}
          </Text>

          <View className="flex-row items-center justify-between">
            <View className="flex-row items-baseline gap-1.5">
              {currentPrice && (
                <Text className="text-base font-bold text-on-surface">{currentPrice}</Text>
              )}
              {originalPrice && (
                <Text className="text-secondary line-through text-xs">{originalPrice}</Text>
              )}
            </View>
            <View className="bg-primary w-7 h-7 rounded-md flex items-center justify-center">
              <MaterialIcons name="arrow-forward" size={14} color="white" />
            </View>
          </View>
        </View>
      </View>
    </AnimatedButton>
  );
}
