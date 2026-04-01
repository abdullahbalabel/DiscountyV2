import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, Text, TextInput, useColorScheme, View } from 'react-native';
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
      <View className="flex-1 bg-surface">
        <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
          <Text className="font-headline font-bold tracking-tight text-xl text-on-surface">
            Scan QR Code
          </Text>
        </View>

        <View className="flex-1 pt-28 px-6 items-center justify-center">
          <AnimatedEntrance index={0} delay={100}>
            <View className="items-center mb-8">
              <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
                <MaterialIcons name="qr-code-scanner" size={48} color="#862045" />
              </View>
              <Text className="font-headline font-bold text-2xl text-on-surface text-center tracking-tight">
                Manual Code Entry
              </Text>
              <Text className="text-on-surface-variant font-body text-sm mt-2 text-center">
                Camera is not available. Enter the redemption code manually.
              </Text>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={200}>
            <View className="w-full max-w-sm">
              <TextInput
                className="rounded-2xl p-4 text-base font-body text-center bg-surface-container-lowest text-on-surface border-outline-variant/10"
                placeholder="Enter redemption code..."
                placeholderTextColor="#85736f"
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <AnimatedButton
                variant="gradient"
                className="mt-4 py-4 rounded-2xl"
                onPress={handleManualSubmit}
                disabled={isProcessing}
              >
                <View className="flex-row items-center justify-center gap-2">
                  <MaterialIcons name="check-circle" size={20} color="white" />
                  <Text className="text-white font-headline font-bold text-base">
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
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-on-surface-variant">Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <AnimatedEntrance index={0} delay={100}>
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
              <MaterialIcons name="camera-alt" size={48} color="#862045" />
            </View>
            <Text className="font-headline font-bold text-2xl text-on-surface text-center">
              Camera Access Needed
            </Text>
            <Text className="text-on-surface-variant font-body text-sm mt-3 text-center leading-relaxed">
              We need camera access to scan customer QR codes for deal redemption.
            </Text>
            <AnimatedButton
              variant="gradient"
              className="mt-8 px-10 py-4 rounded-2xl"
              onPress={requestPermission}
            >
              <Text className="text-white font-headline font-bold text-base">Grant Permission</Text>
            </AnimatedButton>
            <AnimatedButton
              className="mt-4 py-3"
              onPress={() => setShowManualEntry(true)}
            >
              <Text className="text-primary font-body text-sm">Enter code manually instead</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
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
      <View className="absolute inset-0 items-center justify-center">
        {/* Dark overlay with cutout effect */}
        <View className="absolute inset-0 bg-black/50" />

        {/* Scanner Frame */}
        <View className="w-72 h-72 relative">
          {/* Remove overlay from scan area */}
          <View className="absolute inset-0 bg-black/0" />

          {/* Corner brackets */}
          <View className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-xl" />
          <View className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-xl" />
          <View className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-xl" />
          <View className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-xl" />
        </View>
      </View>

      {/* Top Bar */}
      <View className="absolute top-0 w-full px-6 pt-14 pb-4 flex-row justify-between items-center">
        <Text className="font-headline font-bold text-white text-xl tracking-tight">Scan QR</Text>
        <AnimatedButton
          className="bg-white/20 px-4 py-2 rounded-full"
          onPress={() => setShowManualEntry(true)}
        >
          <Text className="text-white text-xs font-bold uppercase tracking-wider">Manual Entry</Text>
        </AnimatedButton>
      </View>

      {/* Bottom Instructions */}
      <View className="absolute bottom-0 w-full px-6 pb-32 items-center">
        <View className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4">
          <Text className="text-white font-body text-sm text-center">
            Point camera at customer's QR code
          </Text>
        </View>
        {scanned && (
          <AnimatedButton
            className="mt-4 bg-white/20 px-6 py-3 rounded-full"
            onPress={() => { setScanned(false); setScanResult(null); }}
          >
            <Text className="text-white font-bold text-sm">Tap to Scan Again</Text>
          </AnimatedButton>
        )}
      </View>

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <View className="absolute inset-0 bg-black/80 items-center justify-center px-8">
          <View className="w-full max-w-sm rounded-3xl p-6 bg-surface-container-lowest">
            <Text className="font-headline font-bold text-xl text-on-surface text-center mb-2">
              Enter Code Manually
            </Text>
            <Text className="text-on-surface-variant text-sm text-center mb-6 font-body">
              Type the redemption code from the customer
            </Text>
            <TextInput
              className="rounded-2xl p-4 text-base font-body text-center mb-4 bg-surface-container text-on-surface border-outline-variant/10"
              placeholder="Redemption code..."
              placeholderTextColor="#85736f"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AnimatedButton
              variant="gradient"
              className="py-3 rounded-2xl mb-3"
              onPress={handleManualSubmit}
              disabled={isProcessing}
            >
              <Text className="text-white font-headline font-bold text-base text-center">
                {isProcessing ? 'Validating...' : 'Validate'}
              </Text>
            </AnimatedButton>
            <AnimatedButton
              className="py-3 items-center"
              onPress={() => setShowManualEntry(false)}
            >
              <Text className="text-on-surface-variant font-body text-sm">Back to Camera</Text>
            </AnimatedButton>
          </View>
        </View>
      )}
    </View>
  );
}
