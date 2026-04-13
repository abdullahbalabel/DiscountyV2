import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from './AnimatedButton';
import { useThemeColors, Radius, Shadows, Spacing } from '../../hooks/use-theme-colors';

const IMAGE_HEIGHT = 200;

interface FeaturedDealCardProps {
  id: string;
  title: string;
  provider: string;
  providerLogo?: string | null;
  providerBadge?: string | null;
  providerBadgeAr?: string | null;
  imageUri: string;
  discountBadge: string;
  description?: string;
  categoryName?: string;
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

export function FeaturedDealCard({
  title,
  provider,
  providerLogo,
  providerBadge,
  providerBadgeAr,
  imageUri,
  discountBadge,
  description,
  categoryName,
  endTime,
  isSaved,
  onToggleSave,
  onPress,
}: FeaturedDealCardProps) {
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        backgroundColor: colors.surfaceContainerLowest,
        ...Shadows.lg,
      }}
    >
      <View style={{ width: '100%' }}>
        {/* Hero Image */}
        <View style={{ position: 'relative', width: '100%', height: IMAGE_HEIGHT }}>
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
            transition={200}
          />

          {/* Dark gradient overlay — bottom half */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            locations={[0.2, 0.85]}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Top-left: Time Left */}
          {endTime && (
            <View style={{
              position: 'absolute', top: Spacing.xl, start: Spacing.xl,
              backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 5,
              borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', gap: 4,
            }}>
              <MaterialIcons name="timer" size={12} color="white" />
              <Text style={{
                color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 11,
                textTransform: 'uppercase',
              }}>
                {formatTimeLeft(endTime, t)}
              </Text>
            </View>
          )}

          {/* Top-right: Discount badge */}
          <View style={{
            position: 'absolute', top: Spacing.xl, end: Spacing.xl,
            backgroundColor: colors.primary, paddingHorizontal: 14, paddingVertical: 6,
            borderRadius: Radius.lg,
            ...Shadows.badge,
          }}>
            <Text style={{
              color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 15,
            }}>
              {discountBadge}
            </Text>
          </View>

          {/* Top-right below badge: Category tag */}
          {categoryName && (
            <View style={{
              position: 'absolute', top: Spacing.xl + 40, end: Spacing.xl,
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: Spacing.sm, paddingVertical: 3,
              borderRadius: Radius.sm,
            }}>
              <Text style={{
                color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: 1,
              }}>
                {categoryName}
              </Text>
            </View>
          )}

          {/* Bookmark button */}
          {onToggleSave && (
            <AnimatedButton
              onPress={onToggleSave}
              style={{
                position: 'absolute', top: Spacing.xl + 36, start: Spacing.xl,
                width: 32, height: 32, borderRadius: Radius.full,
                backgroundColor: 'rgba(0,0,0,0.45)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <MaterialIcons
                name={isSaved ? 'bookmark' : 'bookmark-border'}
                size={18}
                color={isSaved ? colors.warning : 'white'}
              />
            </AnimatedButton>
          )}

          {/* Bottom overlay: Provider + Title + Description */}
          <View style={{
            position: 'absolute', bottom: 0, start: 0, end: 0,
            paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl,
          }}>
            {/* Provider row */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6,
            }}>
              {providerLogo ? (
                <Image
                  source={{ uri: providerLogo }}
                  style={{ width: 20, height: 20, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }}
                  contentFit="cover"
                />
              ) : null}
              <Text style={{
                color: 'rgba(255,255,255,0.9)', fontFamily: 'Cairo_700Bold',
                fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2,
              }}>
                {provider}
              </Text>
              {providerBadge && (
                <View style={{
                  backgroundColor: colors.primary, paddingHorizontal: 6, paddingVertical: 1,
                  borderRadius: Radius.sm,
                }}>
                  <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 8 }}>
                    {i18n.language === 'ar' ? (providerBadgeAr || providerBadge) : providerBadge}
                  </Text>
                </View>
              )}
            </View>

            {/* Title */}
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 18,
              color: '#fff', marginBottom: 4, letterSpacing: -0.3,
            }} numberOfLines={2}>
              {title}
            </Text>

            {/* Description */}
            {description && (
              <Text style={{
                color: 'rgba(255,255,255,0.75)', fontFamily: 'Cairo',
                fontSize: 12, lineHeight: 18,
              }} numberOfLines={2}>
                {description}
              </Text>
            )}
          </View>
        </View>

        {/* Bottom content area — CTA */}
        <View style={{
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.md,
          backgroundColor: colors.surfaceContainerLowest,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Featured label */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
          }}>
            <MaterialIcons name="star" size={14} color={colors.warning} />
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 11,
              color: colors.warning,
            }}>
              {t('provider.featuredToggle')}
            </Text>
          </View>

          {/* View Deal CTA */}
          <AnimatedButton
            variant="gradient"
            onPress={onPress}
            style={{
              paddingHorizontal: Spacing.lg,
              paddingVertical: Spacing.sm,
              borderRadius: Radius.full,
            }}
          >
            <Text style={{
              color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 12,
              marginEnd: 4,
            }}>
              {t('deal.viewDeal')}
            </Text>
            <MaterialIcons name="arrow-forward" size={14} color="#fff" />
          </AnimatedButton>
        </View>
      </View>
    </Pressable>
  );
}
