import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  KeyboardAvoidingView, Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { ConditionPicker } from '../../components/ui/ConditionPicker';
import { createDeal, fetchCategories, uploadDealImage } from '../../lib/api';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import type { Category, DiscountType } from '../../lib/types';

let LinearGradient: any;
try {
  LinearGradient = require('expo-linear-gradient').LinearGradient;
} catch {
  LinearGradient = View;
}

export default function CreateDealScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const colors = useThemeColors();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [endDate, setEndDate] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('100');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [terms, setTerms] = useState('');
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);

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
      showAlert(t('provider.permissionRequired'), t('provider.allowPhotoLibrary'));
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
    if (!title.trim()) return t('provider.dealTitleRequired');
    if (!discountValue || parseFloat(discountValue) <= 0) return t('provider.discountMustBePositive');
    if (discountType === 'percentage' && parseFloat(discountValue) > 100) return t('provider.percentageCannotExceed100');
    if (!endDate.trim()) return t('provider.expiryDateRequired');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(endDate.trim())) return t('provider.dateFormat');

    const parsedDate = new Date(endDate.trim());
    if (isNaN(parsedDate.getTime())) return t('provider.invalidDate');
    if (parsedDate <= new Date()) return t('provider.expiryDateFuture');

    if (!maxRedemptions || parseInt(maxRedemptions) <= 0) return t('provider.maxRedemptionsPositive');

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
        conditions: selectedConditions.length > 0 ? selectedConditions : undefined,
      };
      console.log('[CreateDeal] Creating deal with input:', JSON.stringify(dealInput, null, 2));
      await createDeal(dealInput);
      console.log('[CreateDeal] Deal created successfully!');

      setStep(3);
    } catch (err: any) {
      const msg = err.message || t('provider.failedCreateDeal');
      setFormError(msg);
      showAlert(t('auth.error'), msg);
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
        conditions: selectedConditions.length > 0 ? selectedConditions : undefined,
      });

      showAlert(t('provider.saved'), t('provider.dealSavedDraft'), () => router.back());
    } catch (err: any) {
      const msg = err.message || t('provider.failedSaveDraft');
      setFormError(msg);
      showAlert(t('auth.error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%' as const, paddingHorizontal: 16, paddingVertical: 12, borderRadius: Radius.lg,
    backgroundColor: colors.surfaceContainerLowest,
    color: colors.onSurface, fontSize: 14, fontWeight: '500' as const,
    ...Shadows.xs,
    borderColor: colors.outlineVariant, borderWidth: 1,
  };

  const labelStyle = {
    fontFamily: 'Cairo_700Bold' as const, fontSize: 12,
    textTransform: 'uppercase' as const, letterSpacing: 0.05,
    color: colors.onSurfaceVariant, marginStart: 4, marginBottom: 8,
  };

  // ── Step 3: Success ───────────────────────────
  if (step === 3) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <AnimatedEntrance index={0}>
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: Radius.glass, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <MaterialIcons name="check-circle" size={36} color={colors.success} />
            </View>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: colors.onSurface, textAlign: 'center', marginBottom: 8 }}>
              {t('provider.dealPublished')}
            </Text>
            <Text style={{ fontFamily: 'Cairo', color: colors.onSurfaceVariant, textAlign: 'center', fontSize: 14, lineHeight: 20, maxWidth: 260, marginBottom: 20 }}>
              {t('provider.dealPublishedMsg', { title })}
            </Text>
            <AnimatedButton
              variant="gradient"
              style={{ width: '100%', paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => router.push('/(provider)/dashboard')}
            >
              <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 14 }}>{t('provider.backToDashboard')}</Text>
            </AnimatedButton>
            <AnimatedButton
              style={{ width: '100%', paddingVertical: 10, borderRadius: Radius.full, borderWidth: 2, borderColor: colors.outlineVariant, alignItems: 'center', justifyContent: 'center' }}
              onPress={() => {
                setTitle(''); setDescription(''); setDiscountValue('');
                setEndDate(''); setTerms(''); setImageUri(null);
                setSelectedCategoryId(null); setMaxRedemptions('100');
                setSelectedConditions([]);
                setStep(1);
              }}
            >
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface }}>{t('provider.createAnotherDeal')}</Text>
            </AnimatedButton>
          </View>
        </AnimatedEntrance>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <AnimatedButton
            style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onPress={() => step === 2 ? setStep(1) : router.back()}
          >
            <MaterialIcons name="arrow-back" size={18} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.02, fontSize: 18, color: colors.onSurface }}>
            {step === 1 ? t('provider.createDeal') : t('provider.reviewAndPublish')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>

          {/* Progress Stepper */}
          <AnimatedEntrance index={0}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, width: '100%' }}>
              {[
                { num: 1, label: t('provider.details') },
                { num: 2, label: t('auth.review') },
                { num: 3, label: t('provider.finish') },
              ].map((s, idx) => (
                <React.Fragment key={s.num}>
                  {idx > 0 && <View style={{ flex: 1, height: 2, marginHorizontal: 12, backgroundColor: colors.surfaceContainerHigh }} />}
                  <View style={{ alignItems: 'center', gap: 4, opacity: step < s.num ? 0.4 : 1 }}>
                    <View style={{
                      width: 28, height: 28, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: step >= s.num ? colors.primary : colors.surfaceContainerHigh,
                    }}>
                      <Text style={{
                        fontWeight: '700', fontSize: 12,
                        color: step >= s.num ? 'white' : colors.onSurfaceVariant,
                      }}>{s.num}</Text>
                    </View>
                    <Text style={{
                      fontSize: 9, fontFamily: 'Cairo_700Bold', textTransform: 'uppercase', letterSpacing: 0.15,
                      color: step >= s.num ? colors.primary : colors.onSurfaceVariant,
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
                <Text style={{ ...labelStyle, fontFamily: 'Cairo', fontSize: 14, color: colors.onSurface, textTransform: 'none', letterSpacing: 0 }}>{t('provider.coverImage')}</Text>
                <AnimatedButton
                  style={{
                    width: '100%', aspectRatio: imageUri ? undefined : 16 / 9,
                    borderWidth: 2, borderStyle: 'dashed',
                    borderColor: colors.isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)',
                    borderRadius: Radius.lg, backgroundColor: colors.isDark ? colors.surfaceContainerLow : '#fff0ed',
                    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  }}
                  onPress={pickImage}
                >
                  {imageUri ? (
                    <View style={{ width: '100%', aspectRatio: 16 / 9 }}>
                      <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <MaterialIcons name="edit" size={14} color="white" />
                        <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{t('provider.change')}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', padding: 20 }}>
                      <MaterialIcons name="cloud-upload" size={28} color={colors.primary} />
                        <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface, marginTop: 6 }}>{t('provider.tapToUploadImage')}</Text>
                        <Text style={{ fontSize: 10, color: colors.onSurfaceVariant, marginTop: 2 }}>{t('provider.recommendedSize')}</Text>
                    </View>
                  )}
                </AnimatedButton>
              </View>

              {/* Deal Title */}
              <View>
                <Text style={labelStyle}>{t('provider.dealTitle')}</Text>
                <TextInput
                  style={inputStyle}
                  placeholderTextColor={colors.onSurfaceVariant}
                  placeholder={t('provider.dealTitlePlaceholder')}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              {/* Description */}
              <View>
                <Text style={labelStyle}>{t('provider.description')}</Text>
                <TextInput
                  style={{ ...inputStyle, height: 80, textAlignVertical: 'top' }}
                  placeholderTextColor={colors.onSurfaceVariant}
                  placeholder={t('provider.describeDealPlaceholder')}
                  multiline
                  textAlignVertical="top"
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              {/* Category Picker */}
              <View>
                <Text style={labelStyle}>{t('provider.category')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }} contentContainerStyle={{ gap: 8 }}>
                  {categories.map((cat) => (
                    <AnimatedButton
                      key={cat.id}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md, flexDirection: 'row', alignItems: 'center', gap: 6,
                        backgroundColor: selectedCategoryId === cat.id ? 'rgba(134,32,69,0.1)' : colors.surfaceContainerLowest,
                        borderWidth: 1,
                        borderColor: selectedCategoryId === cat.id ? colors.primary : colors.outlineVariant,
                      }}
                      onPress={() => setSelectedCategoryId(
                        selectedCategoryId === cat.id ? null : cat.id
                      )}
                    >
                      <MaterialIcons
                        name={(cat.icon || 'category') as any}
                        size={14}
                        color={selectedCategoryId === cat.id ? colors.primary : colors.iconDefault}
                      />
                      <Text style={{
                        fontFamily: 'Cairo_600SemiBold', fontSize: 12,
                        color: selectedCategoryId === cat.id ? colors.primary : colors.onSurfaceVariant,
                      }}>
                        {i18n.language === 'ar' ? cat.name_ar : cat.name}
                      </Text>
                    </AnimatedButton>
                  ))}
                </ScrollView>
              </View>

              {/* Discount & Expiry Row */}
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>{t('provider.discount')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <TextInput
                      style={{ ...inputStyle, flex: 1 }}
                      placeholderTextColor={colors.onSurfaceVariant}
                      placeholder="25"
                      keyboardType="number-pad"
                      value={discountValue}
                      onChangeText={setDiscountValue}
                    />
                    <Pressable
                      onPress={() => setDiscountType(discountType === 'percentage' ? 'fixed' : 'percentage')}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 12, borderRadius: Radius.lg,
                        backgroundColor: colors.surfaceContainerLowest,
                        borderColor: colors.outlineVariant, borderWidth: 1,
                        ...Shadows.xs,
                      }}
                    >
                      <Text style={{ fontWeight: '700', color: colors.primary, fontSize: 14 }}>
                        {discountType === 'percentage' ? '%' : '$'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={labelStyle}>{t('provider.expiryDate')}</Text>
                  <TextInput
                    style={{ ...inputStyle, flex: 1 }}
                    placeholderTextColor={colors.onSurfaceVariant}
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={setEndDate}
                  />
                </View>
              </View>

              {/* Max Redemptions */}
              <View>
                <Text style={labelStyle}>{t('provider.maxRedemptions')}</Text>
                <TextInput
                  style={inputStyle}
                  placeholderTextColor={colors.onSurfaceVariant}
                  placeholder="100"
                  keyboardType="number-pad"
                  value={maxRedemptions}
                  onChangeText={setMaxRedemptions}
                />
              </View>

              {/* Terms */}
              <View>
                <Text style={labelStyle}>{t('provider.termsConditions')}</Text>
                <TextInput
                  style={{ ...inputStyle, height: 96, textAlignVertical: 'top' }}
                  placeholderTextColor={colors.onSurfaceVariant}
                  placeholder={t('provider.termsPlaceholder')}
                  multiline
                  textAlignVertical="top"
                  value={terms}
                  onChangeText={setTerms}
                />
              </View>

              {/* Deal Conditions */}
              <View>
                <Text style={labelStyle}>{t('conditions.title')}</Text>
                <View style={{
                  backgroundColor: colors.surfaceContainerLowest,
                  borderRadius: Radius.lg,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                }}>
                  <ConditionPicker selectedIds={selectedConditions} onChange={setSelectedConditions} />
                </View>
              </View>

              {/* Step 1 Actions */}
              <View style={{ gap: 12, marginTop: 12 }}>
                <AnimatedButton
                  variant="gradient"
                  style={{ paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', ...Shadows.glow }}
                  onPress={handleNextStep}
                >
                  <Text style={{ fontFamily: 'Cairo_700Bold', color: 'white', fontSize: 15 }}>{t('provider.nextReview')}</Text>
                </AnimatedButton>
                <Pressable
                  onPress={handleSaveDraft}
                  disabled={submitting}
                  style={({ pressed }) => ({
                    paddingVertical: 16, borderRadius: Radius.lg,
                    borderWidth: 1.5, borderColor: colors.outlineVariant,
                    backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainerLowest,
                    alignItems: 'center', justifyContent: 'center',
                    ...Shadows.xs,
                  })}
                >
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.onSurface }}>
                    {submitting ? t('provider.saving') : t('provider.saveDraft')}
                  </Text>
                </Pressable>
              </View>
            </AnimatedEntrance>
          ) : (
            /* ── Step 2: Review ───────────────────── */
            <AnimatedEntrance index={1}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface, marginStart: 4, marginBottom: 12 }}>{t('provider.cardPreview')}</Text>
              <View style={{
                backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.lg, overflow: 'hidden',
                ...Shadows.xs,
                borderColor: colors.outlineVariant, borderWidth: 1,
                marginBottom: 20,
              }}>
                <View style={{ position: 'relative', height: 128 }}>
                  {imageUri ? (
                    <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialIcons name="image" size={32} color={colors.onSurfaceVariant} />
                    </View>
                  )}
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)']}
                    style={{ position: 'absolute', start: 0, end: 0, bottom: 0, height: 64 }}
                  />
                  <View style={{ position: 'absolute', bottom: 12, start: 16 }}>
                    {selectedCategoryId && (
                      <View style={{ backgroundColor: colors.primary, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full, marginBottom: 4 }}>
                        <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: -0.01 }}>
                          {i18n.language === 'ar' ? categories.find(c => c.id === selectedCategoryId)?.name_ar : categories.find(c => c.id === selectedCategoryId)?.name || 'DEAL'}
                        </Text>
                      </View>
                    )}
                    <Text style={{ color: 'white', fontFamily: 'Cairo_700Bold', fontSize: 18, letterSpacing: -0.02 }}>
                      {title || t('provider.dealTitle')}
                    </Text>
                  </View>
                </View>
                <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ color: colors.primary, fontFamily: 'Cairo_700Bold', fontSize: 20 }}>
                      {discountType === 'percentage' ? `-${discountValue || '0'}%` : `$${discountValue || '0'} off`}
                    </Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 10, fontWeight: '500' }}>
                      {t('provider.validUntil')} {endDate || '--'} • {t('provider.max')} {maxRedemptions} {t('provider.uses')}
                    </Text>
                  </View>
                </View>
                {description ? (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, lineHeight: 16 }}>{description}</Text>
                  </View>
                ) : null}
                {terms ? (
                  <View style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceContainer }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.15, marginBottom: 4 }}>{t('provider.terms')}</Text>
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontStyle: 'italic' }}>"{terms}"</Text>
                  </View>
                ) : null}
              </View>

              {/* Step 2 Actions */}
              <View style={{ gap: 12, marginTop: 12 }}>
                <AnimatedButton
                  variant="gradient"
                  style={{ paddingVertical: 16, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, ...Shadows.glow }}
                  onPress={handlePublish}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <MaterialIcons name="publish" size={18} color="white" />
                  )}
                  <Text style={{ fontFamily: 'Cairo_700Bold', color: 'white', fontSize: 15 }}>
                    {submitting ? t('provider.publishing') : t('provider.publishDeal')}
                  </Text>
                </AnimatedButton>
                <Pressable
                  onPress={() => setStep(1)}
                  style={({ pressed }) => ({
                    paddingVertical: 16, borderRadius: Radius.lg,
                    borderWidth: 1.5, borderColor: colors.outlineVariant,
                    backgroundColor: pressed ? colors.surfaceContainerHigh : colors.surfaceContainerLowest,
                    alignItems: 'center', justifyContent: 'center',
                    ...Shadows.xs,
                  })}
                >
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 15, color: colors.onSurface }}>{t('provider.edit')}</Text>
                </Pressable>
              </View>
            </AnimatedEntrance>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Error Banner */}
      {formError ? (
        <View style={{
          position: 'absolute', bottom: 24, left: 16, right: 16, zIndex: 50,
          backgroundColor: 'rgba(239,68,68,0.9)', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 8,
        }}>
          <MaterialIcons name="error" size={16} color="white" />
          <Text style={{ color: 'white', fontFamily: 'Cairo', fontSize: 12, flex: 1 }}>{formError}</Text>
          <AnimatedButton onPress={() => setFormError('')} style={{ padding: 4 }}>
            <MaterialIcons name="close" size={14} color="white" />
          </AnimatedButton>
        </View>
      ) : null}
    </View>
  );
}
