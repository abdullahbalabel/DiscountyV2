import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, ScrollView, Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { useAuth } from '../../contexts/auth';
import { Shadows } from '../../hooks/use-theme-colors';

export default function RoleSelectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setUserRole } = useAuth();
  const [isSettingRole, setIsSettingRole] = React.useState(false);
  const [error, setError] = React.useState('');

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
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <View style={{ width: '100%', maxWidth: 512 }}>
          {/* Header */}
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 24, color: '#18181B', textAlign: 'center', marginBottom: 8 }}>
              {t('auth.chooseYourRole')}
            </Text>
            <Text style={{ fontFamily: 'Cairo', color: '#71717A', textAlign: 'center', fontSize: 15 }}>
              {t('auth.roleQuestion')}
            </Text>
          </View>

          {/* Role Cards */}
          <View style={{ gap: 16 }}>
            {/* Customer Card */}
            <AnimatedButton
              onPress={handleSelectCustomer}
              disabled={isSettingRole}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E4E4E7',
                borderRadius: 12,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                opacity: isSettingRole ? 0.5 : 1,
                ...Shadows.sm,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#F4F4F5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialIcons name="local-offer" size={24} color="#18181B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 17, color: '#18181B', marginBottom: 2 }}>
                  {isSettingRole ? t('auth.settingUp') : t('auth.customer')}
                </Text>
                <Text style={{ fontFamily: 'Cairo', color: '#71717A', fontSize: 13, lineHeight: 18 }}>
                  {t('auth.customerRoleDesc')}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color="#A1A1AA"
                style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
              />
            </AnimatedButton>

            {/* Provider Card */}
            <AnimatedButton
              onPress={handleSelectProvider}
              disabled={isSettingRole}
              style={{
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E4E4E7',
                borderRadius: 12,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 16,
                opacity: isSettingRole ? 0.5 : 1,
                ...Shadows.sm,
              }}
            >
              <View style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#F4F4F5',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <MaterialCommunityIcons name="store" size={24} color="#18181B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 17, color: '#18181B', marginBottom: 2 }}>
                  {t('auth.providerRole')}
                </Text>
                <Text style={{ fontFamily: 'Cairo', color: '#71717A', fontSize: 13, lineHeight: 18 }}>
                  {t('auth.providerRoleDesc')}
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={22}
                color="#A1A1AA"
                style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
              />
            </AnimatedButton>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={{ marginTop: 16, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ color: '#EF4444', fontFamily: 'Cairo', fontSize: 14, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}

          {/* Footer */}
          <View style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Cairo', color: '#A1A1AA', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
              {t('auth.canChangeLater')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
