import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { AnimatedButton } from './AnimatedButton';
import { AnimatedEntrance } from './AnimatedEntrance';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';

interface EmptyStateProps {
  /** Material icon name */
  icon: keyof typeof MaterialIcons.glyphMap;
  /** Bold heading text */
  title: string;
  /** Descriptive body text */
  message: string;
  /** Optional CTA button label */
  ctaLabel?: string;
  /** Optional CTA button press handler */
  onCtaPress?: () => void;
  /** Use primary color for icon instead of muted */
  primaryIcon?: boolean;
}

/**
 * Standardized empty state component.
 *
 * Design spec:
 *   - Icon container: 72×72, circular (Radius.full)
 *   - Icon size: 32
 *   - Title: Cairo 700, size 18
 *   - Body: Cairo 400, size 13, lineHeight 20
 *   - Optional gradient CTA pill
 */
export function EmptyState({ icon, title, message, ctaLabel, onCtaPress, primaryIcon }: EmptyStateProps) {
  const colors = useThemeColors();

  const floatY = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  return (
    <AnimatedEntrance index={0}>
      <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
        {/* Icon Container */}
        <Animated.View style={animatedStyle}>
          <View style={{
            width: 72, height: 72, borderRadius: Radius.full,
            alignItems: 'center', justifyContent: 'center', marginBottom: 20,
            backgroundColor: primaryIcon ? 'rgba(134,32,69,0.1)' : colors.surfaceContainerHigh,
          }}>
            <MaterialIcons
              name={icon}
              size={32}
              color={primaryIcon ? colors.primary : colors.iconDefault}
            />
          </View>
        </Animated.View>

        {/* Title */}
        <Text style={{
          fontFamily: 'Cairo', fontWeight: '700', fontSize: 18,
          color: colors.onSurface, textAlign: 'center', marginBottom: 8,
        }}>
          {title}
        </Text>

        {/* Body */}
        <Text style={{
          fontFamily: 'Cairo', color: colors.onSurfaceVariant,
          textAlign: 'center', fontSize: 13, lineHeight: 20, maxWidth: 280,
        }}>
          {message}
        </Text>

        {/* Optional CTA */}
        {ctaLabel && onCtaPress && (
          <AnimatedButton
            variant="gradient"
            style={{
              marginTop: 20, paddingHorizontal: 24, paddingVertical: 10,
              borderRadius: Radius.full, flexDirection: 'row', alignItems: 'center', gap: 8,
            }}
            onPress={onCtaPress}
          >
            <Text style={{ color: '#fff', fontFamily: 'Cairo', fontWeight: '700', fontSize: 14 }}>
              {ctaLabel}
            </Text>
          </AnimatedButton>
        )}
      </View>
    </AnimatedEntrance>
  );
}
