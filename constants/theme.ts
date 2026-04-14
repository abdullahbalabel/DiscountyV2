/**
 * Discounty Design System — Single Source of Truth for Colors
 *
 * Based on Material Design 3 color system with a warm burgundy brand palette.
 * Every screen and component should import colors from here via the useThemeColors() hook.
 */

// ─── Brand Colors (mode-independent) ─────────────────────────────────────────

export const Brand = {
  primary: '#862045',
  primaryGradient: ['#862045', '#a01840'] as const,
  primaryContainer: '#ffd9de',
  onPrimary: '#ffffff',
} as const;

// ─── Semantic Colors (mode-independent) ──────────────────────────────────────

export const Semantic = {
  error: '#ba1a1a',
  errorBg: '#ffdad6',
  errorBgDark: 'rgba(186,26,26,0.2)',
  success: '#10b981',
  successText: '#16a34a',
  successBg: 'rgba(16,185,129,0.1)',
  successContainer: '#dcfce7',
  successContainerDark: 'rgba(16,185,129,0.15)',
  successOnContainer: '#15803d',
  warning: '#f59e0b',
  warningText: '#d97706',
  warningBg: 'rgba(245,158,11,0.1)',
  warningContainer: '#fef3c7',
  warningContainerDark: 'rgba(245,158,11,0.15)',
  warningOnContainer: '#92400e',
  info: '#0ea5e9',
  brown: '#7b5733',
  brownBg: 'rgba(123,87,51,0.1)',
  purple: '#8b5cf6',
  iconDefault: '#85736f',
  iconDefaultDark: '#a08d88',
  link: '#0a7ea4',
  navy: '#2c1600',
  navyDark: '#f5e6d0',
} as const;

// ─── Light Theme ─────────────────────────────────────────────────────────────

export const LightColors = {
  // Overrides for mode-independent Brand/Semantic tokens (spread after Semantic)
  primary: '#862045',

  // Surfaces
  surfaceBg: '#fff8f6',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#fff0ed',
  surfaceContainer: '#f0e0dc',
  surfaceContainerHigh: '#f5ddd9',
  surfaceContainerHighest: '#ead5d0',

  // Text
  onSurface: '#231917',
  onSurfaceVariant: '#564340',

  // Borders / Dividers
  outline: '#85736f',
  outlineVariant: 'rgba(133,115,111,0.1)',
  divider: '#e5d5d0',

  // Inputs
  inputBorder: '#d4c2bc',
  inputIcon: '#9E9E9E',

  // Inverse (for overlays, glass cards)
  inverseSurface: '#372e2c',
  inverseOnSurface: '#faeeec',

  // Tab bar
  tabBarBg: '#ffffff',
  tabBarInactive: '#85736f',

  // Shadows
  shadowColor: '#000',
} as const;

// ─── Dark Theme ──────────────────────────────────────────────────────────────

export const DarkColors = {
  // Dark mode overrides for Brand/Semantic tokens (spread after Semantic, wins)
  primary: '#e07a95',
  error: '#f87171',
  successOnContainer: '#4ade80',
  warningOnContainer: '#fbbf24',
  link: '#38bdf8',
  iconDefault: '#c4b0ac',

  // Surfaces — warm near-black with burgundy undertone
  surfaceBg: '#1c1416',
  surfaceContainerLowest: '#161012',
  surfaceContainerLow: '#231b1d',
  surfaceContainer: '#2d2325',
  surfaceContainerHigh: '#3a2e30',
  surfaceContainerHighest: '#46393b',

  // Text — warm off-white with high contrast
  onSurface: '#ede0df',
  onSurfaceVariant: '#a89998',

  // Borders / Dividers
  outline: '#a89998',
  outlineVariant: 'rgba(168,153,152,0.12)',
  divider: 'rgba(168,153,152,0.12)',

  // Inputs
  inputBorder: 'rgba(168,153,152,0.24)',
  inputIcon: 'rgba(237,224,223,0.5)',

  // Inverse (for overlays, glass cards)
  inverseSurface: '#ede0df',
  inverseOnSurface: '#372e2c',

  // Tab bar
  tabBarBg: '#231b1d',
  tabBarInactive: '#a89998',

  // Shadows
  shadowColor: '#000',
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Fonts = {
  heading: 'Cairo',
  body: 'Cairo',
} as const;

// ─── Spacing Scale ───────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Bottom offset to clear the floating AnimatedTabBar (60 bar + ~40 safe area)
export const TAB_BAR_OFFSET = 100;

// ─── Border Radius Scale ─────────────────────────────────────────────────────
//
// Usage guide:
//   sm   (6)   — filter/category chips, small badges
//   md   (8)   — icon buttons, stat cards, small containers
//   lg   (12)  — cards (DealCard, history cards), buttons, inputs
//   xl   (16)  — profile cards, section containers, large cards
//   xxl  (20)  — special containers
//   glass(32)  — auth glassmorphism card
//   full (999) — pills, CTAs, completely rounded elements

export const Radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  glass: 32,
  full: 999,
} as const;

// ─── Shadow Elevation Scale ───────────────────────────────────────────────────
//
// Usage guide:
//   xs  — inputs, search bars (barely visible lift)
//   sm  — cards, list items (subtle lift)
//   md  — primary CTAs, elevated cards (noticeable lift)
//   lg  — modals, QR cards (strong lift)
//   glow — gradient button glow (brand-colored)
//   badge — discount badge glow (primary-colored)

export const Shadows = {
  xs: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
    elevation: 8,
  },
  badge: {
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

// ─── Type helper ─────────────────────────────────────────────────────────────

export type ThemeColors = typeof LightColors;

// ─── Backward-compatible exports (used by Expo template files) ────────────────

export const Colors = {
  light: {
    text: LightColors.onSurface,
    background: LightColors.surfaceBg,
    tint: Brand.primary,
    icon: LightColors.tabBarInactive,
    tabIconDefault: LightColors.tabBarInactive,
    tabIconSelected: Brand.primary,
  },
  dark: {
    text: DarkColors.onSurface,
    background: DarkColors.surfaceBg,
    tint: Brand.onPrimary,
    icon: DarkColors.tabBarInactive,
    tabIconDefault: DarkColors.tabBarInactive,
    tabIconSelected: Brand.onPrimary,
  },
} as const;
