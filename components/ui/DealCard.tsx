import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { resolveMaterialIcon } from '../../lib/iconMapping';

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
  isSaved?: boolean;
  onToggleSave?: () => void;
  onPress: () => void;
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
  isSaved,
  onToggleSave,
  onPress,
}: DealCardProps) {
  return (
    <AnimatedButton
      variant="solid"
      onPress={onPress}
      style={{
        padding: 0,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ width: '100%' }}>
        {/* Image Section */}
        <View style={{ position: 'relative', width: '100%', height: 140 }}>
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
          <View style={{
            position: 'absolute', top: 10, right: 10,
            backgroundColor: '#862045', paddingHorizontal: 12, paddingVertical: 4,
            borderRadius: 10, zIndex: 10,
            shadowColor: '#862045', shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3, shadowRadius: 20, elevation: 6,
          }}>
            <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 12 }}>
              {discountBadge}
            </Text>
          </View>

          {/* Time Left Badge */}
          {endTime && (
            <View style={{
              position: 'absolute', top: 10, left: 10,
              backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4,
              borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <MaterialIcons name="timer" size={10} color="white" />
              <Text style={{ color: '#fff', fontFamily: 'Manrope', fontSize: 9, fontWeight: '700', textTransform: 'uppercase' }}>
                {formatTimeLeft(endTime)}
              </Text>
            </View>
          )}

          {/* Bookmark Button */}
          {onToggleSave && (
            <AnimatedButton
              onPress={onToggleSave}
              style={{
                position: 'absolute', bottom: 10, right: 10,
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? '#f59e0b' : 'white'} />
            </AnimatedButton>
          )}

          {/* Category Tag */}
          {categoryName && (
            <View style={{
              position: 'absolute', bottom: 10, left: 10,
              backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2,
              borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              {categoryIcon && (
                <MaterialIcons name={resolveMaterialIcon(categoryIcon)} size={10} color="white" />
              )}
              <Text style={{
                color: '#fff', fontFamily: 'Manrope', fontSize: 9, fontWeight: '700',
                textTransform: 'uppercase', letterSpacing: 1.5,
              }}>
                {categoryName}
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={{ padding: 12, backgroundColor: '#fff' }}>
          {/* Provider Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            {providerLogo ? (
              <Image
                source={{ uri: providerLogo }}
                style={{ width: 16, height: 16, borderRadius: 4 }}
                contentFit="cover"
              />
            ) : null}
            <Text style={{
              color: '#862045', fontWeight: '700', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}>
              {provider}
            </Text>
            {rating != null && rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
                <MaterialIcons name="star" size={10} color="#f59e0b" />
                <Text style={{ color: '#564340', fontSize: 9, fontWeight: '700' }}>
                  {rating.toFixed(1)}
                </Text>
                {reviewCount != null && (
                  <Text style={{ color: '#564340', fontSize: 9 }}>
                    ({reviewCount})
                  </Text>
                )}
              </View>
            )}
          </View>

          <Text style={{
            fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14,
            color: '#231917', marginBottom: 4,
          }}>
            {title}
          </Text>

          <Text
            style={{
              color: '#7b5733', fontSize: 12, fontFamily: 'Manrope',
              marginBottom: 10,
            }}
            numberOfLines={2}
          >
            {description || 'Exclusive deal. Limited stock available for discerning shoppers.'}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              {currentPrice && (
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#231917' }}>
                  {currentPrice}
                </Text>
              )}
              {originalPrice && (
                <Text style={{ color: '#7b5733', fontSize: 12, textDecorationLine: 'line-through' }}>
                  {originalPrice}
                </Text>
              )}
            </View>
            <View style={{
              backgroundColor: '#862045', width: 28, height: 28,
              borderRadius: 8, alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialIcons name="arrow-forward" size={14} color="white" />
            </View>
          </View>
        </View>
      </View>
    </AnimatedButton>
  );
}
