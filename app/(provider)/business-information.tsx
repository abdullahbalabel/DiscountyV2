import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import { fetchOwnProviderProfile, updateProviderProfile, uploadProviderImage } from '../../lib/api';

export default function BusinessInformationScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<'logo' | 'cover' | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOwnProviderProfile();
        if (data) {
          setBusinessName(data.business_name || '');
          setDescription(data.description || '');
          setPhone(data.phone || '');
          setWebsite(data.website || '');
          setLogoUrl(data.logo_url);
          setCoverUrl(data.cover_photo_url);
        }
      } catch {
        Alert.alert(t('auth.error'), t('auth.somethingWentWrong'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [t]);

  const handleImagePick = async (kind: 'logo' | 'cover') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('provider.permissionRequired'), t('provider.allowPhotoLibrary'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: kind === 'logo' ? [1, 1] : [16, 9],
      quality: 0.8,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    setIsUploading(kind);
    try {
      const url = await uploadProviderImage(
        result.assets[0].base64!,
        result.assets[0].mimeType || 'image/jpeg',
        kind,
      );
      if (kind === 'logo') setLogoUrl(url);
      else setCoverUrl(url);
    } catch (err: any) {
      Alert.alert(t('provider.failedToUpload'), err?.message || t('auth.somethingWentWrong'));
    } finally {
      setIsUploading(null);
    }
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      Alert.alert(t('auth.error'), t('provider.dealTitleRequired'));
      return;
    }

    setIsSaving(true);
    try {
      await updateProviderProfile({
        business_name: businessName.trim(),
        description: description.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        logo_url: logoUrl,
        cover_photo_url: coverUrl,
      });
      Alert.alert(t('provider.saved'));
    } catch (err: any) {
      Alert.alert(t('provider.failedToSave'), err?.message || t('auth.somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle = {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    color: colors.onSurface,
    fontFamily: 'Cairo',
    fontSize: 14,
  };

  const labelStyle = {
    fontFamily: 'Cairo',
    fontWeight: '700' as const,
    fontSize: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.2,
    color: colors.onSurfaceVariant,
    marginStart: 4,
    marginBottom: 6,
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View style={{
        width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceBg,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <MaterialIcons name={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'} size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Cairo', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface, flex: 1 }}>
          {t('provider.editBusinessInfo')}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
            backgroundColor: colors.primary,
          }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 13, color: colors.onPrimary }}>{t('provider.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover Photo */}
        <AnimatedEntrance index={0} delay={50}>
          <TouchableOpacity onPress={() => handleImagePick('cover')} disabled={isUploading === 'cover'}>
            <View style={{
              height: 140, marginHorizontal: 16, marginTop: 8, borderRadius: Radius.xl,
              backgroundColor: colors.surfaceContainerLowest, overflow: 'hidden',
              borderWidth: 1, borderColor: colors.outlineVariant,
            }}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <MaterialIcons name="landscape" size={32} color={colors.iconDefault} />
                  <Text style={{ fontFamily: 'Cairo', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 6 }}>{t('provider.coverPhoto')}</Text>
                </View>
              )}
              {isUploading === 'cover' && (
                <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
              <View style={{
                position: 'absolute', bottom: 8, right: 8, width: 32, height: 32, borderRadius: 16,
                backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...Shadows.sm,
              }}>
                <MaterialIcons name="edit" size={14} color={colors.onPrimary} />
              </View>
            </View>
          </TouchableOpacity>
        </AnimatedEntrance>

        {/* Logo */}
        <AnimatedEntrance index={1} delay={80}>
          <View style={{ alignItems: 'center', marginTop: -40, marginBottom: 8, paddingHorizontal: 16 }}>
            <TouchableOpacity onPress={() => handleImagePick('logo')} disabled={isUploading === 'logo'}>
              <View style={{
                width: 80, height: 80, borderRadius: Radius.xl, overflow: 'hidden',
                borderWidth: 3, borderColor: colors.surfaceBg, backgroundColor: colors.surfaceContainerLowest,
                ...Shadows.md,
              }}>
                {logoUrl ? (
                  <Image source={{ uri: logoUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="store" size={28} color={colors.iconDefault} />
                  </View>
                )}
                {isUploading === 'logo' && (
                  <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <Text style={{ fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 4 }}>{t('provider.tapToChange')}</Text>
          </View>
        </AnimatedEntrance>

        {/* Form Fields */}
        <View style={{ paddingHorizontal: 16, gap: 16 }}>
          <AnimatedEntrance index={2} delay={100}>
            <Text style={labelStyle}>{t('provider.businessName')}</Text>
            <TextInput
              style={inputStyle}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder={t('provider.businessNamePlaceholder')}
              placeholderTextColor={colors.iconDefault}
            />
          </AnimatedEntrance>

          <AnimatedEntrance index={3} delay={120}>
            <Text style={labelStyle}>{t('provider.description')}</Text>
            <TextInput
              style={[inputStyle, { height: 100, textAlignVertical: 'top' }]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('provider.describeBusinessPlaceholder')}
              placeholderTextColor={colors.iconDefault}
              multiline
            />
          </AnimatedEntrance>

          <AnimatedEntrance index={4} delay={140}>
            <Text style={labelStyle}>{t('provider.businessPhone')}</Text>
            <TextInput
              style={inputStyle}
              value={phone}
              onChangeText={setPhone}
              placeholder={t('auth.phonePlaceholder')}
              placeholderTextColor={colors.iconDefault}
              keyboardType="phone-pad"
            />
          </AnimatedEntrance>

          <AnimatedEntrance index={5} delay={160}>
            <Text style={labelStyle}>{t('provider.website')}</Text>
            <TextInput
              style={inputStyle}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://"
              placeholderTextColor={colors.iconDefault}
              keyboardType="url"
              autoCapitalize="none"
            />
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}


