import React from 'react';
import { BlurView, BlurViewProps } from 'expo-blur';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useColorScheme } from 'react-native';
import { cssInterop } from 'nativewind';

cssInterop(BlurView, { className: 'style' });

interface GlassViewProps extends ViewProps {
  children: React.ReactNode;
  intensity?: number;
  className?: string;
  tint?: 'light' | 'dark' | 'default';
}

export function GlassView({
  children,
  intensity = 30,
  tint,
  style,
  className,
  ...props
}: GlassViewProps) {
  const colorScheme = useColorScheme();
  const defaultTint = colorScheme === 'dark' ? 'dark' : 'light';

  return (
    <BlurView
      intensity={intensity}
      tint={tint || defaultTint}
      className={`overflow-hidden ${className || ''}`}
      style={[
        {
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(30, 39, 46, 0.75)'  // Dark Navy with opacity
            : 'rgba(255, 255, 255, 0.75)', // White with opacity
        },
        style,
      ]}
      {...props}
    >
      {children}
    </BlurView>
  );
}
