import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '../../components/ui/EmptyState';
import { useThemeColors } from '../../hooks/use-theme-colors';

export default function ProviderReviewsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('provider.reviews')}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <EmptyState
          icon="rate-review"
          title={t('provider.noReviewsYetProvider')}
          message={t('provider.reviewsAppearHere')}
        />
      </View>
    </View>
  );
}
