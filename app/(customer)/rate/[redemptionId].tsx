import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { fetchRedemptionById, submitReview } from '../../../lib/api';

export default function RateScreen() {
  const { redemptionId } = useLocalSearchParams<{ redemptionId: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    setIsSubmitting(true);
    const result = await submitReview(redemptionId!, rating, comment || undefined);
    setIsSubmitting(false);
    if (result.success) {
      setIsSubmitted(true);
    } else {
      Alert.alert('Error', result.error || 'Could not submit review. Please try again.');
    }
  };

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
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

  if (isSubmitted) {
    return (
      <View style={{ flex: 1, backgroundColor: surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: isDark ? 'rgba(22,163,74,0.3)' : '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <MaterialIcons name="check-circle" size={56} color="#16a34a" />
            </View>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '900', fontSize: 30, color: onSurface, textAlign: 'center', letterSpacing: -0.5 }}>Thank You!</Text>
            <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', fontSize: 16, marginTop: 12, textAlign: 'center', lineHeight: 24 }}>
              Your review helps other customers and the business improve. A deal slot has been freed!
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <MaterialIcons key={i} name="star" size={32} color={i <= rating ? '#f59e0b' : '#d8c2bd'} />
              ))}
            </View>
            <AnimatedButton
              variant="gradient"
              style={{ marginTop: 40, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 16 }}
              onPress={() => router.replace('/(customer)/dashboard')}
            >
              <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16 }}>Back to My Deals</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
    );
  }

  const deal = redemption?.discount;
  const provider = deal?.provider;

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: surfaceBg }}>
        <AnimatedButton
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#85736f" />
        </AnimatedButton>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 20, color: onSurface }}>Rate Experience</Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <AnimatedEntrance index={0} delay={100}>
          <View style={{ backgroundColor: surfaceContainerLowest, borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: outlineVariant, marginBottom: 32 }}>
            <View style={{ width: 56, height: 56, borderRadius: 16, marginRight: 16, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <MaterialIcons name="local-offer" size={28} color="#862045" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface }} numberOfLines={1}>{deal?.title || 'Deal'}</Text>
              <Text style={{ color: onSurfaceVariant, fontSize: 14, marginTop: 4 }}>{provider?.business_name || 'Provider'}</Text>
            </View>
            <View style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.3)' : '#dcfce7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
              <Text style={{ color: isDark ? '#86efac' : '#15803d', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Redeemed</Text>
            </View>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1} delay={200}>
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginBottom: 8 }}>How was it?</Text>
            <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', fontSize: 14, marginBottom: 24 }}>Tap a star to rate</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <AnimatedButton key={i} style={{ padding: 4 }} onPress={() => setRating(i)}>
                  <MaterialIcons name="star" size={44} color={i <= rating ? '#f59e0b' : '#d8c2bd'} />
                </AnimatedButton>
              ))}
            </View>
            {rating > 0 && (
              <Text style={{ color: onSurfaceVariant, fontSize: 14, marginTop: 12, fontFamily: 'Manrope' }}>
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent!'}
              </Text>
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={2} delay={300}>
          <View style={{ marginBottom: 32 }}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface, marginBottom: 12 }}>
              Add a Comment <Text style={{ color: onSurfaceVariant, fontSize: 12, fontWeight: '400' }}>(optional)</Text>
            </Text>
            <TextInput
              style={{
                borderRadius: 16, padding: 16, fontSize: 16, fontFamily: 'Manrope', minHeight: 120,
                backgroundColor: surfaceContainerLowest, color: onSurface, borderWidth: 1, borderColor: outlineVariant,
                textAlignVertical: 'top',
              }}
              placeholder="Share your experience..."
              placeholderTextColor="#85736f"
              multiline
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text style={{ color: onSurfaceVariant, fontSize: 12, marginTop: 8, textAlign: 'right' }}>{comment.length}/500</Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={3} delay={400}>
          <AnimatedButton
            variant="gradient"
            style={{ paddingVertical: 16, borderRadius: 16, opacity: (isSubmitting || rating === 0) ? 0.6 : 1 }}
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            <Text style={{ color: '#fff', fontFamily: 'Epilogue', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </AnimatedButton>
          <AnimatedButton style={{ marginTop: 16, paddingVertical: 12, alignItems: 'center' }} onPress={() => router.back()}>
            <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', fontSize: 14 }}>Skip for now</Text>
          </AnimatedButton>
        </AnimatedEntrance>
      </View>
    </View>
  );
}
