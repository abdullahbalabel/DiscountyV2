import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { Shadows } from '../../hooks/use-theme-colors';

export default function PendingApprovalScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      <AnimatedEntrance index={0}>
        <View style={{ alignItems: 'center', width: '100%', maxWidth: 360 }}>
          {/* Clock Icon */}
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
            backgroundColor: '#F4F4F5',
          }}>
            <Ionicons name="time-outline" size={48} color="#18181B" />
          </View>

          {/* Title */}
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 24, color: '#18181B', textAlign: 'center', marginBottom: 8 }}>
            {t('auth.applicationSubmitted')}
          </Text>

          {/* Description */}
          <Text style={{ fontFamily: 'Cairo', color: '#71717A', textAlign: 'center', fontSize: 15, lineHeight: 22, marginBottom: 32 }}>
            {t('auth.businessRegReview')}
          </Text>

          {/* Status Card */}
          <View style={{
            width: '100%', borderRadius: 12, padding: 20, marginBottom: 24,
            backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7',
            ...Shadows.sm,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="pending" size={16} color="#F59E0B" />
              </View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 15, color: '#18181B' }}>
                {t('auth.statusPendingReview')}
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {[
                { label: t('auth.applicationReceived'), done: true },
                { label: t('auth.underReview'), done: false, active: true },
                { label: t('auth.approvedReady'), done: false },
              ].map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: item.done ? '#DCFCE7' : item.active ? '#FEF9C3' : '#F4F4F5',
                  }}>
                    {item.done ? (
                      <MaterialIcons name="check" size={14} color="#16A34A" />
                    ) : item.active ? (
                      <MaterialIcons name="more-horiz" size={14} color="#CA8A04" />
                    ) : null}
                  </View>
                  <Text style={{
                    fontFamily: 'Cairo', fontSize: 13,
                    color: item.done ? '#16A34A' : item.active ? '#A16207' : '#A1A1AA',
                    fontWeight: (item.done || item.active) ? '600' : '400',
                  }}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info */}
          <Text style={{ fontFamily: 'Cairo', color: '#A1A1AA', textAlign: 'center', fontSize: 12, lineHeight: 18, marginBottom: 32 }}>
            {t('auth.notifyWhenApproved')}{'\n'}
            {t('auth.startPostingAfterApproval')}
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
