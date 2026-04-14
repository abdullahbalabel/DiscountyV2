import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Semantic } from '../../constants/theme';
import { useThemeColors } from '../../hooks/use-theme-colors';

interface CircularProgressProps {
  progress: number; // 0 to 1
  size: number;
  strokeWidth: number;
  daysLeft: number;
}

export function CircularProgress({ progress, size, strokeWidth, daysLeft }: CircularProgressProps) {
  const colors = useThemeColors();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);
  const center = size / 2;

  const trackColor = colors.outlineVariant;
  const progressColor = progress > 0.5 ? Semantic.success : progress > 0.25 ? Semantic.warning : Semantic.error;
  const textColor = colors.onSurface;
  const subColor = colors.onSurfaceVariant;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation={-90}
          originX={center}
          originY={center}
        />
      </Svg>
      <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: size * 0.28, color: textColor }}>
        {daysLeft}
      </Text>
      <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: size * 0.1, color: subColor, textTransform: 'uppercase', letterSpacing: 1, marginTop: -2 }}>
        {daysLeft === 1 ? 'day' : 'days'}
      </Text>
    </View>
  );
}
