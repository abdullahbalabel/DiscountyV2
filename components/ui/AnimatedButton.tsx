import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo } from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: 'solid' | 'gradient' | 'outline' | 'navy';
}

export function AnimatedButton({
  children,
  variant = 'solid',
  onPressIn,
  onPressOut,
  style,
  ...props
}: AnimatedButtonProps) {
  const colors = useThemeColors();
  const scale = useSharedValue(1);

  const variantStyles: Record<string, ViewStyle> = useMemo(() => ({
    solid: {
      backgroundColor: colors.primary,
      borderRadius: Radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gradient: {
      overflow: 'hidden',
      borderRadius: Radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.glow,
    },
    navy: {
      backgroundColor: colors.inverseSurface,
      borderRadius: Radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.onSurfaceVariant,
      borderRadius: Radius.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }), [colors]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    if (onPressOut) onPressOut(e);
  };

  const innerContent = (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[variantStyles[variant], style]}
      {...props}
    >
      {variant === 'gradient' ? (
        <>
          <LinearGradient
            colors={colors.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          {children}
        </>
      ) : (
        children
      )}
    </AnimatedPressable>
  );

  return (
    <Animated.View style={animatedStyle}>
      {innerContent}
    </Animated.View>
  );
}
