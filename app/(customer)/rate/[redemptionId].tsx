import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, I18nManager, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { fetchRedemptionById, submitReview } from '../../../lib/api';
import { useThemeColors } from '../../../hooks/use-theme-colors';

export default function RateScreen() {
  const { t } = useTranslation();
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const router = useRouter();
  const colors = useThemeColors();

  const [redemption, setRedemption] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(t('customer.ratingRequired'), t('customer.selectStarRating'));
      return;
    }
    setIsSubmitting(true);
    const result = await submitReview(redemptionId!, rating, comment || undefined);
    setIsSubmitting(false);
    if (result.success) {
      setIsSubmitted(true);
    } else {
      Alert.alert(t('auth.error'), result.error || t('customer.couldNotSubmitReview'));
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWrapper>
    );
  }

  if (isSubmitted) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.successContainer, alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <MaterialIcons name="check-circle" size={56} color={colors.success} />
            </View>
            <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 30, color: colors.onSurface, textAlign: 'center', letterSpacing: -0.5 }}>{t('customer.thankYou')}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', fontSize: 16, marginTop: 12, textAlign: 'center', lineHeight: 24 }}>
              {t('customer.reviewHelps')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <MaterialIcons key={i} name="star" size={32} color={i <= rating ? colors.warning : colors.surfaceContainerHigh} />
              ))}
            </View>
            <AnimatedButton
              variant="gradient"
              style={{ marginTop: 40, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 }}
              onPress={() => router.replace('/(customer)/dashboard')}
            >
              <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 16 }}>{t('customer.backToMyDeals')}</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </ScreenWrapper>
    );
  }

  const deal = redemption?.discount;
  const provider = deal?.provider;

  return (
    <ScreenWrapper>
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.surfaceBg }}>
        <AnimatedButton
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
        </AnimatedButton>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 20, color: colors.onSurface, flexShrink: 1 }}>{t('customer.rateExperience')}</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 32 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, marginEnd: 16, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="local-offer" size={28} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface }} numberOfLines={1}>{deal?.title || t('customer.deal')}</Text>
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 4 }}>{provider?.business_name || t('customer.provider')}</Text>
            </View>
            <View style={{ backgroundColor: colors.successContainer, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ color: colors.successOnContainer, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>{t('customer.redeemed')}</Text>
            </View>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1} delay={200}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, marginBottom: 8 }}>{t('customer.howWasIt')}</Text>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', fontSize: 14, marginBottom: 24 }}>{t('customer.tapToRate')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <AnimatedButton key={i} style={{ padding: 4 }} onPress={() => setRating(i)}>
                  <MaterialIcons name="star" size={44} color={i <= rating ? colors.warning : colors.surfaceContainerHigh} />
                </AnimatedButton>
              ))}
            </View>
            {rating > 0 && (
              <Text style={{ color: colors.onSurfaceVariant, fontSize: 14, marginTop: 12, fontFamily: 'Cairo' }}>
                {rating === 1 ? t('customer.ratingPoor') : rating === 2 ? t('customer.ratingFair') : rating === 3 ? t('customer.ratingGood') : rating === 4 ? t('customer.ratingGreat') : t('customer.ratingExcellent')}
              </Text>
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={2} delay={300}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginBottom: 12 }}>
              {t('customer.addComment')} <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '400' }}>({t('customer.optional')})</Text>
            </Text>
            <TextInput
              style={{
                borderRadius: 16, padding: 16, fontSize: 16, fontFamily: 'Cairo', minHeight: 120,
                backgroundColor: colors.surfaceContainerLowest, color: colors.onSurface, borderWidth: 1, borderColor: colors.outlineVariant,
                textAlignVertical: 'top',
              }}
              placeholder={t('customer.sharePlaceholder')}
              placeholderTextColor={colors.iconDefault}
              multiline
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, marginTop: 8, textAlign: 'auto' }}>{comment.length}/500</Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={3} delay={400}>
          <AnimatedButton
            variant="gradient"
            style={{ paddingVertical: 16, borderRadius: 16, opacity: (isSubmitting || rating === 0) ? 0.6 : 1 }}
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            <Text style={{ color: colors.onPrimary, fontFamily: 'Cairo_700Bold', fontSize: 18, textAlign: 'center' }}>
              {isSubmitting ? t('auth.submitting') : t('customer.submitReview')}
            </Text>
          </AnimatedButton>
          <AnimatedButton style={{ marginTop: 16, paddingVertical: 12, alignItems: 'center' }} onPress={() => router.back()}>
            <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', fontSize: 14 }}>{t('customer.skipForNow')}</Text>
          </AnimatedButton>
        </AnimatedEntrance>
      </View>
    </ScreenWrapper>
  );
}
