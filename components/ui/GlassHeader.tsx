import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '../../contexts/theme';
import { FunPatternBackground } from './FunPatternBackground';

interface GlassHeaderProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export function GlassHeader({
  children,
  intensity = 40,
  style,
  ...props
}: GlassHeaderProps) {
  const { isDark } = useTheme();

  const backgroundColor = isDark
    ? 'rgba(26, 17, 15, 0.72)'
    : 'rgba(255, 248, 246, 0.72)';

  const borderColor = isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.06)';

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.container,
          {
            backdropFilter: `blur(${intensity}px)`,
            WebkitBackdropFilter: `blur(${intensity}px)`,
            backgroundColor,
            borderBottomColor: borderColor,
          },
          style,
        ]}
        {...props}
      >
        <FunPatternBackground />
        {children}
      </View>
    );
  }

  // Android: BlurView has limited support — use solid View instead.
  if (Platform.OS === 'android') {
    const solidBg = isDark ? 'rgba(26, 17, 15, 0.95)' : 'rgba(255, 248, 246, 0.95)';
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: solidBg,
            borderBottomColor: borderColor,
          },
          style,
        ]}
        {...props}
      >
        {children}
      </View>
    );
  }

  // iOS: BlurView works well
  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      style={[
        styles.container,
        { backgroundColor, borderBottomColor: borderColor },
        style,
      ]}
      {...props}
    >
      <FunPatternBackground />
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
