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
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#862045" />
        <Text className="text-on-surface-variant font-body mt-4">Loading deal...</Text>
      </View>
    );
  }

  const displayImageUri = newImageUri || imageUrl;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-4">
          <AnimatedButton
            className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center p-0"
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <View>
            <Text className="font-headline font-bold tracking-tight text-xl text-on-surface">
              Edit Deal
            </Text>
            {deal && (
              <View className={`self-start px-2 py-0.5 rounded-full mt-0.5 ${deal.status === 'active' ? 'bg-green-500/10' :
                  deal.status === 'paused' ? 'bg-amber-500/10' : 'bg-surface-container-high'
                }`}>
                <Text className={`text-[10px] font-bold uppercase tracking-wider ${deal.status === 'active' ? 'text-green-600' :
                    deal.status === 'paused' ? 'text-amber-600' : 'text-on-surface-variant'
                  }`}>{deal.status}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Pause/Activate toggle */}
        {deal && (
          <AnimatedButton
            className={`px-4 py-2 rounded-full ${deal.status === 'active' ? 'bg-amber-500/10' : 'bg-green-500/10'
              }`}
            onPress={handleTogglePause}
          >
            <Text className={`font-body font-bold text-xs uppercase ${deal.status === 'active' ? 'text-amber-600' : 'text-green-600'
              }`}>
              {deal.status === 'active' ? 'Pause' : 'Activate'}
            </Text>
          </AnimatedButton>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 24 }}>

          {/* Redemption Stats */}
          {redemptionStats && (
            <AnimatedEntrance index={0}>
              <View className="flex-row gap-3 mb-6">
                {[
                  { label: 'Total', value: redemptionStats.total, color: '#6366f1' },
                  { label: 'Claimed', value: redemptionStats.claimed, color: '#f59e0b' },
                  { label: 'Redeemed', value: redemptionStats.redeemed, color: '#10b981' },
                ].map((stat) => (
                  <View
                    key={stat.label}
                    className="flex-1 bg-surface-container-lowest p-4 rounded-2xl border-outline-variant/10 items-center"
                  >
                    <Text className="font-headline font-bold text-xl text-on-surface">{stat.value}</Text>
                    <Text className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mt-1">{stat.label}</Text>
                  </View>
                ))}
              </View>
            </AnimatedEntrance>
          )}

          {/* Image */}
          <AnimatedEntrance index={1}>
            <Text className="font-headline font-bold text-lg text-on-surface ml-1 mb-2">Cover Image</Text>
            <AnimatedButton
              className="w-full border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-low items-center justify-center overflow-hidden mb-6"
              onPress={pickImage}
            >
              {displayImageUri ? (
                <View className="w-full aspect-[16/9]">
                  <Image source={{ uri: displayImageUri }} className="w-full h-full" contentFit="cover" />
                  <View className="absolute bottom-3 right-3 bg-black/60 rounded-full px-3 py-1 flex-row items-center gap-1">
                    <MaterialIcons name="edit" size={14} color="white" />
                    <Text className="text-white text-xs font-bold">Change</Text>
                  </View>
                </View>
              ) : (
                <View className="items-center p-8 aspect-[16/9] justify-center">
                  <MaterialIcons name="cloud-upload" size={40} color="#862045" />
                  <Text className="font-body font-semibold text-on-surface mt-2">Tap to upload</Text>
                </View>
              )}
            </AnimatedButton>
          </AnimatedEntrance>

          {/* Form Fields */}
          <AnimatedEntrance index={2} className="space-y-6 flex flex-col gap-6">
            {/* Title */}
            <View>
              <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Deal Title</Text>
              <TextInput
                className="w-full px-6 py-4 rounded-xl bg-surface-container-lowest text-on-surface font-medium shadow-sm border-outline-variant/10"
                placeholderTextColor="#85736f"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Description */}
            <View>
              <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Description</Text>
              <TextInput
                className="w-full px-6 py-4 rounded-xl bg-surface-container-lowest text-on-surface font-medium shadow-sm border-outline-variant/10 h-24 text-left"
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {categories.map((cat) => (
                  <AnimatedButton
                    key={cat.id}
                    className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${selectedCategoryId === cat.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-surface-container-lowest border-outline-variant/10'
                      }`}
                    onPress={() => setSelectedCategoryId(
                      selectedCategoryId === cat.id ? null : cat.id
                    )}
                  >
                    <MaterialIcons
                      name={(cat.icon || 'category') as any}
                      size={18}
                      color={selectedCategoryId === cat.id ? '#862045' : '#85736f'}
                    />
                    <Text className={`font-body font-semibold text-sm ${selectedCategoryId === cat.id ? 'text-primary' : 'text-on-surface-variant'
                      }`}>
                      {cat.name}
                    </Text>
                  </AnimatedButton>
                ))}
              </ScrollView>
            </View>

            {/* Discount & Expiry */}
            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Discount</Text>
                <View className="relative flex-row items-center">
                  <TextInput
                    className="flex-1 px-6 py-4 rounded-xl bg-surface-container-lowest text-on-surface font-medium shadow-sm border-outline-variant/10"
                    keyboardType="numeric"
                    value={discountValue}
                    onChangeText={setDiscountValue}
                    placeholderTextColor="#85736f"
                  />
                  <Text className="absolute right-6 font-bold text-primary">
                    {discountType === 'percentage' ? '%' : '$'}
                  </Text>
                </View>
              </View>
              <View className="flex-1">
                <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Expiry Date</Text>
                <TextInput
                  className="w-full px-6 py-4 rounded-xl bg-surface-container-lowest text-on-surface font-medium shadow-sm border-outline-variant/10"
                  value={endDate}
                  onChangeText={setEndDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#85736f"
                />
              </View>
            </View>

            {/* Max Redemptions */}
            <View>
              <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">Max Redemptions</Text>
              <TextInput
                className="w-full px-6 py-4 rounded-xl bg-surface-container-lowest text-on-surface font-medium shadow-sm border-outline-variant/10"
                keyboardType="number-pad"
                value={maxRedemptions}
                onChangeText={setMaxRedemptions}
                placeholderTextColor="#85736f"
              />
            </View>
          </AnimatedEntrance>

          {/* Action Buttons */}
          <AnimatedEntrance index={3} className="mt-8">
            <View className="flex-col gap-4">
              <AnimatedButton
                variant="gradient"
                className="w-full py-4 rounded-full flex-row items-center justify-center gap-2"
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <MaterialIcons name="save" size={20} color="white" />
                )}
                <Text className="text-white font-bold text-lg">
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </AnimatedButton>

              <AnimatedButton
                className="w-full bg-surface-container-highest py-4 rounded-full flex-row items-center justify-center gap-2"
                onPress={handleDelete}
              >
                <MaterialIcons name="delete" size={20} color="#ba1a1a" />
                <Text className="text-error font-bold text-lg">Delete Deal</Text>
              </AnimatedButton>
            </View>
          </AnimatedEntrance>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
