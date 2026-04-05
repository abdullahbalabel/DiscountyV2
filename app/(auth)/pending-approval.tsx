import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { Radius } from '../../hooks/use-theme-colors';

export default function PendingApprovalScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <AnimatedEntrance index={0}>
        <View style={{ alignItems: 'center' }}>
          {/* Animated Icon */}
          <View style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 32, backgroundColor: isDark ? '#534340' : '#f5ddd9' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(120,53,15,0.4)' : '#fef3c7' }}>
              <MaterialIcons name="hourglass-top" size={40} color="#f59e0b" />
            </View>
          </View>

          {/* Title */}
          <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 30, color: isDark ? '#f1dfda' : '#231917', textAlign: 'center', marginBottom: 12 }}>
            {t('auth.applicationSubmitted')}
          </Text>

          {/* Description */}
          <Text style={{ fontFamily: 'Cairo', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 32, maxWidth: 300 }}>
            {t('auth.businessRegReview')}
          </Text>

          {/* Status Card */}
          <View style={{ width: '100%', borderRadius: 24, padding: 24, marginBottom: 32, backgroundColor: isDark ? '#322825' : '#ffffff', borderWidth: 1, borderColor: 'rgba(133,115,111,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="pending" size={18} color="#f59e0b" />
              </View>
              <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 16, color: isDark ? '#f1dfda' : '#231917' }}>
                {t('auth.statusPendingReview')}
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {[
                { label: t('auth.applicationReceived'), done: true },
                { label: t('auth.underReview'), done: false, active: true },
                { label: t('auth.approvedReady'), done: false },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: item.done ? '#22c55e' : item.active ? '#fbbf24' : (isDark ? '#534340' : '#f5ddd9'),
                  }}>
                    {item.done ? (
                      <MaterialIcons name="check" size={14} color="white" />
                    ) : item.active ? (
                      <MaterialIcons name="more-horiz" size={14} color="white" />
                    ) : null}
                  </View>
                  <Text style={{
                    fontFamily: 'Cairo', fontSize: 14,
                    color: item.done ? '#16a34a' : item.active ? '#d97706' : (isDark ? '#d8c2bd' : '#564340'),
                    fontWeight: (item.done || item.active) ? '600' : '400',
                  }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <Text style={{ fontFamily: 'Cairo', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 12, lineHeight: 20, marginBottom: 32 }}>
            {t('auth.notifyWhenApproved')}{'\n'}
            {t('auth.startPostingAfterApproval')}
          </Text>

          {/* Sign Out */}
          <AnimatedButton
            style={{ paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)' }}
            onPress={() => signOut()}
          >
            <Text style={{ fontFamily: 'Cairo', fontWeight: '600', color: isDark ? '#d8c2bd' : '#564340' }}>{t('auth.signOut')}</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
