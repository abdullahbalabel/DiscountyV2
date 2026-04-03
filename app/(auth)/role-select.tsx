import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
import { useAuth } from '../../contexts/auth';
import { useThemeColors } from '../../hooks/use-theme-colors';

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();
  const { setUserRole } = useAuth();
  const [isSettingRole, setIsSettingRole] = React.useState(false);
  const [error, setError] = React.useState('');

  // Theme-aware glass card colors
  const isDark = colors.isDark;
  const textPrimary = isDark ? '#fff' : colors.onSurface;
  const textSecondary = isDark ? 'rgba(255,255,255,0.7)' : colors.onSurfaceVariant;
  const textMuted = isDark ? 'rgba(255,255,255,0.6)' : colors.onSurfaceVariant;
  const textFaint = isDark ? 'rgba(255,255,255,0.4)' : colors.onSurfaceVariant;
  const textVeryFaint = isDark ? 'rgba(255,255,255,0.5)' : colors.onSurfaceVariant;
  const glassBorder = isDark ? 'rgba(255,255,255,0.2)' : colors.outlineVariant;
  const cardBg = isDark ? 'rgba(255,255,255,0.1)' : colors.surfaceContainerHigh;
  const iconColor = isDark ? 'white' : colors.onSurfaceVariant;

  const handleSelectCustomer = async () => {
    setIsSettingRole(true);
    setError('');
    const result = await setUserRole('customer');
    if (result.error) {
      console.error('Error setting role:', result.error);
      setError(result.error);
      setIsSettingRole(false);
    }
  };

  const handleSelectProvider = () => {
    router.push('/(auth)/provider-signup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg, position: 'relative' }}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
        style={{ position: 'absolute', top: 0, start: 0, end: 0, bottom: 0, zIndex: 0 }}
        contentFit="cover"
      />
      <View style={{ position: 'absolute', top: 0, start: 0, end: 0, bottom: 0, zIndex: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <GlassView
          intensity={colors.isDark ? 30 : 50}
          style={{ width: '100%', maxWidth: 512, marginHorizontal: 24, borderRadius: 32, padding: 40, zIndex: 10, borderWidth: 1, borderColor: glassBorder }}
        >
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: cardBg, borderWidth: 1, borderColor: glassBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <MaterialIcons name="person-add" size={32} color={iconColor} />
            </View>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 30, color: textPrimary, textAlign: 'center', marginBottom: 8 }}>
              {t('auth.welcomeToDiscounty')}
            </Text>
            <Text style={{ fontFamily: 'Manrope', color: textSecondary, textAlign: 'center', fontSize: 16 }}>
              {t('auth.howUseApp')}
            </Text>
          </View>

          {/* Role Cards */}
          <View style={{ gap: 16 }}>
            {/* Customer Card */}
            <AnimatedButton
              onPress={handleSelectCustomer}
              disabled={isSettingRole}
              style={{
                backgroundColor: cardBg, borderWidth: 2, borderColor: glassBorder,
                borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20,
                opacity: isSettingRole ? 0.5 : 1,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient
                  colors={['#862045', '#a01840']}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name="local-offer" size={28} color="white" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: textPrimary, marginBottom: 4 }}>
                  {isSettingRole ? t('auth.settingUp') : t('auth.imCustomer')}
                </Text>
                <Text style={{ fontFamily: 'Manrope', color: textMuted, fontSize: 14, lineHeight: 20 }}>
                  {t('auth.customerDesc')}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={textVeryFaint} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
            </AnimatedButton>

            {/* Provider Card */}
            <AnimatedButton
              onPress={handleSelectProvider}
              disabled={isSettingRole}
              style={{
                backgroundColor: cardBg, borderWidth: 2, borderColor: glassBorder,
                borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20,
                opacity: isSettingRole ? 0.5 : 1,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient
                  colors={['#00694d', '#0f9d6e']}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialCommunityIcons name="store" size={28} color="white" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: textPrimary, marginBottom: 4 }}>
                  {t('auth.imBusiness')}
                </Text>
                <Text style={{ fontFamily: 'Manrope', color: textMuted, fontSize: 14, lineHeight: 20 }}>
                  {t('auth.businessDesc')}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={textVeryFaint} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
            </AnimatedButton>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={{ marginTop: 16, backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ color: '#ef4444', fontFamily: 'Manrope', fontSize: 14, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}

          {/* Footer */}
          <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderColor: glassBorder, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Manrope', color: textFaint, fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
              {t('auth.changeRoleLater')}
            </Text>
          </View>
        </GlassView>
      </ScrollView>
    </View>
  );
}
