import React from 'react';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, ViewProps, useColorScheme } from 'react-native';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        {children}
      </View>
    );
  }

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
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
