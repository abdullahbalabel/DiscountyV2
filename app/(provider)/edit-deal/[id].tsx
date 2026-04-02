import { MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  Text,
  TextInput, useColorScheme,
  View,
} from 'react-native';
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
        Alert.alert('Error', 'Deal not found');
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
      Alert.alert('Error', 'Failed to load deal data');
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
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
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
      Alert.alert('Error', 'Deal title is required');
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

      Alert.alert('Saved', 'Deal updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update deal');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePause = async () => {
    if (!id || !deal) return;

    const action = deal.status === 'active' ? 'pause' : 'activate';
    Alert.alert(
      `${action === 'pause' ? 'Pause' : 'Activate'} Deal`,
      `Are you sure you want to ${action} this deal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action === 'pause' ? 'Pause' : 'Activate',
          onPress: async () => {
            try {
              const updated = action === 'pause'
                ? await pauseDeal(id)
                : await activateDeal(id);
              setDeal({ ...deal, status: updated.status });
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!id) return;

    Alert.alert(
      'Delete Deal',
      'This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeal(id);
              Alert.alert('Deleted', 'Deal has been removed.', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.message);
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
        <Text style={{ color: isDark ? '#d8c2bd' : '#564340', fontFamily: 'Manrope', marginTop: 16 }}>Loading deal...</Text>
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
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <View>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', letterSpacing: -0.02, fontSize: 20, color: isDark ? '#f1dfda' : '#231917' }}>
              Edit Deal
            </Text>
            {deal && (
              <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingTop: 2, paddingBottom: 2, borderRadius: 9999, marginTop: 2, backgroundColor: deal.status === 'active' ? 'rgba(16,185,129,0.1)' :
                  deal.status === 'paused' ? 'rgba(245,158,11,0.1)' : isDark ? '#534340' : '#f5ddd9'
                }}>
                <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.05, color: deal.status === 'active' ? '#16a34a' :
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
            <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', color: deal.status === 'active' ? '#d97706' : '#16a34a'
              }}>
              {deal.status === 'active' ? 'Pause' : 'Activate'}
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
                  { label: 'Total', value: redemptionStats.total, color: '#6366f1' },
                  { label: 'Claimed', value: redemptionStats.claimed, color: '#f59e0b' },
                  { label: 'Redeemed', value: redemptionStats.redeemed, color: '#10b981' },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    style={{ flex: 1, backgroundColor: isDark ? '#322825' : '#ffffff', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)', alignItems: 'center' }}
                  >
                    <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 20, color: isDark ? '#f1dfda' : '#231917' }}>{stat.value}</Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.1, color: isDark ? '#d8c2bd' : '#564340', marginTop: 4 }}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </AnimatedEntrance>
          )}

          {/* Image */}
          <AnimatedEntrance index={1}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: 'bold', fontSize: 18, color: isDark ? '#f1dfda' : '#231917', marginLeft: 4, marginBottom: 8 }}>Cover Image</Text>
            <AnimatedButton
              style={{ width: '100%', borderWidth: 2, borderStyle: 'dashed', borderColor: isDark ? 'rgba(160,141,136,0.3)' : 'rgba(133,115,111,0.3)', borderRadius: 12, backgroundColor: isDark ? '#271d1b' : '#fff0ed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 24 }}
              onPress={pickImage}
            >
              {displayImageUri ? (
                <View style={{ width: '100%', aspectRatio: 16/9 }}>
                  <Image source={{ uri: displayImageUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <MaterialIcons name="edit" size={14} color="white" />
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Change</Text>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center', padding: 32, aspectRatio: 16/9, justifyContent: 'center' }}>
                  <MaterialIcons name="cloud-upload" size={40} color="#862045" />
                  <Text style={{ fontFamily: 'Manrope', fontWeight: '600', color: isDark ? '#f1dfda' : '#231917', marginTop: 8 }}>Tap to upload</Text>
                </View>
              )}
            </AnimatedButton>
          </AnimatedEntrance>

          {/* Form Fields */}
          <AnimatedEntrance index={2} style={{ gap: 24 }}>
            {/* Title */}
            <View>
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Deal Title</Text>
              <TextInput
                style={{ width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                placeholderTextColor="#85736f"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View>
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Description</Text>
              <TextInput
                style={{ width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', height: 96, textAlign: 'left', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
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
                    <Text style={{ fontFamily: 'Manrope', fontWeight: '600', fontSize: 14, color: selectedCategoryId === cat.id ? '#862045' : isDark ? '#d8c2bd' : '#564340'
                      }}>
                      {cat.name}
                    </Text>
                  </AnimatedButton>
                ))}
              </ScrollView>
            </View>

            {/* Discount & Expiry */}
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Discount</Text>
                <View style={{ position: 'relative', flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={{ flex: 1, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12, backgroundColor: isDark ? '#322825' : '#ffffff', color: isDark ? '#f1dfda' : '#231917', fontWeight: '500', borderWidth: 1, borderColor: isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)' }}
                    keyboardType="numeric"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    placeholderTextColor="#85736f"
                  />
                  <Text style={{ position: 'absolute', right: 24, fontWeight: 'bold', color: '#862045' }}>
                    {discountType === 'percentage' ? '%' : '$'}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Expiry Date</Text>
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
              <Text style={{ fontFamily: 'Manrope', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.05, color: isDark ? '#d8c2bd' : '#564340', marginLeft: 4, marginBottom: 8 }}>Max Redemptions</Text>
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
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </AnimatedButton>

              <AnimatedButton
                style={{ width: '100%', backgroundColor: isDark ? '#534340' : '#f5ddd9', paddingVertical: 16, borderRadius: 9999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={20} color="#ba1a1a" />
                <Text style={{ color: '#ba1a1a', fontWeight: 'bold', fontSize: 18 }}>Delete Deal</Text>
              </AnimatedButton>
            </View>
          </AnimatedEntrance>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
