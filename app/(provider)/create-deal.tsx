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

let LinearGradient: any;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
  LinearGradient = View;
}

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
      <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <AnimatedEntrance index={0}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MaterialIcons name="check-circle" size={36} color="#10b981" />
            </View>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 20, color: isDark ? '#f1dfda' : '#231917', textAlign: 'center', marginBottom: 8 }}>
              Deal Published!
            </Text>
            <Text style={{ fontFamily: 'Manrope', color: isDark ? '#d8c2bd' : '#564340', textAlign: 'center', fontSize: 14, lineHeight: 20, maxWidth: 260, marginBottom: 20 }}>
              Your deal "{title}" is now live and visible to customers.
            </Text>
            <AnimatedButton
              variant="gradient"
              style={{ width: '100%', paddingVertical: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => router.push('/(provider)/dashboard')}
            >
              <Text style={{ color: 'white', fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 14 }}>Back to Dashboard</Text>
            </AnimatedButton>
            <AnimatedButton
              style={{ width: '100%', paddingVertical: 10, borderRadius: 999, borderWidth: 2, borderColor: isDark ? 'rgba(160,141,136,0.2)' : 'rgba(133,115,111,0.2)', alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                setTitle(''); setDescription(''); setDiscountValue('');
                setEndDate(''); setTerms(''); setImageUri(null);
                setSelectedCategoryId(null); setMaxRedemptions('100');
                setStep(1);
              }}
            >
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 14, color: isDark ? '#f1dfda' : '#231917' }}>Create Another Deal</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6' }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#1a110f' : '#fff8f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AnimatedButton
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? '#534340' : '#f5ddd9', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onPress={() => step === 2 ? setStep(1) : router.back()}
          >
            <MaterialIcons name="arrow-back" size={18} color="#85736f" />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', letterSpacing: -0.02, fontSize: 18, color: isDark ? '#f1dfda' : '#231917' }}>
            {step === 1 ? 'Create New Deal' : 'Review & Publish'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 16 }}>

          {/* Progress Stepper */}
          <AnimatedEntrance index={0}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, width: '100%' }}>
              {[
                { num: 1, label: 'Details' },
                { num: 2, label: 'Review' },
                { num: 3, label: 'Finish' },
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  {idx > 0 && <View style={{ flex: 1, height: 2, marginHorizontal: 12, backgroundColor: isDark ? '#534340' : '#f5ddd9' }} />}
                  <View style={{ alignItems: 'center', gap: 4, opacity: step < s.num ? 0.4 : 1 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: step >= s.num ? '#862045' : (isDark ? '#534340' : '#f5ddd9'),
                    }}>
                      <Text style={{
                        fontWeight: 'bold', fontSize: 12,
                        color: step >= s.num ? 'white' : (isDark ? '#d8c2bd' : '#564340'),
                      }}>{s.num}</Text>
                    </View>
                    <Text style={{
                      fontSize: 9, fontFamily: 'Manrope', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.15,
                      color: step >= s.num ? '#862045' : (isDark ? '#d8c2bd' : '#564340'),
                    }}>{s.label}</Text>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </AnimatedEntrance>

          {step === 1 ? (
            /* ── Step 1: Details Form ──────────────── */
            <AnimatedEntrance index={1} style={{ gap: 16 }}>
              {/* Image Upload */}
              <View>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 14, color: isDark ? '#f1dfda' : '#231917', marginLeft: 4, marginBottom: 6 }}>Cover Image</Text>
                <AnimatedButton
                  style={{
                    width: '100%', aspectRatio: imageUri ? undefined : 16 / 9,
                    borderWidth: 2, borderStyle: 'dashed',
                    borderColor: isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)',
                    borderRadius: 12, backgroundColor: isDark ? '#271d1b' : '#fff0ed',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <View style={{ width: '100%', aspectRatio: 16 / 9 }}>
                      <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="edit" size={14} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Change</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                      <MaterialIcons name="cloud-upload" size={28} color="#862045" />
                      <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 14, color: isDark ? '#f1dfda' : '#231917', marginTop: 6 }}>Tap to upload deal image</Text>
                      <Text style={{ fontSize: 10, color: isDark ? '#d8c2bd' : '#564340', marginTop: 2 }}>Recommended: 1200x675px (PNG, JPG)</Text>
                    </View>
                  )}
                </AnimatedButton>
              </View>

              {/* Deal Title */}
              <View>
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Deal Title</Text>
                <TextInput
                  style={{
                    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                    backgroundColor: isDark ? '#322825' : '#ffffff',
                    color: isDark ? '#f1dfda' : '#231917', fontSize: 14, fontWeight: '500',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                    borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                  }}
                  placeholderTextColor="#85736f"
                  placeholder="e.g. Summer Weekend Special"
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View>
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Description</Text>
                <TextInput
                  style={{
                    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                    backgroundColor: isDark ? '#322825' : '#ffffff',
                    color: isDark ? '#f1dfda' : '#231917', fontSize: 14, fontWeight: '500',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                    borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                    height: 80, textAlignVertical: 'top',
                  }}
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
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }} contentContainerStyle={{ gap: 8 }}>
                  {categories.map((cat) => (
                    <AnimatedButton
                      key={cat.id}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6,
                        backgroundColor: selectedCategoryId === cat.id ? 'rgba(134,32,69,0.1)' : (isDark ? '#322825' : '#ffffff'),
                        borderWidth: 1,
                        borderColor: selectedCategoryId === cat.id ? '#862045' : (isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)'),
                      }}
                      onPress={() => setSelectedCategoryId(
                        selectedCategoryId === cat.id ? null : cat.id
                      )}
                    >
                      <MaterialIcons
                        name={(cat.icon || 'category') as any}
                        size={14}
                        color={selectedCategoryId === cat.id ? '#862045' : '#85736f'}
                      />
                      <Text style={{
                        fontFamily: 'Manrope', fontWeight: '600', fontSize: 12,
                        color: selectedCategoryId === cat.id ? '#862045' : (isDark ? '#d8c2bd' : '#564340'),
                      }}>
                        {cat.name}
                      </Text>
                    </AnimatedButton>
                  ))}
                </ScrollView>
              </View>

              {/* Discount & Expiry Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Discount</Text>
                  <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                      style={{
                        flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                        backgroundColor: isDark ? '#322825' : '#ffffff',
                        color: isDark ? '#f1dfda' : '#231917', fontSize: 14, fontWeight: '500',
                        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                        borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                      }}
                      placeholderTextColor="#85736f"
                      placeholder="25"
                      keyboardType="number-pad"
                      value={discountValue}
                      onChangeText={setDiscountValue}
                    />
                    <AnimatedButton
                      style={{ position: 'absolute', right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                      onPress={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
                    >
                      <Text style={{ fontWeight: 'bold', color: '#862045', fontSize: 14 }}>
                        {discountType === 'percentage' ? '%' : '$'}
                      </Text>
                    </AnimatedButton>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Expiry Date</Text>
                  <TextInput
                    style={{
                      flex: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                      backgroundColor: isDark ? '#322825' : '#ffffff',
                      color: isDark ? '#f1dfda' : '#231917', fontSize: 14, fontWeight: '500',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                      borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                    }}
                    placeholderTextColor="#85736f"
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              {/* Max Redemptions */}
              <View>
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Max Redemptions</Text>
                <TextInput
                  style={{
                    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                    backgroundColor: isDark ? '#322825' : '#ffffff',
                    color: isDark ? '#f1dfda' : '#231917', fontSize: 14, fontWeight: '500',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                    borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                  }}
                  placeholderTextColor="#85736f"
                  placeholder="100"
                  keyboardType="number-pad"
                  value={maxRedemptions}
                  onChangeText={setMaxRedemptions}
                />
              </View>

              {/* Terms */}
              <View>
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Terms & Conditions</Text>
                <TextInput
                  style={{
                    width: '100%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                    backgroundColor: isDark ? '#322825' : '#ffffff',
                    color: isDark ? '#f1dfda' : '#231917', fontSize: 14, fontWeight: '500',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                    borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                    height: 96, textAlignVertical: 'top',
                  }}
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
              <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 16, color: isDark ? '#f1dfda' : '#231917', marginLeft: 4, marginBottom: 12 }}>Card Preview</Text>
              <View style={{
                backgroundColor: isDark ? '#322825' : '#ffffff', borderRadius: 12, overflow: 'hidden',
                shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
                borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', borderWidth: 1,
                marginBottom: 20,
              }}>
                <View style={{ position: 'relative', height: 128 }}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: isDark ? '#3d3230' : '#f0e0dc', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="image" size={32} color="#bec8d1" />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 }}
                  />
                  <View style={{ position: 'absolute', bottom: 12, left: 16 }}>
                    {selectedCategoryId && (
                      <View style={{ backgroundColor: '#862045', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, marginBottom: 4 }}>
                        <Text style={{ color: 'white', fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: -0.01 }}>
                          {categories.find(c => c.id === selectedCategoryId)?.name || 'DEAL'}
                        </Text>
                      </View>
                    )}
                    <Text style={{ color: 'white', fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 18, letterSpacing: -0.02 }}>
                      {title || 'Deal Title'}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: '#862045', fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 20 }}>
                      {discountType === 'percentage' ? `-${discountValue || '0'}%` : `$${discountValue || '0'} off`}
                    </Text>
                    <Text style={{ color: isDark ? '#d8c2bd' : '#564340', fontSize: 10, fontWeight: '500' }}>
                      Valid until {endDate || '--'} • Max {maxRedemptions} uses
                    </Text>
                  </View>
                </View>
                {description ? (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    <Text style={{ color: isDark ? '#d8c2bd' : '#564340', fontSize: 12, lineHeight: 16 }}>{description}</Text>
                  </View>
                ) : null}
                {terms ? (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#3d3230' : '#f0e0dc' }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: isDark ? '#d8c2bd' : '#564340', textTransform: 'uppercase', letterSpacing: 0.15, marginBottom: 4 }}>Terms</Text>
                    <Text style={{ color: isDark ? '#d8c2bd' : '#564340', fontSize: 12, fontStyle: 'italic' }}>"{terms}"</Text>
                  </View>
                ) : null}
              </View>
            </AnimatedEntrance>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Banner */}
      {formError ? (
        <View style={{
          position: 'absolute', bottom: 80, left: 16, right: 16, zIndex: 50,
          backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <MaterialIcons name="error" size={16} color="white" />
          <Text style={{ color: 'white', fontFamily: 'Manrope', fontSize: 12, flex: 1 }}>{formError}</Text>
          <AnimatedButton onPress={() => setFormError('')} style={{ padding: 4 }}>
            <MaterialIcons name="close" size={14} color="white" />
          </AnimatedButton>
        </View>
      ) : null}

      {/* Bottom Action Bar */}
      <View style={{
        position: 'absolute', bottom: 0, width: '100%', zIndex: 50,
        paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, flexDirection: 'row', gap: 12,
        backgroundColor: isDark ? 'rgba(26,17,15,0.9)' : 'rgba(255,248,246,0.9)',
        borderTopWidth: 1, borderTopColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)',
      }}>
        {step === 1 ? (
          <>
            <AnimatedButton
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 999,
                borderWidth: 2, borderColor: isDark ? 'rgba(160,141,136,0.2)' : 'rgba(133,115,111,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
              onPress={handleSaveDraft}
              disabled={submitting}
            >
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 14, color: isDark ? '#f1dfda' : '#231917' }}>
                {submitting ? 'Saving...' : 'Save Draft'}
              </Text>
            </AnimatedButton>
            <AnimatedButton
              variant="gradient"
              style={{ flex: 2, paddingVertical: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
              onPress={handleNextStep}
            >
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', color: 'white', fontSize: 14 }}>Next: Review</Text>
            </AnimatedButton>
          </>
        ) : (
          <>
            <AnimatedButton
              style={{
                flex: 1, paddingVertical: 10, borderRadius: 999,
                borderWidth: 2, borderColor: isDark ? 'rgba(160,141,136,0.2)' : 'rgba(133,115,111,0.2)',
                alignItems: 'center', justifyContent: 'center',
              }}
              onPress={() => setStep(1)}
            >
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 14, color: isDark ? '#f1dfda' : '#231917' }}>Edit</Text>
            </AnimatedButton>
            <AnimatedButton
              variant="gradient"
              style={{ flex: 2, paddingVertical: 10, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
              onPress={handlePublish}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <MaterialIcons name="publish" size={16} color="white" />
              )}
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', color: 'white', fontSize: 14 }}>
                {submitting ? 'Publishing...' : 'Publish Deal'}
              </Text>
            </AnimatedButton>
          </>
        )}
      </View>
    </View>
  );
}
