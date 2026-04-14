import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export function Input({ label, error, icon, style, ...props }: InputProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.onSurfaceVariant }]}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: error ? colors.error : colors.inputBorder,
          },
        ]}
      >
        {icon && (
          <View style={styles.iconWrapper}>
            <MaterialIcons name={icon} size={20} color={colors.inputIcon} />
          </View>
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: colors.onSurface,
            },
            icon ? { paddingStart: 0 } : { paddingStart: 16 },
            style,
          ]}
          placeholderTextColor={colors.inputIcon}
          {...props}
        />
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={14} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginStart: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
  },
  iconWrapper: {
    paddingEnd: 10,
  },
  input: {
    flex: 1,
    fontFamily: 'Cairo',
    fontSize: 16,
    paddingVertical: 14,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    marginStart: 4,
  },
  errorText: {
    fontFamily: 'Cairo',
    fontSize: 12,
  },
});