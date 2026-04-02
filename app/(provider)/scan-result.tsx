import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';

export default function ScanResultScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { success, dealTitle, discountValue, discountType, redemptionId } = useLocalSearchParams<{
    success: string; dealTitle: string; discountValue: string; discountType: string; redemptionId: string;
  }>();

  const isSuccess = success === 'true';
  const formattedDiscount = discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`;

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <AnimatedEntrance index={0} delay={100}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 32,
            backgroundColor: isSuccess ? (isDark ? 'rgba(22,163,74,0.3)' : '#dcfce7') : (isDark ? 'rgba(220,38,38,0.3)' : '#fee2e2'),
          }}>
            <MaterialIcons name={isSuccess ? 'check-circle' : 'cancel'} size={72} color={isSuccess ? '#16a34a' : '#dc2626'} />
          </View>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '900', fontSize: 30, color: onSurface, textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 }}>
            {isSuccess ? 'Deal Redeemed!' : 'Scan Failed'}
          </Text>
          <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 280 }}>
            {isSuccess ? 'The deal has been successfully redeemed for this customer.' : 'The QR code could not be validated. It may have already been used or expired.'}
          </Text>
        </View>
      </AnimatedEntrance>

      {isSuccess && dealTitle && (
        <AnimatedEntrance index={1} delay={200}>
          <View style={{ marginTop: 32, width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, backgroundColor: surfaceContainerLowest, borderWidth: 1, borderColor: outlineVariant }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="local-offer" size={24} color="#862045" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface }} numberOfLines={2}>{dealTitle}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderColor: outlineVariant }}>
              <Text style={{ color: onSurfaceVariant, fontSize: 14 }}>Discount Applied</Text>
              <View style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.3)' : '#dcfce7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
                <Text style={{ color: isDark ? '#86efac' : '#15803d', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 18 }}>{formattedDiscount}</Text>
              </View>
            </View>
          </View>
        </AnimatedEntrance>
      )}

      <AnimatedEntrance index={2} delay={300}>
        <View style={{ marginTop: 40, width: '100%', maxWidth: 340, gap: 12 }}>
          <AnimatedButton variant="gradient" style={{ paddingVertical: 16, borderRadius: 16 }} onPress={() => router.replace('/(provider)/scan')}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <MaterialIcons name="qr-code-scanner" size={20} color="white" />
              <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16 }}>Scan Another</Text>
            </View>
          </AnimatedButton>
          <AnimatedButton style={{ paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: outlineVariant }} onPress={() => router.replace('/(provider)/dashboard')}>
            <Text style={{ color: onSurface, fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, textAlign: 'center' }}>Back to Dashboard</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </View>
  );
}
