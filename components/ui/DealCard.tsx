import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from './AnimatedButton';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { getBusinessHoursStatus } from '../../lib/business-hours';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';

interface DealCardProps {
  id: string;
  title: string;
  provider: string;
  providerLogo?: string | null;
  providerBadge?: string | null;
  providerBadgeAr?: string | null;
  businessHours?: Record<string, unknown> | null;
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
  isFeatured?: boolean;
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
  providerBadge,
  providerBadgeAr,
  businessHours,
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
  isFeatured,
  isSaved,
  onToggleSave,
  onPress,
}: DealCardProps) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const status = getBusinessHoursStatus(businessHours, t);

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
        <View style={{ position: 'relative', width: '100%', height: 105 }}>
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
              <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 9, textTransform: 'uppercase' }}>
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
              <MaterialIcons name={isSaved ? 'bookmark' : 'bookmark-border'} size={16} color={isSaved ? colors.warning : colors.onPrimary} />
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
                <MaterialIcons name={resolveMaterialIcon(categoryIcon)} size={10} color={colors.onPrimary} />
              )}
              <Text style={{
                color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: 1.5,
              }}>
                {categoryName}
              </Text>
            </View>
          )}

          {/* Featured Badge */}
          {isFeatured && (
            <View style={{
              position: 'absolute', bottom: categoryName ? 42 : 10, start: 10,
              backgroundColor: 'rgba(255,215,0,0.9)', borderRadius: Radius.sm,
              paddingHorizontal: 6, paddingVertical: 3,
              flexDirection: 'row', alignItems: 'center', gap: 3,
            }}>
              <MaterialIcons name="star" size={10} color={colors.primary} />
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 8, color: colors.primary }}>
                {t('provider.featuredToggle')}
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={{ padding: 9, backgroundColor: colors.surfaceContainerLowest }}>
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
              color: colors.onSurfaceVariant, fontWeight: '700', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: 1.5,
            }}>
              {provider}
            </Text>
            {providerBadge && (
              <View style={{
                backgroundColor: colors.primary, paddingHorizontal: 5, paddingVertical: 1,
                borderRadius: Radius.sm,
              }}>
                <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 7 }}>
                  {i18n.language === 'ar' ? (providerBadgeAr || providerBadge) : providerBadge}
                </Text>
              </View>
            )}
            {status && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 3,
                backgroundColor: status.isOpen ? colors.successBg : colors.errorBgDark,
                paddingHorizontal: 6, paddingVertical: 1, borderRadius: Radius.sm,
              }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: status.isOpen ? colors.success : colors.error }} />
                <Text style={{
                  fontFamily: 'Cairo_700Bold', fontSize: 8,
                  color: status.isOpen ? colors.successText : colors.error,
                }}>
                  {status.isOpen ? t('provider.open') : t('provider.closed')}
                </Text>
              </View>
            )}
            {status?.nextChange ? (
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 8, fontFamily: 'Cairo' }}>
                · {status.nextChange}
              </Text>
            ) : null}
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
            fontFamily: 'Cairo_700Bold', fontSize: 12,
            color: colors.onSurface, marginBottom: 2,
          }}>
            {title}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text
              style={{
                flex: 1,
                color: colors.isDark ? colors.onSurfaceVariant : colors.brown, fontSize: 10, fontFamily: 'Cairo',
              }}
              numberOfLines={1}
            >
              {description || t('deal.defaultDescription')}
            </Text>
            <View style={{
              backgroundColor: colors.primary, width: 24, height: 24,
              borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center',
              marginStart: 8,
            }}>
              <MaterialIcons name="arrow-forward" size={12} color={colors.onPrimary} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              {currentPrice && (
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.onSurface }}>
                  {currentPrice}
                </Text>
              )}
              {originalPrice && (
                <Text style={{ color: colors.isDark ? colors.onSurfaceVariant : colors.brown, fontSize: 10, textDecorationLine: 'line-through' }}>
                  {originalPrice}
                </Text>
              )}
            </View>
        </View>
      </View>
    </AnimatedButton>
  );
}
