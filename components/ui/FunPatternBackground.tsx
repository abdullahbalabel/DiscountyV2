import React, { memo, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/theme';

const LIGHT_COLOR = '#862045';
const DARK_COLOR = '#e07a95';

/** Icon names themed around fun, entertainment, shopping, discounts & food. */
const ICONS: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
  'tag-outline',              // discount
  'pizza',                    // food
  'star-outline',             // star
  'coffee',                   // food
  'cart-outline',             // shopping
  'gamepad-variant',          // entertainment
  'gift-outline',             // gift
  'hamburger',                // food
  'emoticon-wink-outline',    // fun
  'party-popper',             // entertainment
  'percent-outline',          // discount
  'circle-multiple-outline',  // coins
];

const CELL_SIZE = 64;
const ICON_SIZE = 18;
const PATTERN_OPACITY = 0.07;

/** Deterministic rotation per icon index — keeps the pattern lively but stable. */
const ROTATIONS = [-18, 15, -10, 20, 12, 5, -25, 8, -15, 22, -8, 30];

interface FunPatternBackgroundProps {
  children?: React.ReactNode;
}

/* ── Memoised grid of icon glyphs ───────────────────────────── */

const PatternGrid = memo(function PatternGrid({
  width,
  height,
  color,
}: {
  width: number;
  height: number;
  color: string;
}) {
  const items = useMemo(() => {
    if (width <= 0 || height <= 0) return [];
    const cols = Math.ceil(width / CELL_SIZE) + 1;
    const rows = Math.ceil(height / CELL_SIZE) + 1;
    const result: {
      key: string;
      icon: (typeof ICONS)[number];
      left: number;
      top: number;
      rotation: number;
    }[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const idx = row * cols + col;
        const offsetX = row % 2 === 1 ? CELL_SIZE / 2 : 0;
        result.push({
          key: `${row}-${col}`,
          icon: ICONS[idx % ICONS.length],
          left: col * CELL_SIZE + offsetX,
          top: row * CELL_SIZE,
          rotation: ROTATIONS[idx % ROTATIONS.length],
        });
      }
    }
    return result;
  }, [width, height]);

  if (items.length === 0) return null;

  return (
    <View
      style={[StyleSheet.absoluteFill, { opacity: PATTERN_OPACITY, overflow: 'hidden' }]}
      pointerEvents="none"
    >
      {items.map(({ key, icon, left, top, rotation }) => (
        <MaterialCommunityIcons
          key={key}
          name={icon}
          size={ICON_SIZE}
          color={color}
          style={{
            position: 'absolute',
            left,
            top,
            transform: [{ rotate: `${rotation}deg` }],
          }}
        />
      ))}
    </View>
  );
});

/* ── Public component ───────────────────────────────────────── */

export function FunPatternBackground({ children }: FunPatternBackgroundProps) {
  const { isDark } = useTheme();
  const color = isDark ? DARK_COLOR : LIGHT_COLOR;
  const { width, height } = useWindowDimensions();

  const pattern = <PatternGrid width={width} height={height} color={color} />;

  if (!children) {
    return pattern;
  }

  return (
    <View style={styles.container}>
      {pattern}
      <View style={styles.content}>{children}</View>
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
