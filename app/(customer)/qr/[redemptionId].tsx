import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { fetchRedemptionById } from '../../../lib/api';

let QRCode: any = null;
try { QRCode = require('react-native-qrcode-svg').default; } catch {}

export default function QRDisplayScreen() {
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [redemption, setRedemption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!redemptionId) return;
      try {
        const data = await fetchRedemptionById(redemptionId);
        setRedemption(data);
      } catch (err) {
        console.error('Error loading redemption:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [redemptionId]);

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#862045" />
      </View>
    );
  }

  if (!redemption) {
    return (
      <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <MaterialIcons name="error-outline" size={48} color="#85736f" />
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginTop: 16 }}>Not Found</Text>
        <Text style={{ fontFamily: 'Manrope', color: onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>This redemption could not be found.</Text>
        <AnimatedButton style={{ marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#862045', borderRadius: 8 }} onPress={() => router.back()}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
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
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: surfaceBg }}>
        <AnimatedButton
          style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#85736f" />
        </AnimatedButton>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 20, color: onSurface }}>Your QR Code</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24, alignItems: 'center' }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '900', fontSize: 24, color: onSurface, textAlign: 'center', letterSpacing: -0.5 }} numberOfLines={2}>
              {deal?.title || 'Deal'}
            </Text>
            <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', marginTop: 8, textAlign: 'center' }}>
              {provider?.business_name || 'Provider'}
            </Text>
            <View style={{ backgroundColor: '#ffd9de', marginTop: 12, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', color: '#fff', fontSize: 18 }}>{formattedDiscount} OFF</Text>
            </View>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1} delay={200}>
          <View style={{ borderRadius: 40, padding: 32, alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: outlineVariant, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 24, elevation: 8 }}>
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
                <Text style={{ color: onSurfaceVariant, fontSize: 12, marginTop: 16, textAlign: 'center', fontFamily: 'Manrope' }}>
                  Show this to the provider to redeem
                </Text>
              </>
            ) : isRedeemed ? (
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <MaterialIcons name="check-circle" size={48} color="#16a34a" />
                </View>
                <Text style={{ color: '#15803d', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 18 }}>Redeemed!</Text>
                <Text style={{ color: onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center', fontFamily: 'Manrope' }}>
                  This deal has been successfully redeemed.
                </Text>
              </View>
            ) : (
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="error-outline" size={48} color="#85736f" />
                <Text style={{ color: onSurfaceVariant, fontSize: 14, marginTop: 8, textAlign: 'center' }}>QR code not available</Text>
              </View>
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={2} delay={300}>
          <View style={{
            marginTop: 24, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: isClaimed ? '#ffdcba' : isRedeemed ? '#ffdeaa' : surfaceContainerHigh,
          }}>
            <MaterialIcons
              name={isClaimed ? 'pending' : isRedeemed ? 'check-circle' : 'cancel'}
              size={18}
              color={isClaimed ? '#7b5733' : isRedeemed ? '#16a34a' : '#85736f'}
            />
            <Text style={{
              fontWeight: '700', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1,
              color: isClaimed ? '#654425' : isRedeemed ? '#654500' : onSurfaceVariant,
            }}>
              {isClaimed ? 'Ready to Scan' : isRedeemed ? 'Redeemed' : redemption.status}
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
                <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16 }}>Rate This Experience</Text>
              </View>
            </AnimatedButton>
          </AnimatedEntrance>
        )}

        {isClaimed && (
          <AnimatedEntrance index={3} delay={400}>
            <View style={{ marginTop: 32, padding: 20, borderRadius: 16, backgroundColor: surfaceContainerLowest, borderWidth: 1, borderColor: outlineVariant, width: '100%' }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, marginBottom: 12 }}>How to Redeem</Text>
              {[
                { icon: 'store', text: 'Visit the store location' },
                { icon: 'qr-code', text: 'Show this QR code to staff' },
                { icon: 'check-circle', text: 'Staff scans to confirm' },
                { icon: 'star', text: 'Rate your experience after' },
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name={step.icon as any} size={16} color="#862045" />
                  </View>
                  <Text style={{ color: onSurfaceVariant, fontSize: 14, fontFamily: 'Manrope', flex: 1 }}>{step.text}</Text>
                </View>
              ))}
            </View>
          </AnimatedEntrance>
        )}
      </View>
    </View>
  );
}
