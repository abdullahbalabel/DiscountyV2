import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { Shadows } from '../../hooks/use-theme-colors';

export default function AccountSuspendedScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <AnimatedEntrance index={0}>
        <View style={{ alignItems: 'center', width: '100%', maxWidth: 360 }}>
          {/* Warning Icon */}
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            backgroundColor: '#FEF2F2',
          }}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          </View>

          {/* Title */}
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 24, color: '#18181B', textAlign: 'center', marginBottom: 8 }}>
            {t('auth.accountSuspended')}
          </Text>

          {/* Description */}
          <Text style={{ fontFamily: 'Cairo', color: '#71717A', textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 32 }}>
            {t('auth.accountSuspendedDesc')}
          </Text>

          {/* Status Card */}
          <View style={{
            width: '100%', borderRadius: 12, padding: 20, marginBottom: 24,
            backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7',
            ...Shadows.sm,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="info-outline" size={16} color="#EF4444" />
              </View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 15, color: '#18181B' }}>
                {t('auth.suspendedStatus')}
              </Text>
            </View>

            <Text style={{ fontFamily: 'Cairo', fontSize: 13, color: '#71717A', lineHeight: 20 }}>
              {t('auth.suspendedNotice')}
            </Text>
          </View>

          {/* Contact Support */}
          <Text style={{ fontFamily: 'Cairo', color: '#A1A1AA', textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 32 }}>
            {t('auth.contactSupportIfMistake')}
          </Text>

          {/* Sign Out */}
          <AnimatedButton
            style={{
              paddingHorizontal: 32, paddingVertical: 12, borderRadius: 12,
              borderWidth: 1, borderColor: '#E4E4E7', backgroundColor: '#FFFFFF',
            }}
            onPress={() => signOut()}
          >
            <Text style={{ fontFamily: 'Cairo_600SemiBold', color: '#18181B', fontSize: 14 }}>{t('auth.signOut')}</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
