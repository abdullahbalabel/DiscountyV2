import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Pressable, PressableProps, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps extends PressableProps {
  children: React.ReactNode;
  variant?: 'solid' | 'gradient' | 'outline' | 'navy';
}

const variantStyles: Record<string, ViewStyle> = {
  solid: {
    backgroundColor: '#862045',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    overflow: 'hidden',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#862045',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
  navy: {
    backgroundColor: '#2c1600',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d8c2bd',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export function AnimatedButton({
  children,
  variant = 'solid',
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

  const innerContent = (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={variantStyles[variant]}
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
