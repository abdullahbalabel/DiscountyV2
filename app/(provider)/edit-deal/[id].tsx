import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  KeyboardAvoidingView, Platform,
  ScrollView,
  Text,
  TextInput, useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import type { DealRedemptionStats } from '../../../lib/api';
import {
  activateDeal,
  deleteDeal,
  fetchCategories,
  fetchDealById,
  fetchDealRedemptionStats, pauseDeal,
  updateDeal,
  uploadDealImage,
} from '../../../lib/api';
import type { Category, Discount, DiscountType } from '../../../lib/types';

export default function EditDealScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Data state
  const [deal, setDeal] = useState<Discount | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [redemptionStats, setRedemptionStats] = useState<DealRedemptionStats | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [endDate, setEndDate] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [terms, setTerms] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [newImageFileName, setNewImageFileName] = useState('');
  const [newImageType, setNewImageType] = useState('image/jpeg');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDeal = useCallback(async () => {
    if (!id) return;
    try {
      const [dealData, cats, stats] = await Promise.all([
        fetchDealById(id),
        fetchCategories(),
        fetchDealRedemptionStats(id),
      ]);

      if (!dealData) {
        Alert.alert(t('auth.error'), t('provider.dealNotFound'));
        router.back();
        return;
      }

      setDeal(dealData);
      setCategories(cats);
      setRedemptionStats(stats);

      // Pre-fill form
      setTitle(dealData.title);
      setDescription(dealData.description || '');
      setDiscountValue(String(dealData.discount_value));
      setDiscountType(dealData.type);
      setEndDate(dealData.end_time ? dealData.end_time.split('T')[0] : '');
      setMaxRedemptions(String(dealData.max_redemptions));
      setSelectedCategoryId(dealData.category_id || null);
      setImageUrl(dealData.image_url || null);
    } catch (err) {
      console.error('Failed to load deal:', err);
      Alert.alert(t('auth.error'), t('provider.failedLoadDeal'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDeal();
  }, [loadDeal]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('provider.permissionRequired'), t('provider.allowPhotoLibrary'));
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
      setNewImageUri(asset.uri);
      setNewImageFileName(asset.fileName || `deal_${Date.now()}.jpg`);
      setNewImageType(asset.mimeType || 'image/jpeg');
    }
  };

  const handleSave = async () => {
    if (!id || !title.trim()) {
      Alert.alert(t('auth.error'), t('provider.dealTitleRequired'));
      return;
    }

    setSaving(true);
    try {
      let uploadedImageUrl = imageUrl;
      if (newImageUri) {
        uploadedImageUrl = await uploadDealImage(newImageUri, newImageFileName, newImageType);
      }

      await updateDeal(id, {
        title: title.trim(),
        description: description.trim() || undefined,
        discount_value: parseFloat(discountValue),
        type: discountType,
        category_id: selectedCategoryId || undefined,
        image_url: uploadedImageUrl || undefined,
        end_time: endDate ? new Date(endDate.trim() + 'T23:59:59').toISOString() : undefined,
        max_redemptions: parseInt(maxRedemptions) || undefined,
      });

      Alert.alert(t('provider.saved'), t('provider.dealUpdatedSuccess'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert(t('auth.error'), err.message || t('provider.failedUpdateDeal'));
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    if (!id || !deal) return;

    Alert.alert(
      deal.status === 'active' ? t('provider.pauseDeal') : t('provider.activateDeal'),
      deal.status === 'active' ? t('provider.pauseDealConfirm') : t('provider.activateDealConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: deal.status === 'active' ? t('provider.pauseDeal') : t('provider.activateDeal'),
          onPress: async () => {
            try {
              const updated = deal.status === 'active'
                ? await pauseDeal(id)
                : await activateDeal(id);
              setDeal({ ...deal, status: updated.status });
            } catch (err: any) {
              Alert.alert(t('auth.error'), err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!id) return;

    Alert.alert(
      t('provider.deleteDeal'),
      t('provider.deleteDealConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeal(id);
              Alert.alert(t('provider.deleteDeal'), t('provider.dealRemoved'), [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert(t('auth.error'), err.message);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#862045" />
        <Text style={{ color: isDark ? '#d8c2bd' : '#564340', fontFamily: 'Cairo', marginTop: 16 }}>{t('provider.loadingDeal')}</Text>
      </View>
    );
  }

  const displayImageUri = newImageUri || imageUrl;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#1a110f' : '#fff8f6' }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#1a110f' : '#fff8f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <AnimatedButton
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#534340' : '#f5ddd9', alignItems: 'center', justifyContent: 'center', padding: 0 }}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </AnimatedButton>
          <View>
            <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.02, fontSize: 20, color: isDark ? '#f1dfda' : '#231917' }}>
              {t('provider.editDeal')}
            </Text>
            {deal && (
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 9999, marginTop: 2, backgroundColor: deal.status === 'active' ? 'rgba(16,185,129,0.1)' :
                  deal.status === 'paused' ? 'rgba(245,158,11,0.1)' : isDark ? '#534340' : '#f5ddd9'
                }}>
                <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05, color: deal.status === 'active' ? '#16a34a' :
                    deal.status === 'paused' ? '#d97706' : isDark ? '#d8c2bd' : '#564340'
                  }}>{deal.status}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pause/Activate toggle */}
        {deal && (
          <AnimatedButton
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, backgroundColor: deal.status === 'active' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'
              }}
            onPress={handleTogglePause}
          >
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', color: deal.status === 'active' ? '#d97706' : '#16a34a'
              }}>
              {deal.status === 'active' ? t('provider.pauseDeal') : t('provider.activateDeal')}
            </Text>
          </AnimatedButton>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 24 }}>

          {/* Redemption Stats */}
          {redemptionStats && (
            <AnimatedEntrance index={0}>
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                {[
                  { label: t('provider.total'), value: redemptionStats.total, color: '#6366f1' },
                  { label: t('provider.claimed'), value: redemptionStats.claimed, color: '#f59e0b' },
                  { label: t('provider.redeemed'), value: redemptionStats.redeemed, color: '#10b981' },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={{ flex: 1, backgroundColor: isDark ? '#322825' : '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 20, color: isDark ? '#f1dfda' : '#231917' }}>{stat.value}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.1, color: isDark ? '#d8c2bd' : '#564340', marginTop: 4 }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </AnimatedEntrance>
          )}

          {/* Image */}
          <AnimatedEntrance index={1}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: isDark ? '#f1dfda' : '#231917', marginStart: 4, marginBottom: 8 }}>{t('provider.coverImage')}</Text>
            <AnimatedButton
              style={{ width: '100%', borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)', borderRadius: 12, backgroundColor: isDark ? '#271d1b' : '#fff0ed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 24 }}
              onPress={pickImage}
            >
              {displayImageUri ? (
                <View style={{ width: '100%', aspectRatio: 16/9 }}>
                  <Image source={{ uri: displayImageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="edit" size={14} color="white" />
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{t('provider.change')}</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', padding: 32, aspectRatio: 16/9, justifyContent: 'center' }}>
                  <MaterialIcons name="cloud-upload" size={40} color="#862045" />
                  <Text style={{ fontFamily: 'Cairo_600SemiBold', color: isDark ? '#f1dfda' : '#231917', marginTop: 8 }}>{t('provider.tapToUpload')}</Text>
                </View>
              )}
            </AnimatedButton>
          </AnimatedEntrance>

          {/* Form Fields */}
          <AnimatedEntrance index={2} style={{ gap: 24 }}>
            {/* Title */}
            <View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginStart: 4, marginBottom: 8 }}>{t('provider.dealTitle')}</Text>
              <TextInput
                style={{ width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                placeholderTextColor="#85736f"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginStart: 4, marginBottom: 8 }}>{t('provider.description')}</Text>
              <TextInput
                style={{ width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', height: 96, borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                placeholderTextColor="#85736f"
                placeholder={t('provider.describeDealPlaceholder')}
                multiline
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Category Picker */}
            <View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginStart: 4, marginBottom: 8 }}>{t('provider.category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {categories.map((cat) => (
                  <AnimatedButton
                    key={cat.id}
                    style={{ paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: selectedCategoryId === cat.id
                        ? 'rgba(134,32,69,0.1)'
                        : isDark ? '#322825' : '#ffffff',
                      borderWidth: 1,
                      borderColor: selectedCategoryId === cat.id
                        ? '#862045'
                        : isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)'
                      }}
                    onPress={() => setSelectedCategoryId(
                      selectedCategoryId === cat.id ? null : cat.id
                    )}
                  >
                    <MaterialIcons
                      name={(cat.icon || 'category') as any}
                      size={18}
                      color={selectedCategoryId === cat.id ? '#862045' : '#85736f'}
                    />
                    <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: selectedCategoryId === cat.id ? '#862045' : isDark ? '#d8c2bd' : '#564340'
                      }}>
                      {i18n.language === 'ar' ? cat.name_ar : cat.name}
                    </Text>
                  </AnimatedButton>
                ))}
              </ScrollView>
            </View>

            {/* Discount & Expiry */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginStart: 4, marginBottom: 8 }}>{t('provider.discount')}</Text>
                <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                    keyboardType="numeric"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    placeholderTextColor="#85736f"
                  />
                  <Text style={{ position: 'absolute', right: 24, fontWeight: '700', color: '#862045' }}>
                    {discountType === 'percentage' ? '%' : '$'}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginStart: 4, marginBottom: 8 }}>{t('provider.expiryDate')}</Text>
                <TextInput
                  style={{ width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#85736f"
                />
              </View>
            </View>

            {/* Max Redemptions */}
            <View>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginStart: 4, marginBottom: 8 }}>{t('provider.maxRedemptions')}</Text>
              <TextInput
                style={{ width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                keyboardType="number-pad"
                value={maxRedemptions}
                onChangeText={setMaxRedemptions}
                placeholderTextColor="#85736f"
              />
            </View>
          </AnimatedEntrance>

          {/* Action Buttons */}
          <AnimatedEntrance index={3} style={{ marginTop: 32 }}>
            <View style={{ gap: 16 }}>
              <AnimatedButton
                variant="gradient"
                style={{ width: '100%', paddingVertical: 16, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="save" size={20} color="white" />
                )}
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
                  {saving ? t('provider.saving') : t('provider.saveChanges')}
                </Text>
              </AnimatedButton>

              <AnimatedButton
                style={{ width: '100%', backgroundColor: isDark ? '#534340' : '#f5ddd9', paddingVertical: 16, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={20} color="#ba1a1a" />
                <Text style={{ color: '#ba1a1a', fontWeight: '700', fontSize: 18 }}>{t('provider.deleteDeal')}</Text>
              </AnimatedButton>
            </View>
          </AnimatedEntrance>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
