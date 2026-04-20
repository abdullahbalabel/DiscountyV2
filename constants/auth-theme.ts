import { Platform, StyleSheet } from 'react-native';
import { Brand, Fonts, Radius, Spacing } from './theme';

export const AuthColors = {
  bg: '#FFFFFF',
  text: '#09090B',
  muted: '#71717A',
  border: '#E4E4E7',
  inputBg: '#FAFAFA',
  primary: Brand.primary,
  primaryContainer: Brand.primaryContainer,
  error: '#ef4444',
  success: '#10b981',
} as const;

export const AuthStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AuthColors.bg,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  heading: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 24,
    color: AuthColors.text,
    textAlign: 'left',
  },
  headingLarge: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 28,
    color: AuthColors.text,
    textAlign: 'center',
  },
  subheading: {
    fontFamily: 'Cairo',
    fontSize: 14,
    color: AuthColors.muted,
    marginTop: Spacing.xs,
    textAlign: 'left',
  },
  inputContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  footer: {
    marginTop: 'auto' as const,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: AuthColors.border,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: Spacing.xs,
  },
  footerText: {
    fontFamily: 'Cairo',
    fontSize: 13,
    color: AuthColors.muted,
  },
  footerLink: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
    color: AuthColors.primary,
  },
  socialButton: {
    width: '100%' as const,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing.sm,
  },
  socialButtonGoogle: {
    backgroundColor: AuthColors.bg,
    borderWidth: 1,
    borderColor: AuthColors.border,
  },
  socialButtonApple: {
    backgroundColor: '#000000',
  },
  socialButtonOutline: {
    backgroundColor: AuthColors.bg,
    borderWidth: 1,
    borderColor: AuthColors.border,
  },
  socialButtonLabel: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 15,
  },
  dividerContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: AuthColors.border,
  },
  dividerText: {
    fontFamily: 'Cairo',
    fontSize: 13,
    color: AuthColors.muted,
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
  errorText: {
    fontFamily: 'Cairo',
    fontSize: 13,
    color: AuthColors.error,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: AuthColors.inputBg,
    borderWidth: 1,
    borderColor: AuthColors.border,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center' as const,
    marginBottom: Spacing.xxl,
  },
  languageToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: AuthColors.border,
  },
  screenWrapper: {
    flex: 1,
    backgroundColor: AuthColors.bg,
  },
});
