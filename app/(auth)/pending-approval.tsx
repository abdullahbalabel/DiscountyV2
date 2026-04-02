import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';

export default function PendingApprovalScreen() {
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
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 30, color: isDark ? '#f1dfda' : '#231917', textAlign: 'center', marginBottom: 12 }}>
            Application Submitted
          </Text>

          {/* Description */}
          <Text style={{ fontFamily: 'Manrope', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 16, lineHeight: 24, marginBottom: 32, maxWidth: 300 }}>
            Your business registration is being reviewed by our team. This usually takes 24-48 hours.
          </Text>

          {/* Status Card */}
          <View style={{ width: '100%', borderRadius: 24, padding: 24, marginBottom: 32, backgroundColor: isDark ? '#322825' : '#ffffff', borderWidth: 1, borderColor: 'rgba(133,115,111,0.1)' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="pending" size={18} color="#f59e0b" />
              </View>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: isDark ? '#f1dfda' : '#231917' }}>
                Status: Pending Review
              </Text>
            </View>

            <View style={{ gap: 12 }}>
              {[
                { label: 'Application received', done: true },
                { label: 'Under review', done: false, active: true },
                { label: 'Approved & ready', done: false },
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
                    fontFamily: 'Manrope', fontSize: 14,
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
          <Text style={{ fontFamily: 'Manrope', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 12, lineHeight: 20, marginBottom: 32 }}>
            We'll notify you as soon as your business is approved.{'\n'}
            You can start posting deals immediately after approval.
          </Text>

          {/* Sign Out */}
          <AnimatedButton
            style={{ paddingHorizontal: 32, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)' }}
            onPress={() => signOut()}
          >
            <Text style={{ fontFamily: 'Manrope', fontWeight: '600', color: isDark ? '#d8c2bd' : '#564340' }}>Sign Out</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
