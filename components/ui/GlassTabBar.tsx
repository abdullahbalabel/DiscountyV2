import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View } from 'react-native';
import { useThemeColors } from '../../hooks/use-theme-colors';

export function GlassTabBar() {
  const colors = useThemeColors();

  const bg = colors.isDark
    ? `${colors.tabBarBg}d1`
    : 'rgba(255, 255, 255, 0.82)';
  const borderColor = colors.isDark
    ? 'rgba(168,153,152,0.08)'
    : 'rgba(0, 0, 0, 0.06)';

  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            backgroundColor: bg,
            borderTopColor: borderColor,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        ]}
      />
    );
  }

  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            overflow: 'hidden',
            backgroundColor: colors.tabBarBg,
            borderTopColor: borderColor,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
        ]}
      />
    );
  }

  return (
    <BlurView
      intensity={24}
      tint={colors.isDark ? 'dark' : 'light'}
      style={[
        StyleSheet.absoluteFill,
        {
          overflow: 'hidden',
          backgroundColor: bg,
          borderTopColor: borderColor,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      ]}
    />
  );
}
