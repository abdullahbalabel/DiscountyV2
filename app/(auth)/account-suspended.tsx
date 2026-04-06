import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';

export default function AccountSuspendedScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <AnimatedEntrance index={0}>
        <View style={{ alignItems: 'center' }}>
          {/* Icon */}
          <View style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 32, backgroundColor: isDark ? '#3b1113' : '#fee2e2' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(220,38,38,0.3)' : '#fecaca' }}>
              <MaterialIcons name="block" size={40} color="#dc2626" />
            </View>
          </View>

          {/* Title */}
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 30, color: isDark ? '#f1dfda' : '#231917', textAlign: 'center', marginBottom: 12 }}>
            {t('auth.accountSuspended')}
          </Text>

          {/* Description */}
          <Text style={{ fontFamily: 'Cairo', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 32, maxWidth: 300 }}>
            {t('auth.accountSuspendedDesc')}
          </Text>

          {/* Status Card */}
          <View style={{ width: '100%', borderRadius: 24, padding: 24, marginBottom: 32, backgroundColor: isDark ? '#322825' : '#ffffff', borderWidth: 1, borderColor: 'rgba(133,115,111,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: isDark ? '#3b1113' : '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="info-outline" size={18} color="#dc2626" />
              </View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: isDark ? '#f1dfda' : '#231917' }}>
                {t('auth.suspendedStatus')}
              </Text>
            </View>

            <Text style={{ fontFamily: 'Cairo', fontSize: 14, color: isDark ? '#d8c2bd' : '#564340', lineHeight: 22 }}>
              {t('auth.suspendedNotice')}
            </Text>
          </View>

          {/* Contact Support */}
          <Text style={{ fontFamily: 'Cairo', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 12, lineHeight: 20, marginBottom: 32 }}>
            {t('auth.contactSupportIfMistake')}
          </Text>

          {/* Sign Out */}
          <AnimatedButton
            style={{ paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)' }}
            onPress={() => signOut()}
          >
            <Text style={{ fontFamily: 'Cairo_600SemiBold', color: isDark ? '#d8c2bd' : '#564340' }}>{t('auth.signOut')}</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
