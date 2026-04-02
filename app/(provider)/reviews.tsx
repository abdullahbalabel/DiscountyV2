import React from 'react';
import { View, Text, useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';

export default function ProviderReviewsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 20, color: onSurface }}>Reviews</Text>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <AnimatedEntrance index={0}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: surfaceContainerHigh }}>
              <MaterialIcons name="rate-review" size={56} color="#7b5733" />
            </View>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 24, color: onSurface, textAlign: 'center', marginBottom: 12 }}>No Reviews Yet</Text>
            <Text style={{ fontFamily: 'Manrope', color: onSurfaceVariant, textAlign: 'center', fontSize: 16, lineHeight: 24, maxWidth: 280 }}>
              Customer reviews will appear here after they redeem your deals.
            </Text>
          </View>
        </AnimatedEntrance>
      </View>
    </View>
  );
}
