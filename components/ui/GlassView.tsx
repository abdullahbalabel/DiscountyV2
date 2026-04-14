import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, View, ViewProps } from 'react-native';
import { useTheme } from '../../contexts/theme';

interface GlassViewProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassView({
  children,
  intensity = 30,
  tint,
  style,
  ...props
}: GlassViewProps) {
  const { isDark } = useTheme();
  const defaultTint = isDark ? 'dark' : 'light';

  const webStyle = Platform.OS === 'web' ? {
    backdropFilter: `blur(${intensity}px)`,
    WebkitBackdropFilter: `blur(${intensity}px)`,
    backgroundColor: isDark
      ? 'rgba(30, 39, 46, 0.75)'
      : 'rgba(255, 255, 255, 0.75)',
  } : {};

  if (Platform.OS === 'web') {
    return (
      <View
        style={[{ overflow: 'hidden' }, webStyle, style]}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={tint || defaultTint}
      style={[
        {
          overflow: 'hidden',
          backgroundColor: isDark
            ? 'rgba(30, 39, 46, 0.75)'
            : 'rgba(255, 255, 255, 0.75)',
        },
        style,
      ]}
      {...props}
    >
      {children}
    </BlurView>
  );
}
