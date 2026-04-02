import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, Brand, Semantic, Fonts, Spacing, Radius, Shadows, type ThemeColors } from '../constants/theme';

/**
 * Returns the complete color palette for the current color scheme.
 * Usage in any screen/component:
 *
 *   const colors = useThemeColors();
 *   <View style={{ backgroundColor: colors.surfaceBg }}>
 *     <Text style={{ color: colors.onSurface }}>Hello</Text>
 *   </View>
 */
export function useThemeColors() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    ...Brand,
    ...Semantic,
    ...(isDark ? DarkColors : LightColors),
  };
}

/**
 * Returns design tokens (fonts, spacing, radius) — no color scheme dependency.
 */
export function useDesignTokens() {
  return { fonts: Fonts, spacing: Spacing, radius: Radius };
}

export { Brand, Semantic, Fonts, Spacing, Radius, Shadows, LightColors, DarkColors };
export type { ThemeColors };
