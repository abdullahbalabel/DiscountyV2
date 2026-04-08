import React from 'react';
import Svg, { Circle, G, Path, Rect, Defs, ClipPath } from 'react-native-svg';

interface LogoProps {
  size?: number;
  color?: string;
}

export function Logo({ size = 48, color = '#8B0000' }: LogoProps) {
  const scale = size / 100;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="48" fill="white" stroke="#f0f0f0" strokeWidth="0.5" />
      <G fill={color}>
        <Path d="M38 22C35.7909 22 34 23.7909 34 26V74C34 76.2091 35.7909 78 38 78H62C64.2091 78 66 76.2091 66 74V26C66 23.7909 64.2091 22 62 22H38ZM37 26H63V71H37V26ZM46 73H54V75H46V73Z" />
        <G transform="rotate(-15, 50, 50)">
          <Path d="M38 42C38 39.7909 39.7909 38 42 38H65C67.2091 38 69 39.7909 69 42V56C69 58.2091 67.2091 60 65 60H42C39.7909 60 38 58.2091 38 56V42Z" stroke="white" strokeWidth="2" />
          <Circle cx="46" cy="45" r="2.5" fill="white" />
          <Rect x="44" y="53" width="12" height="2" transform="rotate(-45, 44, 53)" fill="white" />
          <Circle cx="58" cy="53" r="2.5" fill="white" />
        </G>
        <Path d="M72 32L73.5 35.5L77 37L73.5 38.5L72 42L70.5 38.5L67 37L70.5 35.5L72 32Z" fill={color} />
      </G>
    </Svg>
  );
}