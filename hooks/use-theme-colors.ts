import { useTheme } from '../contexts/theme';
import { LightColors, DarkColors, Brand, Semantic, Fonts, Spacing, Radius, Shadows, TAB_BAR_OFFSET, type ThemeColors } from '../constants/theme';

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
  const { isDark } = useTheme();

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

export { Brand, Semantic, Fonts, Spacing, Radius, Shadows, TAB_BAR_OFFSET, LightColors, DarkColors };
export type { ThemeColors };
