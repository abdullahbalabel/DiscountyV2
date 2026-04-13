import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Appearance, Alert, I18nManager, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { setupRtl, reloadForRtl, saveLanguage } from '../../i18n';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { useAuth } from '../../contexts/auth';
import { useNotifications } from '../../contexts/notifications';
import { useThemeColors, Radius, Shadows } from '../../hooks/use-theme-colors';
import { fetchOwnCustomerProfile, fetchCustomerStats, uploadAvatar, updateCustomerProfile } from '../../lib/api';
import type { CustomerProfile } from '../../lib/types';

export default function ProfileScreen() {
  const { signOut, session } = useAuth();
  const colors = useThemeColors();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [stats, setStats] = useState({ totalClaimed: 0, totalRedeemed: 0, totalSaved: 0, activeDeals: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    if (!session?.user) return;
    const loadData = async () => {
      try {
        const [profileData, statsData] = await Promise.all([
          fetchOwnCustomerProfile(),
          fetchCustomerStats(),
        ]);
        setProfile(profileData);
        setStats(statsData);
      } catch (err) {
        console.warn('[Profile] Failed to load profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [session]);

  const handleAvatarPress = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0] || !result.assets[0].base64) return;

    const asset = result.assets[0];

    // Show local image immediately
    setLocalAvatarUri(asset.uri);
    setIsUploadingAvatar(true);

    try {
      const avatarUrl = await uploadAvatar(asset.base64!, asset.mimeType || 'image/jpeg');
      console.log('[Profile] Avatar uploaded:', avatarUrl);
      const updated = await updateCustomerProfile({ avatar_url: avatarUrl });
      console.log('[Profile] Profile updated:', updated.avatar_url);
      setProfile(updated);
      setLocalAvatarUri(null);
    } catch (err: any) {
      console.warn('[Profile] Avatar upload failed:', err?.message || err);
      Alert.alert('Upload Failed', err?.message || 'Something went wrong');
      setLocalAvatarUri(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleEditName = () => {
    setEditingName(profile?.display_name || '');
    setShowNameModal(true);
  };

  const handleSaveName = async () => {
    setShowNameModal(false);
    try {
      const updated = await updateCustomerProfile({ display_name: editingName.trim() || undefined });
      setProfile(updated);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update name');
    }
  };

  const toggleTheme = () => {
    Appearance.setColorScheme(colors.isDark ? 'light' : 'dark');
  };

  const toggleLanguage = async () => {
    const newLang = i18n.language?.startsWith('ar') ? 'en' : 'ar';
    await i18n.changeLanguage(newLang);
    await saveLanguage(newLang);
    const needsReload = setupRtl();
    if (needsReload) {
      await reloadForRtl();
    }
  };

  const displayName = profile?.display_name || session?.user?.email?.split('@')[0] || 'User';

  const collectionItems = [
    {
      id: 'saved',
      title: t('customer.savedDeals'),
      icon: 'bookmark',
      color: colors.primary,
      onPress: () => router.push('/(customer)/saved'),
    },
    {
      id: 'history',
      title: t('customer.redemptionHistory'),
      icon: 'history',
      color: colors.success,
      onPress: () => router.push('/(customer)/history'),
    },
  ];

  const preferencesItems = [
    {
      id: 'privacy',
      title: t('privacyData.title') || 'Privacy & Data',
      icon: 'shield',
      color: colors.success,
      onPress: () => router.push('/(customer)/privacy-data' as any),
    },
    {
      id: 'theme',
      title: colors.isDark ? t('customer.lightMode') : t('customer.darkMode'),
      icon: colors.isDark ? 'light-mode' : 'dark-mode',
      color: colors.warning,
      onPress: toggleTheme,
    },
    {
      id: 'lang',
      title: i18n.language?.startsWith('ar') ? 'English' : 'العربية',
      icon: 'language',
      color: colors.info,
      onPress: toggleLanguage,
    },
  ];

  const renderSection = (
    title: string,
    items: Array<{ id: string; title: string; icon: string; color: string; onPress: () => void; subtitle?: string }>,
    index: number,
  ) => (
    <AnimatedEntrance index={index + 1} delay={150 + index * 50}>
      <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: colors.onSurfaceVariant, marginBottom: 8, marginStart: 4 }}>{title}</Text>
      <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 20 }}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            onPress={item.onPress}
            style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: idx !== items.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginEnd: 14 }}>
              <MaterialIcons name={item.icon as any} size={20} color={item.color as any} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>{item.title}</Text>
              {item.subtitle ? (
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', fontSize: 11, marginTop: 2 }}>{item.subtitle}</Text>
              ) : null}
            </View>
            <MaterialIcons name="chevron-right" size={20} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </TouchableOpacity>
        ))}
      </View>
    </AnimatedEntrance>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <GlassHeader style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface, flexShrink: 1 }}>{t('customer.profile')}</Text>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', position: 'relative' }} onPress={() => router.push('/(customer)/notifications' as any)}>
          <MaterialIcons name="notifications" size={18} color={colors.onSurfaceVariant} />
          {unreadCount > 0 && (
            <View style={{ position: 'absolute', top: -2, right: -2, width: 16, height: 16, borderRadius: 8, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </GlassHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
          {/* Profile Hero */}
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ alignItems: 'center', paddingVertical: 20 }}>
              <View style={{ position: 'relative', marginBottom: 16 }}>
                <TouchableOpacity activeOpacity={0.8} onPress={handleAvatarPress} disabled={isUploadingAvatar}>
                  <View style={{
                    width: 110,
                    height: 110,
                    borderRadius: Radius.xl,
                    overflow: 'hidden',
                    borderWidth: 3,
                    borderColor: colors.primary,
                    ...Shadows.lg,
                  }}>
                    {localAvatarUri ? (
                      <Image source={{ uri: localAvatarUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : profile?.avatar_url ? (
                      <Image source={{ uri: profile.avatar_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="none" />
                    ) : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: colors.primaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                        <MaterialIcons name="person" size={48} color={colors.primary} />
                      </View>
                    )}
                    {isUploadingAvatar && (
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="small" color={colors.onPrimary} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAvatarPress}
                  disabled={isUploadingAvatar}
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.surfaceBg,
                    ...Shadows.sm,
                  }}
                >
                  <MaterialIcons name="edit" size={14} color={colors.onPrimary} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={handleEditName} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 24, color: colors.onSurface, letterSpacing: -0.5 }}>{displayName}</Text>
                  <MaterialIcons name="edit" size={16} color={colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: Radius.full,
                backgroundColor: colors.primaryContainer,
                marginTop: 8,
              }}>
                <MaterialIcons name="workspace-premium" size={14} color={colors.primary} />
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: colors.primary }}>{t('customer.premiumMember')}</Text>
              </View>
            </View>
          </AnimatedEntrance>

          {/* Stats Bento */}
          <AnimatedEntrance index={1} delay={120}>
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
              <View style={{
                flex: 1,
                backgroundColor: colors.surfaceContainerLow,
                padding: 20,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              }}>
                <Text style={{ fontFamily: 'Cairo_900Black', fontSize: 28, color: colors.primary, letterSpacing: -1 }}>{stats.totalSaved}</Text>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: colors.onSurfaceVariant, marginTop: 4 }}>{t('customer.totalSaved')}</Text>
              </View>
              <View style={{
                flex: 1,
                backgroundColor: colors.primary,
                padding: 20,
                borderRadius: Radius.xl,
                ...Shadows.md,
              }}>
                <Text style={{ fontFamily: 'Cairo_900Black', fontSize: 28, color: '#ffffff', letterSpacing: -1 }}>{stats.activeDeals}</Text>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.2, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{t('customer.activeDeals')}</Text>
              </View>
            </View>
          </AnimatedEntrance>

          {/* Collection */}
          {renderSection(t('customer.collection'), collectionItems, 2)}

          {/* Preferences */}
          <AnimatedEntrance index={4} delay={350}>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 20 }}>
              {preferencesItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: idx !== preferencesItems.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginEnd: 14 }}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>{item.title}</Text>
                  <MaterialIcons name="sync" size={16} color={colors.iconDefault} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          {/* Sign Out */}
          <AnimatedEntrance index={5} delay={400}>
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: colors.errorBgDark, padding: 14, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={18} color={colors.error} style={{ marginEnd: 8 }} />
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.error }}>{t('customer.logOutAccount')}</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <TouchableOpacity activeOpacity={1} onPress={() => setShowNameModal(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl, padding: 24, ...Shadows.lg }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: colors.onSurface, marginBottom: 16 }}>{t('customer.personalInfo')}</Text>
              <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 12, color: colors.onSurfaceVariant, marginBottom: 8 }}>Display Name</Text>
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                placeholder={session?.user?.email?.split('@')[0] || 'Your name'}
                placeholderTextColor={colors.onSurfaceVariant}
                autoFocus
                style={{
                  backgroundColor: colors.surfaceContainerHigh,
                  borderRadius: Radius.lg,
                  padding: 14,
                  fontFamily: 'Cairo',
                  fontWeight: '600',
                  fontSize: 16,
                  color: colors.onSurface,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  marginBottom: 20,
                }}
              />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setShowNameModal(false)}
                  style={{ flex: 1, padding: 14, borderRadius: Radius.lg, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface }}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveName}
                  style={{ flex: 1, padding: 14, borderRadius: Radius.lg, backgroundColor: colors.primary, alignItems: 'center' }}
                >
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onPrimary }}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
