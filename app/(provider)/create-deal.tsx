import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  Text,
  TextInput, useColorScheme,
  View,
} from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { createDeal, fetchCategories, uploadDealImage } from '../../lib/api';
import type { Category, DiscountType } from '../../lib/types';

export default function CreateDealScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [endDate, setEndDate] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('100');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [terms, setTerms] = useState('');

  // Image state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState('');
  const [imageType, setImageType] = useState('image/jpeg');

  // UI state
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1=Details, 2=Review, 3=Done
  const [formError, setFormError] = useState('');

  // Cross-platform alert helper
  const showAlert = (title: string, message: string, onOk?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
      onOk?.();
    } else {
      Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    loadCategories();
  }, []);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageFileName(asset.fileName || `deal_${Date.now()}.jpg`);
      setImageType(asset.mimeType || 'image/jpeg');
    }
  };

  const validateForm = (): string | null => {
    if (!title.trim()) return 'Deal title is required';
    if (!discountValue || parseFloat(discountValue) <= 0) return 'Discount value must be greater than 0';
    if (discountType === 'percentage' && parseFloat(discountValue) > 100) return 'Percentage cannot exceed 100';
    if (!endDate.trim()) return 'Expiry date is required';

    // Basic date validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(endDate.trim())) return 'Date must be in YYYY-MM-DD format';

    const parsedDate = new Date(endDate.trim());
    if (isNaN(parsedDate.getTime())) return 'Invalid date';
    if (parsedDate <= new Date()) return 'Expiry date must be in the future';

    if (!maxRedemptions || parseInt(maxRedemptions) <= 0) return 'Max redemptions must be positive';

    return null;
  };

  const handleNextStep = () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError('');
    setStep(2);
  };

  const handlePublish = async () => {
    setSubmitting(true);
    setFormError('');
    try {
      // Upload image if selected
      let imageUrl: string | undefined;
      if (imageUri) {
        console.log('[CreateDeal] Uploading image...');
        imageUrl = await uploadDealImage(imageUri, imageFileName, imageType);
        console.log('[CreateDeal] Image uploaded:', imageUrl);
      }

      const now = new Date();
      const dealInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        discount_value: parseFloat(discountValue),
        type: discountType,
        category_id: selectedCategoryId || undefined,
        image_url: imageUrl,
        start_time: now.toISOString(),
        end_time: new Date(endDate.trim() + 'T23:59:59').toISOString(),
        max_redemptions: parseInt(maxRedemptions),
        status: 'active' as const,
      };
      console.log('[CreateDeal] Creating deal with input:', JSON.stringify(dealInput, null, 2));
      await createDeal(dealInput);
      console.log('[CreateDeal] Deal created successfully!');

      setStep(3);
    } catch (err: any) {
      const msg = err.message || 'Failed to create deal';
      setFormError(msg);
      showAlert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      let imageUrl: string | undefined;
      if (imageUri) {
        imageUrl = await uploadDealImage(imageUri, imageFileName, imageType);
      }

      const now = new Date();
      await createDeal({
        title: title.trim(),
        description: description.trim() || undefined,
        discount_value: parseFloat(discountValue),
        type: discountType,
        category_id: selectedCategoryId || undefined,
        image_url: imageUrl,
        start_time: now.toISOString(),
        end_time: new Date(endDate.trim() + 'T23:59:59').toISOString(),
        max_redemptions: parseInt(maxRedemptions),
        status: 'draft',
      });

      showAlert('Saved', 'Deal saved as draft.', () => router.back());
    } catch (err: any) {
      const msg = err.message || 'Failed to save draft';
      setFormError(msg);
      showAlert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step 3: Success ───────────────────────────
  if (step === 3) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6">
        <AnimatedEntrance index={0}>
          <View className="items-center">
            <View className="w-16 h-16 rounded-full bg-green-500/10 items-center justify-center mb-4">
              <MaterialIcons name="check-circle" size={36} color="#10b981" />
            </View>
            <Text className="font-headline font-bold text-xl text-on-surface text-center mb-2">
              Deal Published!
            </Text>
            <Text className="font-body text-on-surface-variant text-center text-sm leading-5 max-w-[260px] mb-5">
              Your deal "{title}" is now live and visible to customers.
            </Text>
            <AnimatedButton
              variant="gradient"
              className="w-full py-2.5 rounded-full items-center justify-center mb-3"
              onPress={() => router.push('/(provider)/dashboard')}
            >
              <Text className="text-white font-body font-bold text-sm">Back to Dashboard</Text>
            </AnimatedButton>
            <AnimatedButton
              className="w-full py-2.5 rounded-full border-2 border-outline-variant/20 items-center justify-center"
              onPress={() => {
                setTitle(''); setDescription(''); setDiscountValue('');
                setEndDate(''); setTerms(''); setImageUri(null);
                setSelectedCategoryId(null); setMaxRedemptions('100');
                setStep(1);
              }}
            >
              <Text className="font-body font-bold text-sm text-on-surface">Create Another Deal</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-3">
          <AnimatedButton
            className="w-8 h-8 rounded-full bg-surface-container-high items-center justify-center p-0"
            onPress={() => step === 2 ? setStep(1) : router.back()}
          >
            <MaterialIcons name="arrow-back" size={18} color="#85736f" />
          </AnimatedButton>
          <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
            {step === 1 ? 'Create New Deal' : 'Review & Publish'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}>

          {/* Progress Stepper */}
          <AnimatedEntrance index={0}>
            <View className="flex-row items-center justify-between mb-5 w-full">
              {[
                { num: 1, label: 'Details' },
                { num: 2, label: 'Review' },
                { num: 3, label: 'Finish' },
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  {idx > 0 && <View className="flex-1 h-[2px] mx-3 bg-surface-container-highest" />}
                  <View className={`items-center gap-1 ${step < s.num ? 'opacity-40' : ''}`}>
                    <View className={`w-7 h-7 rounded-full items-center justify-center ${step >= s.num ? 'bg-primary' : 'bg-surface-container-highest'
                      }`}>
                      <Text className={`font-bold text-xs ${step >= s.num ? 'text-white' : 'text-on-surface-variant'
                        }`}>{s.num}</Text>
                    </View>
                    <Text className={`text-[9px] font-label font-bold uppercase tracking-widest ${step >= s.num ? 'text-primary' : 'text-on-surface-variant'
                      }`}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </AnimatedEntrance>

          {step === 1 ? (
            /* ── Step 1: Details Form ──────────────── */
            <AnimatedEntrance index={1} className="space-y-4 flex flex-col gap-4">
              {/* Image Upload */}
              <View>
                <Text className="font-headline font-bold text-sm text-on-surface ml-1 mb-1.5">Cover Image</Text>
                <AnimatedButton
                  className={`w-full ${imageUri ? '' : 'aspect-[16/9]'} border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low items-center justify-center overflow-hidden`}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <View className="w-full aspect-[16/9]">
                      <Image source={{ uri: imageUri }} className="w-full h-full" contentFit="cover" />
                      <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-3 py-1 flex-row items-center gap-1">
                        <MaterialIcons name="edit" size={14} color="white" />
                        <Text className="text-white text-xs font-bold">Change</Text>
                      </View>
                    </View>
                  ) : (
                    <View className="items-center p-5">
                      <MaterialIcons name="cloud-upload" size={28} color="#862045" />
                      <Text className="font-body font-semibold text-sm text-on-surface mt-1.5">Tap to upload deal image</Text>
                      <Text className="text-[10px] text-on-surface-variant mt-0.5">Recommended: 1200x675px (PNG, JPG)</Text>
                    </View>
                  )}
                </AnimatedButton>
              </View>

              {/* Deal Title */}
              <View>
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Deal Title</Text>
                <TextInput
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm border-outline-variant/10"
                  placeholderTextColor="#85736f"
                  placeholder="e.g. Summer Weekend Special"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View>
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Description</Text>
                <TextInput
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm border-outline-variant/10 h-20 text-left"
                  placeholderTextColor="#85736f"
                  placeholder="Describe your deal..."
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Category Picker */}
              <View>
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row" contentContainerStyle={{ gap: 8 }}>
                  {categories.map((cat) => (
                    <AnimatedButton
                      key={cat.id}
                      className={`px-3 py-2 rounded-lg flex-row items-center gap-1.5 ${selectedCategoryId === cat.id
                          ? 'bg-primary/10 border-primary'
                          : 'bg-surface-container-lowest border-outline-variant/10'
                        }`}
                      onPress={() => setSelectedCategoryId(
                        selectedCategoryId === cat.id ? null : cat.id
                      )}
                    >
                      <MaterialIcons
                        name={(cat.icon || 'category') as any}
                        size={14}
                        color={selectedCategoryId === cat.id ? '#862045' : '#85736f'}
                      />
                      <Text className={`font-body font-semibold text-xs ${selectedCategoryId === cat.id ? 'text-primary' : 'text-on-surface-variant'
                        }`}>
                        {cat.name}
                      </Text>
                    </AnimatedButton>
                  ))}
                </ScrollView>
              </View>

              {/* Discount & Expiry Row */}
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Discount</Text>
                  <View className="relative flex-row items-center">
                    <TextInput
                      className="flex-1 px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm border-outline-variant/10"
                      placeholderTextColor="#85736f"
                      placeholder="25"
                      keyboardType="number-pad"
                      value={discountValue}
                      onChangeText={setDiscountValue}
                    />
                    <AnimatedButton
                      className="absolute right-2 px-2 py-1 rounded-md"
                      onPress={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
                    >
                      <Text className="font-bold text-primary text-sm">
                        {discountType === 'percentage' ? '%' : '$'}
                      </Text>
                    </AnimatedButton>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Expiry Date</Text>
                  <TextInput
                    className="flex-1 px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm border-outline-variant/10"
                    placeholderTextColor="#85736f"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              {/* Max Redemptions */}
              <View>
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Max Redemptions</Text>
                <TextInput
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm border-outline-variant/10"
                  placeholderTextColor="#85736f"
                  placeholder="100"
                  keyboardType="number-pad"
                  value={maxRedemptions}
                  onChangeText={setMaxRedemptions}
                />
              </View>

              {/* Terms */}
              <View>
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Terms & Conditions</Text>
                <TextInput
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest text-on-surface text-sm font-medium shadow-sm border-outline-variant/10 h-24 text-left"
                  placeholderTextColor="#85736f"
                  placeholder="Mention any restrictions or redemption rules..."
                  multiline
                  textAlignVertical="top"
                  value={terms}
                  onChangeText={setTerms}
                />
              </View>
            </AnimatedEntrance>
          ) : (
            /* ── Step 2: Review ───────────────────── */
            <AnimatedEntrance index={1}>
              <Text className="font-headline font-bold text-base text-on-surface ml-1 mb-3">Card Preview</Text>
              <View className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border-outline-variant/10 mb-5">
                <View className="relative h-32">
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} className="w-full h-full" contentFit="cover" />
                  ) : (
                    <View className="flex-1 bg-surface-container items-center justify-center">
                      <MaterialIcons name="image" size={32} color="#bec8d1" />
                    </View>
                  )}
                  <View className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />
                  <View className="absolute bottom-3 left-4">
                    {selectedCategoryId && (
                      <View className="bg-primary self-start px-3 py-1 rounded-full mb-1">
                        <Text className="text-white font-label font-bold text-[10px] uppercase tracking-tighter">
                          {categories.find(c => c.id === selectedCategoryId)?.name || 'DEAL'}
                        </Text>
                      </View>
                    )}
                    <Text className="text-white font-headline font-bold text-lg tracking-tight">
                      {title || 'Deal Title'}
                    </Text>
                  </View>
                </View>
                <View className="p-4 flex-row justify-between items-center">
                  <View>
                    <Text className="text-primary font-headline font-bold text-xl">
                      {discountType === 'percentage' ? `-${discountValue || '0'}%` : `$${discountValue || '0'} off`}
                    </Text>
                    <Text className="text-on-surface-variant text-[10px] font-medium">
                      Valid until {endDate || '--'} • Max {maxRedemptions} uses
                    </Text>
                  </View>
                </View>
                {description ? (
                  <View className="px-4 pb-3">
                    <Text className="text-on-surface-variant text-xs leading-4">{description}</Text>
                  </View>
                ) : null}
                {terms ? (
                  <View className="px-4 pb-4 pt-2 border-t border-surface-container">
                    <Text className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Terms</Text>
                    <Text className="text-on-surface-variant text-xs italic">"{terms}"</Text>
                  </View>
                ) : null}
              </View>
            </AnimatedEntrance>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Banner */}
      {formError ? (
        <View className="absolute bottom-20 left-4 right-4 z-50 bg-red-500/90 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
          <MaterialIcons name="error" size={16} color="white" />
          <Text className="text-white font-body text-xs flex-1">{formError}</Text>
          <AnimatedButton onPress={() => setFormError('')} className="p-1">
            <MaterialIcons name="close" size={14} color="white" />
          </AnimatedButton>
        </View>
      ) : null}

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 w-full z-50 px-4 pb-4 pt-3 flex-row gap-3 bg-surface/90 border-t border-outline-variant/10">
        {step === 1 ? (
          <>
            <AnimatedButton
              className="flex-1 py-2.5 rounded-full border-2 border-outline-variant/20 items-center justify-center"
              onPress={handleSaveDraft}
              disabled={submitting}
            >
              <Text className="font-body font-bold text-sm text-on-surface">
                {submitting ? 'Saving...' : 'Save Draft'}
              </Text>
            </AnimatedButton>
            <AnimatedButton
              variant="gradient"
              className="flex-[2] py-2.5 rounded-full items-center justify-center"
              onPress={handleNextStep}
            >
              <Text className="font-body font-bold text-white text-sm">Next: Review</Text>
            </AnimatedButton>
          </>
        ) : (
          <>
            <AnimatedButton
              className="flex-1 py-2.5 rounded-full border-2 border-outline-variant/20 items-center justify-center"
              onPress={() => setStep(1)}
            >
              <Text className="font-body font-bold text-sm text-on-surface">Edit</Text>
            </AnimatedButton>
            <AnimatedButton
              variant="gradient"
              className="flex-[2] py-2.5 rounded-full items-center justify-center flex-row gap-2"
              onPress={handlePublish}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialIcons name="publish" size={16} color="white" />
              )}
              <Text className="font-body font-bold text-white text-sm">
                {submitting ? 'Publishing...' : 'Publish Deal'}
              </Text>
            </AnimatedButton>
          </>
        )}
      </View>
    </View>
  );
}
