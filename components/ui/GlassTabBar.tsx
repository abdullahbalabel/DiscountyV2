import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

interface GlassTabBarProps {
  isDark?: boolean;
}

export function GlassTabBar({ isDark }: GlassTabBarProps) {
  const colorScheme = useColorScheme();
  const dark = isDark ?? colorScheme === 'dark';

  const bg = dark ? 'rgba(39, 29, 27, 0.82)' : 'rgba(255, 255, 255, 0.82)';
  const borderColor = dark
    ? 'rgba(255, 255, 255, 0.08)'
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
            backgroundColor: dark ? '#271d1b' : '#ffffff',
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
      tint={dark ? 'dark' : 'light'}
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
