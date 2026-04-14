import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { redeemDeal, fetchRedemptionByQrHash } from '../../lib/api';
import { notifyDealRedeemed, notifyProviderDealRedeemed, sendLocalNotification } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { useThemeColors } from '../../hooks/use-theme-colors';
import type { RedeemDealResult } from '../../lib/types';

// Camera is only available on native platforms
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  const camModule = require('expo-camera');
  CameraView = camModule.CameraView;
  useCameraPermissions = camModule.useCameraPermissions;
} catch {
  // Not available on web
}

export default function ScanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(Platform.OS === 'web');
  const [scanResult, setScanResult] = useState<RedeemDealResult | null>(null);
  const [isScanningActive, setIsScanningActive] = useState(false);

  // Camera permission (native only)
  const permissionHook = useCameraPermissions ? useCameraPermissions() : [null, null];
  const permission = permissionHook[0];
  const requestPermission = permissionHook[1];

  const bgSurface = colors.surfaceBg;
  const bgSurfaceContainerLowest = colors.surfaceContainerLowest;
  const bgSurfaceContainer = colors.surfaceContainer;
  const textOnSurface = colors.onSurface;
  const textOnSurfaceVariant = colors.onSurfaceVariant;
  const borderOutlineVariant10 = colors.outlineVariant;

  const s = StyleSheet.create({
    flex1: { flex: 1 },
    bgSurface: { backgroundColor: bgSurface },
    bgSurfaceContainerLowest: { backgroundColor: bgSurfaceContainerLowest },
    bgSurfaceContainer: { backgroundColor: bgSurfaceContainer },
    bgPrimary10: { backgroundColor: 'rgba(134,32,69,0.1)' },
    bgBlack: { backgroundColor: 'black' },
    bgBlack50: { backgroundColor: 'rgba(0,0,0,0.5)' },
    bgBlack80: { backgroundColor: 'rgba(0,0,0,0.8)' },
    bgWhite20: { backgroundColor: 'rgba(255,255,255,0.2)' },
    bgTransparent: { backgroundColor: 'transparent' },
    textOnSurface: { color: textOnSurface },
    textOnSurfaceVariant: { color: textOnSurfaceVariant },
    textWhite: { color: 'white' },
    textPrimary: { color: colors.primary },
    fontHeadline: { fontFamily: 'Cairo' },
    fontBody: { fontFamily: 'Cairo' },
    absolute: { position: 'absolute' as const },
    absoluteInset0: { position: 'absolute' as const, top: 0, end: 0, bottom: 0, start: 0 },
    relative: { position: 'relative' as const },
    flexRow: { flexDirection: 'row' as const },
    itemsCenter: { alignItems: 'center' as const },
    justifyCenter: { justifyContent: 'center' as const },
    justifyBetween: { justifyContent: 'space-between' as const },
    wFull: { width: '100%' },
    maxWsm: { maxWidth: 384 },
    w24: { width: 96 },
    h24: { height: 96 },
    w72: { width: 288 },
    h72: { height: 288 },
    w12: { width: 48 },
    h12: { height: 48 },
    rounded2xl: { borderRadius: 16 },
    rounded3xl: { borderRadius: 24 },
    roundedFull: { borderRadius: 9999 },
    roundedTlXl: { borderTopStartRadius: 12 },
    roundedTrXl: { borderTopEndRadius: 12 },
    roundedBlXl: { borderBottomStartRadius: 12 },
    roundedBrXl: { borderBottomEndRadius: 12 },
    p4: { padding: 16 },
    p6: { padding: 24 },
    px4: { paddingHorizontal: 16 },
    px6: { paddingHorizontal: 24 },
    px8: { paddingHorizontal: 32 },
    px10: { paddingHorizontal: 40 },
    py2: { paddingVertical: 8 },
    py3: { paddingVertical: 12 },
    py4: { paddingVertical: 16 },
    pt14: { paddingTop: 56 },
    pb4: { paddingBottom: 16 },
    pb32: { paddingBottom: 128 },
    mb2: { marginBottom: 8 },
    mb3: { marginBottom: 12 },
    mb4: { marginBottom: 16 },
    mb6: { marginBottom: 24 },
    mb8: { marginBottom: 32 },
    mt2: { marginTop: 8 },
    mt3: { marginTop: 12 },
    mt4: { marginTop: 16 },
    mt8: { marginTop: 32 },
    gap2: { gap: 8 },
    textXs: { fontSize: 12 },
    textSm: { fontSize: 14 },
    textBase: { fontSize: 16 },
    textXl: { fontSize: 20 },
    text2xl: { fontSize: 24 },
    fontBold: { fontWeight: '700' as const },
    textCenter: { textAlign: 'center' as const },
    uppercase: { textTransform: 'uppercase' as const },
    trackingTight: { letterSpacing: -0.2 },
    trackingWider: { letterSpacing: 0.5 },
    leadingRelaxed: { lineHeight: 20 },
    top0: { top: 0 },
    left0: { start: 0 },
    right0: { end: 0 },
    bottom0: { bottom: 0 },
    borderTop4: { borderTopWidth: 4 },
    borderRight4: { borderEndWidth: 4 },
    borderBottom4: { borderBottomWidth: 4 },
    borderLeft4: { borderStartWidth: 4 },
    borderWhite: { borderColor: 'white' },
    borderOutlineVariant10: { borderColor: borderOutlineVariant10 },
  });

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || isProcessing) return;
    setScanned(true);
    setIsProcessing(true);

    try {
      const result = await redeemDeal(data);
      setScanResult(result);

      if (result.success) {
        // Send notification to customer and provider about deal redemption
        try {
          if (result.redemption_id) {
            const redemption = await fetchRedemptionByQrHash(data);
            const dealTitle = result.deal_title || 'Deal';

            if (redemption?.customer?.user_id) {
              await notifyDealRedeemed(
                redemption.customer.user_id,
                dealTitle,
                ''
              );
            }

            // Notify provider (DB + local notification)
            const { data: { user: providerUser } } = await supabase.auth.getUser();
            if (providerUser) {
              await notifyProviderDealRedeemed(
                providerUser.id,
                dealTitle,
                result.redemption_id
              );
              await sendLocalNotification(
                'Deal Redeemed!',
                `Your deal "${dealTitle}" has been redeemed by a customer.`,
                { type: 'deal_redeemed' }
              );
            }
          }
        } catch (notifErr) {
          console.warn('Failed to send redemption notification:', notifErr);
        }

        // Navigate to scan result screen with the result data
        router.push({
          pathname: '/(provider)/scan-result',
          params: {
            success: 'true',
            dealTitle: result.deal_title || '',
            discountValue: String(result.discount_value || ''),
            discountType: result.discount_type || '',
            redemptionId: result.redemption_id || '',
          },
        });
      } else {
        Alert.alert(t('provider.scanFailed'), result.error || t('provider.scanFailedAlert'), [
          { text: t('customer.tryAgain'), onPress: () => { setScanned(false); setScanResult(null); } },
        ]);
      }
    } catch (err: any) {
      Alert.alert(t('auth.error'), err.message || t('auth.somethingWentWrong'), [
          { text: t('customer.tryAgain'), onPress: () => { setScanned(false); setScanResult(null); } },
        ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert(t('provider.enterCodeTitle'), t('provider.enterCodeAlert'));
      return;
    }
    await handleBarCodeScanned({ data: manualCode.trim() });
  };

  // Web or camera not available — show manual entry
  if (Platform.OS === 'web' || !CameraView) {
    return (
      <ScreenWrapper>
        <View style={[s.wFull, s.px6, s.pt14, s.pb4, s.flexRow, s.justifyBetween, s.itemsCenter]}>
          <Text style={[s.fontHeadline, s.fontBold, s.trackingTight, s.textXl, s.textOnSurface]}>
            {t('provider.scanQRCode')}
          </Text>
        </View>

        <View style={[s.flex1, { paddingTop: 112 }, s.px6, s.itemsCenter, s.justifyCenter]}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={[s.itemsCenter, s.mb8]}>
              <View style={[s.w24, s.h24, s.roundedFull, s.bgPrimary10, s.itemsCenter, s.justifyCenter, s.mb6]}>
                <MaterialIcons name="qr-code-scanner" size={48} color={colors.primary} />
              </View>
              <Text style={[s.fontHeadline, s.fontBold, s.text2xl, s.textOnSurface, s.textCenter, s.trackingTight]}>
                {t('provider.manualEntry')}
              </Text>
              <Text style={[s.textOnSurfaceVariant, s.fontBody, s.textSm, s.mt2, s.textCenter]}>
                {t('provider.cameraNotAvailable')}
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={200}>
            <View style={[s.wFull, s.maxWsm]}>
              <TextInput
                style={[s.rounded2xl, s.p4, s.textBase, s.fontBody, s.textCenter, s.bgSurfaceContainerLowest, s.textOnSurface, s.borderOutlineVariant10]}
                placeholder={t('provider.enterCode')}
                placeholderTextColor={colors.iconDefault}
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <AnimatedButton
                variant="gradient"
                style={[s.mt4, s.py4, s.rounded2xl]}
                onPress={handleManualSubmit}
                disabled={isProcessing}
              >
                <View style={[s.flexRow, s.itemsCenter, s.justifyCenter, s.gap2]}>
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text style={[s.textWhite, s.fontHeadline, s.fontBold, s.textBase]}>
                    {isProcessing ? t('provider.validating') : t('provider.validateCode')}
                  </Text>
                </View>
              </AnimatedButton>
            </View>
           </AnimatedEntrance>
        </View>
      </ScreenWrapper>
    );
  }

  // Camera permission handling (native)
  if (!permission) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[s.textOnSurfaceVariant]}>{t('feed.loading')}</Text>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={[s.itemsCenter]}>
            <View style={[s.w24, s.h24, s.roundedFull, s.bgPrimary10, s.itemsCenter, s.justifyCenter, s.mb6]}>
               <MaterialIcons name="camera-alt" size={48} color={colors.primary} />
            </View>
            <Text style={[s.fontHeadline, s.fontBold, s.text2xl, s.textOnSurface, s.textCenter]}>
              {t('provider.cameraAccess')}
            </Text>
            <Text style={[s.textOnSurfaceVariant, s.fontBody, s.textSm, s.mt3, s.textCenter, s.leadingRelaxed]}>
              {t('provider.cameraAccessDesc')}
            </Text>
            <AnimatedButton
              variant="gradient"
              style={[s.mt8, s.px10, s.py4, s.rounded2xl]}
              onPress={requestPermission}
            >
              <Text style={[s.textWhite, s.fontHeadline, s.fontBold, s.textBase]}>{t('provider.grantPermission')}</Text>
            </AnimatedButton>
            <AnimatedButton
              style={[s.mt4, s.py3]}
              onPress={() => setShowManualEntry(true)}
            >
              <Text style={[s.textPrimary, s.fontBody, s.textSm]}>{t('provider.enterManually')}</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </ScreenWrapper>
    );
  }

  return (
    <View style={[s.flex1, s.bgBlack]}>
      {/* Camera View */}
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned || !isScanningActive ? undefined : (result: any) => handleBarCodeScanned({ data: result.data })}
      />

      {/* Scanner Overlay */}
      <View style={[s.absoluteInset0, s.itemsCenter, s.justifyCenter]}>
        {/* Dark overlay with cutout effect */}
        <View style={[s.absoluteInset0, s.bgBlack50]} />

        {/* Scanner Frame */}
        <View style={[s.w72, s.h72, s.relative]}>
          {/* Remove overlay from scan area */}
          <View style={[s.absoluteInset0, s.bgTransparent]} />

          {/* Corner brackets */}
          <View style={[s.absolute, s.top0, s.left0, s.w12, s.h12, s.borderTop4, s.borderLeft4, s.borderWhite, s.roundedTlXl]} />
          <View style={[s.absolute, s.top0, s.right0, s.w12, s.h12, s.borderTop4, s.borderRight4, s.borderWhite, s.roundedTrXl]} />
          <View style={[s.absolute, s.bottom0, s.left0, s.w12, s.h12, s.borderBottom4, s.borderLeft4, s.borderWhite, s.roundedBlXl]} />
          <View style={[s.absolute, s.bottom0, s.right0, s.w12, s.h12, s.borderBottom4, s.borderRight4, s.borderWhite, s.roundedBrXl]} />
        </View>
      </View>

      {/* Top Bar */}
      <View style={[s.absolute, s.top0, s.wFull, s.px6, s.pt14, s.pb4, s.flexRow, s.justifyBetween, s.itemsCenter]}>
        <Text style={[s.fontHeadline, s.fontBold, s.textWhite, s.textXl, s.trackingTight]}>{t('provider.scanQR')}</Text>
        <AnimatedButton
          style={[s.bgWhite20, s.px4, s.py2, s.roundedFull]}
          onPress={() => setShowManualEntry(true)}
        >
            <Text style={[s.textWhite, s.textXs, s.fontBold, s.uppercase, s.trackingWider]}>{t('provider.manualEntry')}</Text>
        </AnimatedButton>
      </View>

      {/* Bottom Instructions */}
      <View style={[s.absolute, s.bottom0, s.wFull, s.px6, {paddingBottom: 128}, s.itemsCenter]}>
        {!isScanningActive && !scanned ? (
          <AnimatedButton
            variant="gradient"
            style={[s.px8, s.py4, s.rounded2xl]}
            onPress={() => { setIsScanningActive(true); setScanned(false); setScanResult(null); }}
          >
            <View style={[s.flexRow, s.itemsCenter, s.justifyCenter, s.gap2]}>
              <MaterialIcons name="qr-code-scanner" size={20} color="white" />
              <Text style={[s.textWhite, s.fontHeadline, s.fontBold, s.textBase]}>
                {t('provider.startScanning')}
              </Text>
            </View>
          </AnimatedButton>
        ) : scanned ? (
          <AnimatedButton
            variant="gradient"
            style={[s.px8, s.py4, s.rounded2xl]}
            onPress={() => { setScanned(false); setScanResult(null); setIsScanningActive(true); }}
          >
            <View style={[s.flexRow, s.itemsCenter, s.justifyCenter, s.gap2]}>
              <MaterialIcons name="refresh" size={20} color="white" />
              <Text style={[s.textWhite, s.fontHeadline, s.fontBold, s.textBase]}>{t('provider.tapScanAgain')}</Text>
            </View>
          </AnimatedButton>
        ) : (
          <View style={[s.itemsCenter]}>
            <View style={[s.bgWhite20, s.rounded2xl, s.px6, s.py4, s.mb4]}>
              <Text style={[s.textWhite, s.fontBody, s.textSm, s.textCenter]}>
                {t('provider.pointCamera')}
              </Text>
            </View>
            <AnimatedButton
              style={[s.bgWhite20, s.px6, s.py3, s.roundedFull]}
              onPress={() => setIsScanningActive(false)}
            >
              <Text style={[s.textWhite, s.fontBold, s.textSm]}>{t('provider.stopScanning')}</Text>
            </AnimatedButton>
          </View>
        )}
      </View>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <View style={[s.absoluteInset0, s.bgBlack80, s.itemsCenter, s.justifyCenter, s.px8]}>
          <View style={[s.wFull, s.maxWsm, s.rounded3xl, s.p6, s.bgSurfaceContainerLowest]}>
            <Text style={[s.fontHeadline, s.fontBold, s.textXl, s.textOnSurface, s.textCenter, s.mb2]}>
              {t('provider.enterCodeManually')}
            </Text>
            <Text style={[s.textOnSurfaceVariant, s.textSm, s.textCenter, s.mb6, s.fontBody]}>
              {t('provider.typeRedemptionCode')}
            </Text>
            <TextInput
              style={[s.rounded2xl, s.p4, s.textBase, s.fontBody, s.textCenter, s.mb4, s.bgSurfaceContainer, s.textOnSurface, s.borderOutlineVariant10]}
              placeholder={t('provider.redemptionCodePlaceholder')}
              placeholderTextColor={colors.iconDefault}
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedButton
              variant="gradient"
              style={[s.py3, s.rounded2xl, s.mb3]}
              onPress={handleManualSubmit}
              disabled={isProcessing}
            >
              <Text style={[s.textWhite, s.fontHeadline, s.fontBold, s.textBase, s.textCenter]}>
                {isProcessing ? t('provider.validating') : t('provider.validate')}
              </Text>
            </AnimatedButton>
            <AnimatedButton
              style={[s.py3, s.itemsCenter]}
              onPress={() => setShowManualEntry(false)}
            >
              <Text style={[s.textOnSurfaceVariant, s.fontBody, s.textSm]}>{t('provider.backToCamera')}</Text>
             </AnimatedButton>
           </View>
         </View>
       )}
     </View>
   );
 }
