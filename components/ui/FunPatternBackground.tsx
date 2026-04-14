import React, { useState, useCallback, useEffect } from 'react';
import Svg, { Defs, G, Path, Circle, Text, Rect, Pattern } from 'react-native-svg';
import { StyleSheet, View, Dimensions, Platform } from 'react-native';
import { useTheme } from '../../contexts/theme';

const LIGHT_COLOR = '#862045';
const DARK_COLOR = '#e07a95';
const TILE_W = 120;
const TILE_H = 100;

interface FunPatternBackgroundProps {
  children?: React.ReactNode;
}

/** Single tile defined once inside <Defs><Pattern> — the SVG renderer tiles it natively. */
function TileContent({ color, tileW, tileH }: { color: string; tileW: number; tileH: number }) {
  return (
    <>
      {/* Discount tag */}
      <G transform={`translate(${tileW * 0.08}, ${tileH * 0.05}) rotate(-18)`} opacity={0.07}>
        <Path d="M0 0 L18 0 L22 7 L22 18 L0 18 Z" fill={color} stroke={color} strokeWidth={0.4} />
        <Circle cx="15" cy="4" r="2" fill="white" opacity={0.6} />
        <Text x="3" y="14" fontSize="8" fill="white" fontWeight="bold">%</Text>
      </G>

      {/* Star */}
      <G transform={`translate(${tileW * 0.45}, ${tileH * 0.12}) rotate(15)`} opacity={0.06}>
        <Path d="M0 -7 L2 -2 L8 -2 L3 1.5 L5 8 L0 4 L-5 8 L-3 1.5 L-8 -2 L-2 -2 Z" fill={color} />
      </G>

      {/* Shopping cart */}
      <G transform={`translate(${tileW * 0.7}, ${tileH * 0.08}) rotate(-10)`} opacity={0.05}>
        <Path d="M2 3L5 3L9 16H18L22 7H7" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="10" cy="19" r="2" fill={color} />
        <Circle cx="19" cy="19" r="2" fill={color} />
      </G>

      {/* Coin */}
      <G transform={`translate(${tileW * 0.05}, ${tileH * 0.55}) rotate(20)`} opacity={0.06}>
        <Circle cx="7" cy="7" r="7" fill={color} />
        <Text x="3.5" y="11" fontSize="8" fill="white" fontWeight="bold">$</Text>
      </G>

      {/* Gift box */}
      <G transform={`translate(${tileW * 0.55}, ${tileH * 0.45}) rotate(12)`} opacity={0.05}>
        <Rect x="0" y="4" width="18" height="14" rx="2" fill={color} />
        <Path d="M9 4 L9 0 Q12 2 15 0 L15 4" stroke={color} strokeWidth={1.5} fill="none" />
        <Path d="M0 10 L18" stroke="white" strokeWidth={1.5} opacity={0.5} />
      </G>

      {/* Winking face */}
      <G transform={`translate(${tileW * 0.3}, ${tileH * 0.55}) rotate(5)`} opacity={0.04}>
        <Circle cx="10" cy="10" r="9" fill={color} />
        <Circle cx="6" cy="8" r="1.5" fill="white" />
        <Path d="M12 7 Q14.5 5 17 7" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" />
        <Path d="M4 13 Q10 18 16 13" stroke="white" strokeWidth={1.5} fill="none" strokeLinecap="round" />
      </G>

      {/* Small star */}
      <G transform={`translate(${tileW * 0.82}, ${tileH * 0.35}) rotate(-25)`} opacity={0.05}>
        <Path d="M0 -4 L1.2 -1.2 L4.8 -1.2 L1.8 1.2 L3 4.8 L0 2.4 L-3 4.8 L-1.8 1.2 L-4.8 -1.2 L-1.2 -1.2 Z" fill={color} />
      </G>

      {/* Percent small */}
      <G transform={`translate(${tileW * 0.1}, ${tileH * 0.82}) rotate(15)`} opacity={0.04}>
        <Text x="0" y="0" fontSize="12" fill={color} fontWeight="bold">%</Text>
      </G>
    </>
  );
}

export function FunPatternBackground({ children }: FunPatternBackgroundProps) {
  const { isDark } = useTheme();
  const color = isDark ? DARK_COLOR : LIGHT_COLOR;
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize({ w: width, h: height });
    }
  }, []);

  useEffect(() => {
    const { width, height } = Dimensions.get('window');
    if (width > 0 && height > 0 && size.w === 0) {
      setSize({ w: width, h: height });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Android: react-native-svg crashes Expo Go when rendering the tile grid
  // (too many elements) or even a <Pattern> definition.  Skip the SVG
  // entirely — the pattern is decorative and the app looks fine without it.
  // Return null when no children so the component takes zero layout space
  // (ScreenWrapper, GlassHeader, AnimatedTabBar all call without children).
  if (Platform.OS === 'android') {
    return children ? (
      <View style={styles.container}>
        <View style={styles.content}>{children}</View>
      </View>
    ) : null;
  }

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
        {size.w > 0 && (
          <Svg width={size.w} height={size.h}>
            <Defs>
              <Pattern
                id="funTile"
                x="0"
                y="0"
                width={TILE_W}
                height={TILE_H}
                patternUnits="userSpaceOnUse"
              >
                <TileContent color={color} tileW={TILE_W} tileH={TILE_H} />
              </Pattern>
            </Defs>
            <Rect
              x="0"
              y="0"
              width={size.w}
              height={size.h}
              fill="url(#funTile)"
            />
          </Svg>
        )}
      </View>
      {children && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
});
