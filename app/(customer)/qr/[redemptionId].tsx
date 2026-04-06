import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Animated as RNAnimated, Easing as RNEasing, I18nManager, Platform, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { fetchRedemptionById } from '../../../lib/api';
import { useThemeColors, Radius, Shadows } from '../../../hooks/use-theme-colors';

let QRCode: any = null;
try { QRCode = require('react-native-qrcode-svg').default; } catch {}

export default function QRDisplayScreen() {
  const { t } = useTranslation();
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [redemption, setRedemption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Pulsing animation for "Ready to Scan" badge
  const pulseAnim = useRef(new RNAnimated.Value(1)).current;

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 800,
          easing: RNEasing.inOut(RNEasing.ease),
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: RNEasing.inOut(RNEasing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

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
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginTop: 16 }}>{t('customer.notFound')}</Text>
        <Text style={{ fontFamily: 'Cairo', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>{t('customer.redemptionNotFound')}</Text>
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
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceBg }}>
        <AnimatedButton
          style={{ width: 40, height: 40, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.back()}
        >
          <MaterialIcons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={20} color={colors.iconDefault} />
        </AnimatedButton>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('customer.qrCode')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Deal Info */}
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 22, color: colors.onSurface, textAlign: 'center', letterSpacing: -0.5 }} numberOfLines={2}>
              {deal?.title || t('customer.deal')}
            </Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', fontSize: 14, marginTop: 6, textAlign: 'center' }}>
              {provider?.business_name || t('customer.provider')}
            </Text>
            <View style={{ backgroundColor: colors.primary, marginTop: 12, paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.md }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', color: '#fff', fontSize: 16 }}>{formattedDiscount} {t('customer.off_upper')}</Text>
            </View>
          </View>
        </AnimatedEntrance>

        {/* QR Code Card */}
        <AnimatedEntrance index={1} delay={200}>
          <View style={{
            borderRadius: 24, padding: 32, alignItems: 'center', backgroundColor: '#fff',
            borderWidth: 1, borderColor: colors.outlineVariant, ...Shadows.lg,
          }}>
            {isClaimed && redemption.qr_code_hash ? (
              <>
                {QRCode && Platform.OS !== 'web' ? (
                  <QRCode value={redemption.qr_code_hash} size={200} color="#231917" backgroundColor="white" />
                ) : (
                  <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: '#85736f', borderRadius: 16 }}>
                    <MaterialIcons name="qr-code" size={72} color="#231917" />
                    <Text style={{ color: '#231917', fontSize: 11, marginTop: 12, textAlign: 'center', fontFamily: 'monospace', paddingHorizontal: 16 }} numberOfLines={3}>
                      {redemption.qr_code_hash}
                    </Text>
                  </View>
                )}
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 13, marginTop: 16, textAlign: 'center', fontFamily: 'Cairo' }}>
                  {t('customer.showToProvider')}
                </Text>
              </>
            ) : isRedeemed ? (
              <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <MaterialIcons name="check-circle" size={48} color="#16a34a" />
                </View>
                <Text style={{ color: '#15803d', fontFamily: 'Cairo_700Bold', fontSize: 18 }}>{t('customer.redeemed')}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center', fontFamily: 'Cairo' }}>
                  {t('customer.redeemedSuccess')}
                </Text>
              </View>
            ) : (
              <View style={{ width: 200, height: 200, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="error-outline" size={48} color="#85736f" />
                <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center' }}>{t('customer.qrNotAvailable')}</Text>
              </View>
            )}
          </View>
        </AnimatedEntrance>

        {/* Status Badge */}
        {isClaimed ? (
          <RNAnimated.View style={{
            marginTop: 20, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: '#b45309', opacity: pulseAnim,
          }}>
            <MaterialIcons name="pending" size={18} color="#fff" />
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
              color: '#fff',
            }}>
              {t('customer.readyToScan')}
            </Text>
          </RNAnimated.View>
        ) : (
          <View style={{
            marginTop: 20, paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: isRedeemed ? '#dcfce7' : colors.surfaceContainerHigh,
          }}>
            <MaterialIcons
              name={isRedeemed ? 'check-circle' : 'cancel'}
              size={18}
              color={isRedeemed ? '#16a34a' : '#85736f'}
            />
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1,
              color: isRedeemed ? '#15803d' : colors.onSurfaceVariant,
            }}>
              {isRedeemed ? t('customer.redeemed') : redemption.status}
            </Text>
          </View>
        )}

        {/* Rate Experience Button (redeemed only) */}
        {isRedeemed && (
          <AnimatedEntrance index={3} delay={400}>
            <AnimatedButton
              variant="gradient"
              style={{ marginTop: 24, width: '100%', paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => router.push({ pathname: '/(customer)/rate/[redemptionId]', params: { redemptionId: redemptionId! } } as any)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name="star" size={20} color="white" />
                <Text style={{ color: '#fff', fontFamily: 'Cairo_700Bold', fontSize: 15 }}>{t('customer.rateExperience')}</Text>
              </View>
            </AnimatedButton>
          </AnimatedEntrance>
        )}

        {/* How to Redeem (claimed only) */}
        {isClaimed && (
          <AnimatedEntrance index={3} delay={400}>
            <View style={{
              marginTop: 24, padding: 20, borderRadius: Radius.xl,
              backgroundColor: colors.surfaceContainerLowest, borderWidth: 1, borderColor: colors.outlineVariant,
            }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 16 }}>{t('customer.howToRedeem')}</Text>
              {[
                { icon: 'store', text: t('customer.visitStore') },
                { icon: 'qr-code', text: t('customer.showQR') },
                { icon: 'check-circle', text: t('customer.staffScans') },
                { icon: 'star', text: t('customer.rateAfter') },
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: i < 3 ? 12 : 0 }}>
                  <View style={{ width: 36, height: 36, borderRadius: Radius.md, backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={step.icon as any} size={18} color={colors.primary} />
                  </View>
                  <Text style={{ color: colors.onSurface, fontSize: 14, fontFamily: 'Cairo', flex: 1, lineHeight: 20 }}>{step.text}</Text>
                </View>
              ))}
            </View>
          </AnimatedEntrance>
        )}
      </ScrollView>
    </View>
  );
}
