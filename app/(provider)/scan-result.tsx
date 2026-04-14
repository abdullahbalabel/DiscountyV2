import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useThemeColors } from '../../hooks/use-theme-colors';

export default function ScanResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  const { success, dealTitle, discountValue, discountType, redemptionId } = useLocalSearchParams<{
    success: string; dealTitle: string; discountValue: string; discountType: string; redemptionId: string;
  }>();

  const isSuccess = success === 'true';
  const formattedDiscount = discountType === 'percentage' ? `${discountValue}%` : `$${discountValue}`;

  const surfaceContainerLowest = colors.surfaceContainerLowest;
  const onSurface = colors.onSurface;
  const onSurfaceVariant = colors.onSurfaceVariant;
  const outlineVariant = colors.outlineVariant;

  return (
    <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <AnimatedEntrance index={0} delay={100}>
        <View style={{ alignItems: 'center' }}>
          <View style={{
            width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 32,
            backgroundColor: isSuccess ? colors.successBg : colors.errorBg,
          }}>
            <MaterialIcons name={isSuccess ? 'check-circle' : 'cancel'} size={72} color={isSuccess ? colors.success : colors.error} />
          </View>
          <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 30, color: onSurface, textAlign: 'center', letterSpacing: -0.5, marginBottom: 12 }}>
            {isSuccess ? t('provider.dealRedeemed') : t('provider.scanFailed')}
          </Text>
          <Text style={{ color: onSurfaceVariant, fontFamily: 'Cairo', fontSize: 16, textAlign: 'center', lineHeight: 24, maxWidth: 280 }}>
            {isSuccess ? t('provider.dealRedeemedDesc') : t('provider.scanFailedDesc')}
          </Text>
        </View>
      </AnimatedEntrance>

      {isSuccess && dealTitle && (
        <AnimatedEntrance index={1} delay={200}>
          <View style={{ marginTop: 32, width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, backgroundColor: surfaceContainerLowest, borderWidth: 1, borderColor: outlineVariant }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="local-offer" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: onSurface }} numberOfLines={2}>{dealTitle}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderColor: outlineVariant }}>
              <Text style={{ color: onSurfaceVariant, fontSize: 14 }}>{t('provider.discountApplied')}</Text>
              <View style={{ backgroundColor: colors.successBg, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 }}>
                <Text style={{ color: colors.successText, fontFamily: 'Cairo_700Bold', fontSize: 18 }}>{formattedDiscount}</Text>
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
              <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 16 }}>{t('provider.scanAnother')}</Text>
            </View>
          </AnimatedButton>
          <AnimatedButton style={{ paddingVertical: 16, borderRadius: 16, borderWidth: 1, borderColor: outlineVariant }} onPress={() => router.replace('/(provider)/dashboard')}>
            <Text style={{ color: onSurface, fontFamily: 'Cairo_700Bold', fontSize: 16, textAlign: 'center' }}>{t('provider.backToDashboard')}</Text>
          </AnimatedButton>
        </View>
      </AnimatedEntrance>
    </ScreenWrapper>
  );
}
