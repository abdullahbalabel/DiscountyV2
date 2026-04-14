import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useThemeColors } from '../../hooks/use-theme-colors';
import { FunPatternBackground } from './FunPatternBackground';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const colors = useThemeColors();

  return (
    <View style={[{ flex: 1, backgroundColor: colors.surfaceBg }, style]}>
      <FunPatternBackground />
      {children}
    </View>
  );
}
