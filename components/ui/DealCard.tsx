import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from './AnimatedButton';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';

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

function formatTimeLeft(endTime: string, t: (key: string, options?: any) => string): string {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return t('deal.expired');
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return t('deal.daysLeft', { count: days });
  if (hours > 0) return t('deal.hoursLeft', { count: hours });
  const mins = Math.floor(diff / (1000 * 60));
  return t('deal.minsLeft', { count: mins });
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
  const colors = useThemeColors();
  const { t } = useTranslation();

  return (
    <AnimatedButton
      variant="solid"
      onPress={onPress}
      style={{
        padding: 0,
        borderRadius: Radius.lg,
        overflow: 'hidden',
        backgroundColor: colors.surfaceContainerLowest,
        marginBottom: 12,
        ...Shadows.sm,
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
            position: 'absolute', top: 10, end: 10,
            backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4,
            borderRadius: Radius.lg, zIndex: 10,
            ...Shadows.badge,
          }}>
            <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 12 }}>
              {discountBadge}
            </Text>
          </View>

          {/* Time Left Badge */}
          {endTime && (
            <View style={{
              position: 'absolute', top: 10, start: 10,
              backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 8, paddingVertical: 4,
              borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <MaterialIcons name="timer" size={10} color="white" />
              <Text style={{ color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 9, textTransform: 'uppercase' }}>
                {formatTimeLeft(endTime, t)}
              </Text>
            </View>
          )}

          {/* Bookmark Button */}
          {onToggleSave && (
            <AnimatedButton
              onPress={onToggleSave}
              style={{
                position: 'absolute', bottom: 10, end: 10,
                width: 28, height: 28, borderRadius: Radius.full,
                backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? colors.warning : 'white'} />
            </AnimatedButton>
          )}

          {/* Category Tag */}
          {categoryName && (
            <View style={{
              position: 'absolute', bottom: 10, start: 10,
              backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2,
              borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              {categoryIcon && (
                <MaterialIcons name={resolveMaterialIcon(categoryIcon)} size={10} color="white" />
              )}
              <Text style={{
                color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: 1.5,
              }}>
                {categoryName}
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={{ padding: 12, backgroundColor: colors.surfaceContainerLowest }}>
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
              color: colors.isDark ? '#d4a0b0' : colors.primary, fontWeight: '700', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}>
              {provider}
            </Text>
            {rating != null && rating > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginStart: 'auto' }}>
                <MaterialIcons name="star" size={10} color={colors.warning} />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 9, fontWeight: '700' }}>
                  {rating.toFixed(1)}
                </Text>
                {reviewCount != null && (
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 9 }}>
                    ({reviewCount})
                  </Text>
                )}
              </View>
            )}
          </View>

          <Text style={{
            fontFamily: 'Cairo_700Bold', fontSize: 14,
            color: colors.onSurface, marginBottom: 4,
          }}>
            {title}
          </Text>

          <Text
            style={{
              color: colors.isDark ? colors.onSurfaceVariant : colors.brown, fontSize: 12, fontFamily: 'Cairo',
              marginBottom: 10,
            }}
            numberOfLines={2}
          >
            {description || t('deal.defaultDescription')}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              {currentPrice && (
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.onSurface }}>
                  {currentPrice}
                </Text>
              )}
              {originalPrice && (
                <Text style={{ color: colors.isDark ? colors.onSurfaceVariant : colors.brown, fontSize: 12, textDecorationLine: 'line-through' }}>
                  {originalPrice}
                </Text>
              )}
            </View>
            <View style={{
              backgroundColor: colors.primary, width: 28, height: 28,
              borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
            }}>
              <MaterialIcons name="arrow-forward" size={14} color="white" />
            </View>
          </View>
        </View>
      </View>
    </AnimatedButton>
  );
}
