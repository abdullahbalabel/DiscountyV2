import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { fetchRedemptionById } from '../../../lib/api';
import { useThemeColors, Radius } from '../../../hooks/use-theme-colors';

let QRCode: any = null;
try { QRCode = require('react-native-qrcode-svg').default; } catch {}

export default function QRDisplayScreen() {
  const { t } = useTranslation();
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [redemption, setRedemption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!redemptionId) return;
    setIsLoading(true);
    fetchRedemptionById(redemptionId)
      .then(setRedemption)
      .catch(() => setRedemption(null))
      .finally(() => setIsLoading(false));
  }, [redemptionId]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!redemption) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <MaterialIcons name="error-outline" size={48} color="#85736f" />
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: colors.onSurface, marginTop: 16 }}>{t('customer.notFound')}</Text>
        <Text style={{ fontFamily: 'Manrope', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>{t('customer.redemptionNotFound')}</Text>
        <AnimatedButton style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#862045', borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>{t('customer.goBack')}</Text>
        </AnimatedButton>
      </View>
    );
  }

  const deal = redemption.discount;
  const provider = deal?.provider;
  const isRedeemed = redemption.status === 'redeemed';
  const isClaimed = redemption.status === 'claimed';
  const formattedDiscount = deal?.type === 'percentage' ? `${deal?.discount_value}%` : `$${deal?.discount_value}`;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceBg }}>
        <AnimatedButton
          style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#85736f" />
        </AnimatedButton>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 20, color: colors.onSurface }}>{t('customer.qrCode')}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, alignItems: 'center' }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '800', fontSize: 24, color: colors.onSurface, textAlign: 'center', letterSpacing: -0.5 }} numberOfLines={2}>
              {deal?.title || t('customer.deal')}
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Manrope', marginTop: 8, textAlign: 'center' }}>
              {provider?.business_name || t('customer.provider')}
            </Text>
            <View style={{ backgroundColor: '#ffd9de', marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', color: '#fff', fontSize: 18 }}>{formattedDiscount} {t('customer.off_upper')}</Text>
            </View>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1} delay={200}>
          <View style={{ borderRadius: 40, padding: 32, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: colors.outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 }}>
            {isClaimed && redemption.qr_code_hash ? (
              <>
                {QRCode && Platform.OS !== 'web' ? (
                  <QRCode value={redemption.qr_code_hash} size={220} color="#231917" backgroundColor="white" />
                ) : (
                  <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#85736f', borderRadius: 16 }}>
                    <MaterialIcons name="qr-code" size={80} color="#231917" />
                    <Text style={{ color: '#231917', fontSize: 12, marginTop: 12, textAlign: 'center', fontFamily: 'monospace', paddingHorizontal: 16 }} numberOfLines={3}>
                      {redemption.qr_code_hash}
                    </Text>
                  </View>
                )}
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 16, textAlign: 'center', fontFamily: 'Manrope' }}>
                  {t('customer.showToProvider')}
                </Text>
              </>
            ) : isRedeemed ? (
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <MaterialIcons name="check-circle" size={48} color="#16a34a" />
                </View>
                <Text style={{ color: '#15803d', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 18 }}>{t('customer.redeemed')}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center', fontFamily: 'Manrope' }}>
                  {t('customer.redeemedSuccess')}
                </Text>
              </View>
            ) : (
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="error-outline" size={48} color="#85736f" />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center' }}>{t('customer.qrNotAvailable')}</Text>
              </View>
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={2} delay={300}>
          <View style={{
            marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: isClaimed ? '#ffdcba' : isRedeemed ? '#ffdeaa' : colors.surfaceContainerHigh,
          }}>
            <MaterialIcons
              name={isClaimed ? 'pending' : isRedeemed ? 'check-circle' : 'cancel'}
              size={18}
              color={isClaimed ? '#7b5733' : isRedeemed ? '#16a34a' : '#85736f'}
            />
            <Text style={{
              fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1,
              color: isClaimed ? '#654425' : isRedeemed ? '#654500' : colors.onSurfaceVariant,
            }}>
              {isClaimed ? t('customer.readyToScan') : isRedeemed ? t('customer.redeemed') : redemption.status}
            </Text>
          </View>
        </AnimatedEntrance>

        {isRedeemed && (
          <AnimatedEntrance index={3} delay={400}>
            <AnimatedButton
              variant="gradient"
              style={{ marginTop: 32, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 }}
              onPress={() => router.push({ pathname: '/(customer)/rate/[redemptionId]', params: { redemptionId: redemptionId! } } as any)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="star" size={20} color="white" />
                <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16 }}>{t('customer.rateExperience')}</Text>
              </View>
            </AnimatedButton>
          </AnimatedEntrance>
        )}

        {isClaimed && (
          <AnimatedEntrance index={3} delay={400}>
            <View style={{ marginTop: 32, padding: 20, borderRadius: 16, backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant, width: '100%' }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>{t('customer.howToRedeem')}</Text>
              {[
                {icon: 'store', text: t('customer.visitStore') },
                { icon: 'qr-code', text: t('customer.showQR') },
                { icon: 'check-circle', text: t('customer.staffScans') },
                { icon: 'star', text: t('customer.rateAfter') },
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={step.icon as any} size={16} color="#862045" />
                  </View>
                  <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, fontFamily: 'Manrope', flex: 1 }}>{step.text}</Text>
                </View>
              ))}
            </View>
          </AnimatedEntrance>
        )}
      </View>
    </View>
  );
}
