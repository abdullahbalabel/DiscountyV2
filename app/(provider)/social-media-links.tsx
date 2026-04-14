import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { HeaderBar } from '../../components/ui/HeaderBar';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useThemeColors, Radius, TAB_BAR_OFFSET } from '../../hooks/use-theme-colors';
import { fetchOwnProviderProfile, updateProviderProfile } from '../../lib/api';
import { useRouter } from 'expo-router';

const SOCIAL_FIELDS = [
  { key: 'instagram', icon: 'instagram', iconFamily: 'community' as const, labelKey: 'provider.instagram', placeholder: 'https://instagram.com/yourbusiness' },
  { key: 'facebook', icon: 'facebook', iconFamily: 'community' as const, labelKey: 'provider.facebook', placeholder: 'https://facebook.com/yourbusiness' },
  { key: 'tiktok', icon: 'music-note', iconFamily: 'material' as const, labelKey: 'provider.tikTok', placeholder: 'https://tiktok.com/@yourbusiness' },
  { key: 'x', icon: 'close', iconFamily: 'material' as const, labelKey: 'provider.xTwitter', placeholder: 'https://x.com/yourbusiness' },
  { key: 'snapchat', icon: 'snapchat', iconFamily: 'community' as const, labelKey: 'provider.snapchat', placeholder: 'https://snapchat.com/add/yourbusiness' },
];

export default function SocialMediaLinksScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOwnProviderProfile();
        if (data?.social_links) {
          setLinks(data.social_links as Record<string, string>);
        }
      } catch {
        Alert.alert(t('auth.error'), t('auth.somethingWentWrong'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [t]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const cleaned: Record<string, string> = {};
      for (const [k, v] of Object.entries(links)) {
        if (v.trim()) cleaned[k] = v.trim();
      }
      await updateProviderProfile({
        social_links: Object.keys(cleaned).length > 0 ? cleaned : null,
      });
      Alert.alert(t('provider.saved'));
    } catch (err: any) {
      Alert.alert(t('provider.failedToSave'), err?.message || t('auth.somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <HeaderBar
        title={t('provider.socialMediaTitle')}
        onBack={() => router.back()}
        rightContent={
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: colors.primary }}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.onPrimary} />
            ) : (
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 13, color: colors.onPrimary }}>{t('provider.saveChanges')}</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: TAB_BAR_OFFSET }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={50}>
            <View style={{
              backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl,
              borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden',
            }}>
              {SOCIAL_FIELDS.map((field, idx) => (
                <View
                  key={field.key}
                  style={{
                    padding: 14,
                    borderBottomWidth: idx !== SOCIAL_FIELDS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.surfaceContainer,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{
                      width: 32, height: 32, borderRadius: Radius.md,
                      backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center',
                      marginEnd: 10,
                    }}>
                      {field.iconFamily === 'community' ? (
                        <MaterialCommunityIcons name={field.icon as any} size={18} color={colors.onSurfaceVariant} />
                      ) : (
                        <MaterialIcons name={field.icon as any} size={18} color={colors.onSurfaceVariant} />
                      )}
                    </View>
                    <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>
                      {t(field.labelKey)}
                    </Text>
                  </View>
                  <TextInput
                    style={{
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md,
                      backgroundColor: colors.surfaceContainerHigh, borderWidth: 1,
                      borderColor: colors.outlineVariant, color: colors.onSurface,
                      fontFamily: 'Cairo', fontSize: 13,
                    }}
                    value={links[field.key] || ''}
                    onChangeText={(val) => setLinks(prev => ({ ...prev, [field.key]: val }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.iconDefault}
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              ))}
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
