import React, { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ViewProps } from 'react-native';

interface AnimatedEntranceProps extends ViewProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
}

export function AnimatedEntrance({
  children,
  index = 0,
  delay = 100,
  style,
  ...props
}: AnimatedEntranceProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(
      index * delay,
      withTiming(1, { duration: 400 })
    );
    translateY.value = withDelay(
      index * delay,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View style={[animatedStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
