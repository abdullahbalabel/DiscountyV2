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

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#862045" />
      </View>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-8">
        <AnimatedEntrance index={0} delay={100}>
          <View className="items-center">
            <View className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mb-6">
              <MaterialIcons name="check-circle" size={56} color="#16a34a" />
            </View>
            <Text className="font-headline font-black text-3xl text-on-surface text-center tracking-tight">
              Thank You!
            </Text>
            <Text className="text-on-surface-variant font-body text-base mt-3 text-center leading-relaxed">
              Your review helps other customers and the business improve. A deal slot has been freed!
            </Text>

            {/* Star display */}
            <View className="flex-row items-center gap-2 mt-6">
              {[1, 2, 3, 4, 5].map(i => (
                <MaterialIcons key={i} name="star" size={32} color={i <= rating ? '#f59e0b' : '#d8c2bd'} />
              ))}
            </View>

            <AnimatedButton
              variant="gradient"
              className="mt-10 px-10 py-4 rounded-2xl"
              onPress={() => router.replace('/(customer)/dashboard')}
            >
              <Text className="text-white font-headline font-bold text-base">Back to My Deals</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
    );
  }

  const deal = redemption?.discount;
  const provider = deal?.provider;

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-4">
          <AnimatedButton
            className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center p-0"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <Text className="font-headline font-bold tracking-tighter text-xl text-on-surface">
            Rate Experience
          </Text>
        </View>
      </View>

      <View className="flex-1 px-6">
        {/* Deal Info Card */}
        <AnimatedEntrance index={0} delay={100}>
          <View className="bg-surface-container-lowest rounded-3xl p-5 flex-row items-center border-outline-variant/10 mb-8">
            <View className="w-14 h-14 rounded-2xl mr-4 bg-primary/10 items-center justify-center">
              <MaterialIcons name="local-offer" size={28} color="#862045" />
            </View>
            <View className="flex-1">
              <Text className="font-headline font-bold text-base text-on-surface" numberOfLines={1}>
                {deal?.title || 'Deal'}
              </Text>
              <Text className="text-on-surface-variant text-sm mt-1">
                {provider?.business_name || 'Provider'}
              </Text>
            </View>
            <View className="bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
              <Text className="text-green-700 dark:text-green-300 text-[10px] font-bold uppercase tracking-wider">
                Redeemed
              </Text>
            </View>
          </View>
        </AnimatedEntrance>

        {/* Star Rating */}
        <AnimatedEntrance index={1} delay={200}>
          <View className="items-center mb-8">
            <Text className="font-headline font-bold text-xl text-on-surface mb-2">How was it?</Text>
            <Text className="text-on-surface-variant font-body text-sm mb-6">Tap a star to rate</Text>
            <View className="flex-row items-center gap-3">
              {[1, 2, 3, 4, 5].map(i => (
                <AnimatedButton
                  key={i}
                  className="p-1"
                  onPress={() => setRating(i)}
                >
                  <MaterialIcons
                    name="star"
                    size={44}
                    color={i <= rating ? '#f59e0b' : '#d8c2bd'}
                  />
                </AnimatedButton>
              ))}
            </View>
            {rating > 0 && (
              <Text className="text-on-surface-variant text-sm mt-3 font-body">
                {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Great' : 'Excellent!'}
              </Text>
            )}
          </View>
        </AnimatedEntrance>

        {/* Comment */}
        <AnimatedEntrance index={2} delay={300}>
          <View className="mb-8">
            <Text className="font-headline font-bold text-base text-on-surface mb-3">
              Add a Comment <Text className="text-on-surface-variant text-xs font-normal">(optional)</Text>
            </Text>
            <TextInput
              className="rounded-2xl p-4 text-base font-body min-h-[120px] bg-surface-container-lowest text-on-surface border-outline-variant/10"
              placeholder="Share your experience..."
              placeholderTextColor="#85736f"
              multiline
              textAlignVertical="top"
              value={comment}
              onChangeText={setComment}
              maxLength={500}
            />
            <Text className="text-on-surface-variant text-xs mt-2 text-right">{comment.length}/500</Text>
          </View>
        </AnimatedEntrance>

        {/* Submit */}
        <AnimatedEntrance index={3} delay={400}>
          <AnimatedButton
            variant="gradient"
            className="py-4 rounded-2xl shadow-xl"
            onPress={handleSubmit}
            disabled={isSubmitting || rating === 0}
          >
            <Text className="text-white font-headline font-bold text-lg text-center">
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </AnimatedButton>

          <AnimatedButton
            className="mt-4 py-3 items-center"
            onPress={() => router.back()}
          >
            <Text className="text-on-surface-variant font-body text-sm">Skip for now</Text>
          </AnimatedButton>
        </AnimatedEntrance>
      </View>
    </View>
  );
}
