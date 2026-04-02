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
  warning: '#f59e0b',
  warningText: '#d97706',
  warningBg: 'rgba(245,158,11,0.1)',
  info: '#0ea5e9',
  brown: '#7b5733',
  brownBg: 'rgba(123,87,51,0.1)',
  purple: '#8b5cf6',
  iconDefault: '#85736f',
  iconDefaultDark: '#a08d88',
} as const;

// ─── Light Theme ─────────────────────────────────────────────────────────────

export const LightColors = {
  // Surfaces
  surfaceBg: '#fff8f6',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#fff0ed',
  surfaceContainer: '#f0e0dc',
  surfaceContainerHigh: '#f5ddd9',

  // Text
  onSurface: '#231917',
  onSurfaceVariant: '#564340',

  // Borders
  outlineVariant: 'rgba(133,115,111,0.1)',

  // Tab bar
  tabBarBg: '#ffffff',
  tabBarInactive: '#85736f',

  // Shadows
  shadowColor: '#000',
} as const;

// ─── Dark Theme ──────────────────────────────────────────────────────────────

export const DarkColors = {
  // Surfaces
  surfaceBg: '#1a110f',
  surfaceContainerLowest: '#322825',
  surfaceContainerLow: '#271d1b',
  surfaceContainer: '#3d3230',
  surfaceContainerHigh: '#534340',

  // Text
  onSurface: '#f1dfda',
  onSurfaceVariant: '#d8c2bd',

  // Borders
  outlineVariant: 'rgba(160,141,136,0.1)',

  // Tab bar
  tabBarBg: '#271d1b',
  tabBarInactive: '#a08d88',

  // Shadows
  shadowColor: '#000',
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────

export const Fonts = {
  heading: 'Epilogue',
  body: 'Manrope',
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
    tint: '#fff',
    icon: DarkColors.tabBarInactive,
    tabIconDefault: DarkColors.tabBarInactive,
    tabIconSelected: '#fff',
  },
} as const;
