import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { redeemDeal } from '../../lib/api';
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
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(Platform.OS === 'web');
  const [scanResult, setScanResult] = useState<RedeemDealResult | null>(null);

  // Camera permission (native only)
  const permissionHook = useCameraPermissions ? useCameraPermissions() : [null, null];
  const permission = permissionHook[0];
  const requestPermission = permissionHook[1];

  const bgSurface = isDark ? '#1a110f' : '#fff8f6';
  const bgSurfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const bgSurfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const textOnSurface = isDark ? '#f1dfda' : '#231917';
  const textOnSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const borderOutlineVariant10 = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

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
    textPrimary: { color: '#862045' },
    fontHeadline: { fontFamily: 'Epilogue' },
    fontBody: { fontFamily: 'Manrope' },
    absolute: { position: 'absolute' as const },
    absoluteInset0: { position: 'absolute' as const, top: 0, right: 0, bottom: 0, left: 0 },
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
    roundedTlXl: { borderTopLeftRadius: 12 },
    roundedTrXl: { borderTopRightRadius: 12 },
    roundedBlXl: { borderBottomLeftRadius: 12 },
    roundedBrXl: { borderBottomRightRadius: 12 },
    p4: { padding: 16 },
    p6: { padding: 24 },
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
    fontBold: { fontWeight: 'bold' as const },
    textCenter: { textAlign: 'center' as const },
    uppercase: { textTransform: 'uppercase' as const },
    trackingTight: { letterSpacing: -0.2 },
    trackingWider: { letterSpacing: 0.5 },
    leadingRelaxed: { lineHeight: 20 },
    top0: { top: 0 },
    left0: { left: 0 },
    right0: { right: 0 },
    bottom0: { bottom: 0 },
    borderTop4: { borderTopWidth: 4 },
    borderRight4: { borderRightWidth: 4 },
    borderBottom4: { borderBottomWidth: 4 },
    borderLeft4: { borderLeftWidth: 4 },
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
        Alert.alert('Scan Failed', result.error || 'Could not validate this QR code.', [
          { text: 'Try Again', onPress: () => { setScanned(false); setScanResult(null); } },
        ]);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong.', [
        { text: 'Try Again', onPress: () => { setScanned(false); setScanResult(null); } },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert('Enter Code', 'Please enter the redemption code.');
      return;
    }
    await handleBarCodeScanned({ data: manualCode.trim() });
  };

  // Web or camera not available — show manual entry
  if (Platform.OS === 'web' || !CameraView) {
    return (
      <View style={[s.flex1, s.bgSurface]}>
        <View style={[s.wFull, s.px6, s.pt14, s.pb4, s.flexRow, s.justifyBetween, s.itemsCenter, s.bgSurface]}>
          <Text style={[s.fontHeadline, s.fontBold, s.trackingTight, s.textXl, s.textOnSurface]}>
            Scan QR Code
          </Text>
        </View>

        <View style={[s.flex1, { paddingTop: 112 }, s.px6, s.itemsCenter, s.justifyCenter]}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={[s.itemsCenter, s.mb8]}>
              <View style={[s.w24, s.h24, s.roundedFull, s.bgPrimary10, s.itemsCenter, s.justifyCenter, s.mb6]}>
                <MaterialIcons name="qr-code-scanner" size={48} color="#862045" />
              </View>
              <Text style={[s.fontHeadline, s.fontBold, s.text2xl, s.textOnSurface, s.textCenter, s.trackingTight]}>
                Manual Code Entry
              </Text>
              <Text style={[s.textOnSurfaceVariant, s.fontBody, s.textSm, s.mt2, s.textCenter]}>
                Camera is not available. Enter the redemption code manually.
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={200}>
            <View style={[s.wFull, s.maxWsm]}>
              <TextInput
                style={[s.rounded2xl, s.p4, s.textBase, s.fontBody, s.textCenter, s.bgSurfaceContainerLowest, s.textOnSurface, s.borderOutlineVariant10]}
                placeholder="Enter redemption code..."
                placeholderTextColor="#85736f"
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
                    {isProcessing ? 'Validating...' : 'Validate Code'}
                  </Text>
                </View>
              </AnimatedButton>
            </View>
          </AnimatedEntrance>
        </View>
      </View>
    );
  }

  // Camera permission handling (native)
  if (!permission) {
    return (
      <View style={[s.flex1, s.bgSurface, s.itemsCenter, s.justifyCenter]}>
        <Text style={[s.textOnSurfaceVariant]}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[s.flex1, s.bgSurface, s.itemsCenter, s.justifyCenter, s.px8]}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={[s.itemsCenter]}>
            <View style={[s.w24, s.h24, s.roundedFull, s.bgPrimary10, s.itemsCenter, s.justifyCenter, s.mb6]}>
              <MaterialIcons name="camera-alt" size={48} color="#862045" />
            </View>
            <Text style={[s.fontHeadline, s.fontBold, s.text2xl, s.textOnSurface, s.textCenter]}>
              Camera Access Needed
            </Text>
            <Text style={[s.textOnSurfaceVariant, s.fontBody, s.textSm, s.mt3, s.textCenter, s.leadingRelaxed]}>
              We need camera access to scan customer QR codes for deal redemption.
            </Text>
            <AnimatedButton
              variant="gradient"
              style={[s.mt8, s.px10, s.py4, s.rounded2xl]}
              onPress={requestPermission}
            >
              <Text style={[s.textWhite, s.fontHeadline, s.fontBold, s.textBase]}>Grant Permission</Text>
            </AnimatedButton>
            <AnimatedButton
              style={[s.mt4, s.py3]}
              onPress={() => setShowManualEntry(true)}
            >
              <Text style={[s.textPrimary, s.fontBody, s.textSm]}>Enter code manually instead</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
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
        onBarcodeScanned={scanned ? undefined : (result: any) => handleBarCodeScanned({ data: result.data })}
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
        <Text style={[s.fontHeadline, s.fontBold, s.textWhite, s.textXl, s.trackingTight]}>Scan QR</Text>
        <AnimatedButton
          style={[s.bgWhite20, s.px4, s.py2, s.roundedFull]}
          onPress={() => setShowManualEntry(true)}
        >
          <Text style={[s.textWhite, s.textXs, s.fontBold, s.uppercase, s.trackingWider]}>Manual Entry</Text>
        </AnimatedButton>
      </View>

      {/* Bottom Instructions */}
      <View style={[s.absolute, s.bottom0, s.wFull, s.px6, {paddingBottom: 128}, s.itemsCenter]}>
        <View style={[s.bgWhite20, s.rounded2xl, s.px6, s.py4]}>
          <Text style={[s.textWhite, s.fontBody, s.textSm, s.textCenter]}>
            Point camera at customer's QR code
          </Text>
        </View>
        {scanned && (
          <AnimatedButton
            style={[s.mt4, s.bgWhite20, s.px6, s.py3, s.roundedFull]}
            onPress={() => { setScanned(false); setScanResult(null); }}
          >
            <Text style={[s.textWhite, s.fontBold, s.textSm]}>Tap to Scan Again</Text>
          </AnimatedButton>
        )}
      </View>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <View style={[s.absoluteInset0, s.bgBlack80, s.itemsCenter, s.justifyCenter, s.px8]}>
          <View style={[s.wFull, s.maxWsm, s.rounded3xl, s.p6, s.bgSurfaceContainerLowest]}>
            <Text style={[s.fontHeadline, s.fontBold, s.textXl, s.textOnSurface, s.textCenter, s.mb2]}>
              Enter Code Manually
            </Text>
            <Text style={[s.textOnSurfaceVariant, s.textSm, s.textCenter, s.mb6, s.fontBody]}>
              Type the redemption code from the customer
            </Text>
            <TextInput
              style={[s.rounded2xl, s.p4, s.textBase, s.fontBody, s.textCenter, s.mb4, s.bgSurfaceContainer, s.textOnSurface, s.borderOutlineVariant10]}
              placeholder="Redemption code..."
              placeholderTextColor="#85736f"
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
                {isProcessing ? 'Validating...' : 'Validate'}
              </Text>
            </AnimatedButton>
            <AnimatedButton
              style={[s.py3, s.itemsCenter]}
              onPress={() => setShowManualEntry(false)}
            >
              <Text style={[s.textOnSurfaceVariant, s.fontBody, s.textSm]}>Back to Camera</Text>
            </AnimatedButton>
          </View>
        </View>
      )}
    </View>
  );
}
