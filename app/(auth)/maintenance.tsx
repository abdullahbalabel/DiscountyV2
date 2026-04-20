import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { Logo } from '../../components/ui/Logo';
import { useAuth } from '../../contexts/auth';
import { Radius, useThemeColors } from '../../hooks/use-theme-colors';
import { supabaseUrl } from '../../lib/supabase';

interface MaintenanceStatus {
  is_enabled: boolean;
  message_title: string;
  message_body: string;
  estimated_duration: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
}

const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/check-maintenance`;

async function fetchMaintenanceStatus(): Promise<MaintenanceStatus> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}

export default function MaintenanceScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { refreshMaintenanceStatus } = useAuth();

  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Disable back navigation
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({
        headerShown: false,
        gestureEnabled: false,
      });
    }, [navigation])
  );

  // Fetch status on mount
  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          const data = await fetchMaintenanceStatus();
          if (active) {
            setStatus(data);
          }
        } catch {
          // If fetch fails, keep status null — UI shows fallback
        } finally {
          if (active) setIsLoading(false);
        }
      })();

      return () => { active = false; };
    }, [])
  );

  const handleTryAgain = async () => {
    setIsChecking(true);
    try {
      const data = await fetchMaintenanceStatus();
      if (!data.is_enabled) {
        // Maintenance ended — refresh auth context state
        // This will update isMaintenanceActive and trigger routing via useProtectedRoute
        await refreshMaintenanceStatus();
        return;
      }
      setStatus(data);
    } catch {
      Alert.alert(
        t('common.error'),
        t('maintenance.tryAgainError')
      );
    } finally {
      setIsChecking(false);
    }
  };

  // Entrance animations
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(20);
  const buttonOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (!isLoading) {
      logoOpacity.value = withTiming(1, { duration: 500 });
      logoScale.value = withSpring(1, { damping: 12, stiffness: 100 });
      contentOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
      contentTranslateY.value = withDelay(200, withSpring(0, { damping: 15, stiffness: 100 }));
      buttonOpacity.value = withDelay(400, withTiming(1, { duration: 300 }));
    }
  }, [isLoading]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.surfaceBg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const title = status?.message_title || t('maintenance.defaultTitle');
  const body = status?.message_body || t('maintenance.defaultBody');
  const duration = status?.estimated_duration;

  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surfaceBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
    }}>
      {/* Logo */}
      <Animated.View style={[logoAnimatedStyle, { marginBottom: 32 }]}>
        <Logo size={72} />
      </Animated.View>

      {/* Content */}
      <Animated.View style={[contentAnimatedStyle, { alignItems: 'center', width: '100%', maxWidth: 360 }]}>
        {/* Title */}
        <Text style={{
          fontFamily: 'Cairo_700Bold',
          fontSize: 24,
          color: colors.onSurface,
          textAlign: 'center',
          marginBottom: 12,
        }}>
          {title}
        </Text>

        {/* Body */}
        <Text style={{
          fontFamily: 'Cairo',
          fontSize: 15,
          color: colors.onSurfaceVariant,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: duration ? 20 : 32,
        }}>
          {body}
        </Text>

        {/* Estimated Duration */}
        {duration && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: colors.surfaceContainer,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: Radius.lg,
            marginBottom: 32,
          }}>
            <Ionicons name="time-outline" size={18} color={colors.onSurfaceVariant} />
            <Text style={{
              fontFamily: 'Cairo',
              fontSize: 14,
              color: colors.onSurfaceVariant,
            }}>
              {t('maintenance.estimatedDuration')}: {duration}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Try Again Button */}
      <Animated.View style={buttonAnimatedStyle}>
        <AnimatedButton
          variant="solid"
          onPress={handleTryAgain}
          disabled={isChecking}
          style={{
            paddingHorizontal: 32,
            paddingVertical: 14,
            minWidth: 200,
          }}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <>
              <Ionicons name="refresh-outline" size={18} color={colors.onPrimary} style={{ marginRight: 8 }} />
              <Text style={{
                fontFamily: 'Cairo_700Bold',
                fontSize: 15,
                color: colors.onPrimary,
              }}>
                {t('maintenance.tryAgain')}
              </Text>
            </>
          )}
        </AnimatedButton>
      </Animated.View>
    </View>
  );
}
