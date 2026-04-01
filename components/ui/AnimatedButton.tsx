import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Pressable, PressableProps, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

// Ensure Animated.View works with NativeWind className
cssInterop(Animated.View, { className: 'style' });
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: 'style' });

interface AnimatedButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: 'solid' | 'gradient' | 'outline' | 'navy';
  className?: string;
}

export function AnimatedButton({
  children,
  variant = 'solid',
  className = '',
  onPressIn,
  onPressOut,
  ...props
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);

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

  const getVariantStyles = () => {
    switch (variant) {
      case 'gradient':
        return 'overflow-hidden rounded-lg flex-row items-center justify-center shadow-[0_15px_30px_rgba(134,32,69,0.25)]';
      case 'navy':
        return 'bg-[#2c1600] rounded-lg flex-row items-center justify-center';
      case 'outline':
        return 'border-outline-variant bg-transparent rounded-lg flex-row items-center justify-center';
      default:
        return 'bg-primary rounded-lg flex-row items-center justify-center';
    }
  };

  const innerContent = (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`${getVariantStyles()} ${className}`}
      {...props}
    >
      {variant === 'gradient' ? (
        <>
          <LinearGradient
            colors={['#862045', '#a01840']}
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
