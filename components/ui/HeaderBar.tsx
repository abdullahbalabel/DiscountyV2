import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { I18nManager, Text, View } from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { GlassHeader } from './GlassHeader';
import { Logo } from './Logo';
import { useThemeColors, Radius, Spacing } from '../../hooks/use-theme-colors';

interface HeaderAction {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  badge?: number;
}

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showLogo?: boolean;
  rightActions?: HeaderAction[];
  rightContent?: React.ReactNode;
  children?: React.ReactNode;
}

export function HeaderBar({ title, subtitle, onBack, showLogo, rightActions, rightContent, children }: HeaderBarProps) {
  const colors = useThemeColors();

  return (
    <GlassHeader style={{
      width: '100%',
      paddingHorizontal: Spacing.lg,
      paddingTop: 48,
      paddingBottom: Spacing.sm,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexShrink: 1 }}>
          {showLogo && (
            <Logo size={32} color={colors.primary} />
          )}
          {onBack && (
            <AnimatedButton
              onPress={onBack}
              style={{
                width: 32, height: 32,
                borderRadius: Radius.md,
                backgroundColor: colors.surfaceContainerHigh,
                alignItems: 'center',
                justifyContent: 'center',
                marginEnd: Spacing.xs,
              }}
            >
              <MaterialIcons
                name={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'}
                size={20}
                color={colors.onSurface}
              />
            </AnimatedButton>
          )}
          <View style={{ flex: 1, flexShrink: 1 }}>
            <Text numberOfLines={1} style={{
              fontFamily: 'Cairo_700Bold',
              letterSpacing: -0.5,
              fontSize: 18,
              color: colors.onSurface,
            }}>{title}</Text>
            {subtitle && (
              <Text numberOfLines={1} style={{
                color: colors.onSurfaceVariant,
                fontSize: 10,
                fontFamily: 'Cairo',
                marginTop: 2,
              }}>{subtitle}</Text>
            )}
          </View>
        </View>

        {rightContent && rightContent}
        {rightActions && rightActions.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
            {rightActions.map((action, i) => (
              <AnimatedButton
                key={i}
                style={{
                  width: 32, height: 32,
                  borderRadius: Radius.md,
                  backgroundColor: colors.surfaceContainerHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
                onPress={action.onPress}
              >
                <MaterialIcons name={action.icon} size={18} color={colors.iconDefault} />
                {action.badge != null && action.badge > 0 && (
                  <View style={{
                    position: 'absolute',
                    top: -2,
                    end: -2,
                    width: 16, height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.error,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Text style={{ color: colors.onPrimary, fontSize: 9, fontWeight: '700' }}>
                      {action.badge > 9 ? '9+' : action.badge}
                    </Text>
                  </View>
                )}
              </AnimatedButton>
            ))}
          </View>
        )}
      </View>

      {children}
    </GlassHeader>
  );
}
