import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { I18nManager, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { useAuth } from '../../contexts/auth';
import { supabase } from '../../lib/supabase';
import { fetchProviderSubscription } from '../../lib/api';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import type { ProviderProfile, ProviderSubscription } from '../../lib/types';

export default function ProviderProfileScreen() {
  const { t, i18n } = useTranslation();
  const { signOut, session } = useAuth();
  const colors = useThemeColors();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [subscription, setSubscription] = useState<ProviderSubscription | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('provider_profiles').select('*').eq('user_id', session.user.id).single();
      if (data) setProfile(data as ProviderProfile);
    };
    const fetchSub = async () => {
      try {
        const sub = await fetchProviderSubscription();
        setSubscription(sub);
      } catch {}
    };
    fetchProfile();
    fetchSub();
  }, [session]);

  const menuItems = [
    { id: '1', title: t('provider.businessInformation'), icon: 'store', color: colors.brown, route: '/(provider)/business-information' as const },
    { id: '2', title: t('provider.businessHours'), icon: 'schedule', color: colors.success, route: '/(provider)/business-hours' as const },
    { id: '3', title: t('provider.socialMediaLinks'), icon: 'share', color: colors.purple, route: '/(provider)/social-media-links' as const },
    { id: '4', title: t('provider.helpSupport'), icon: 'help-outline', color: colors.iconDefault, route: '/(provider)/help-support' as const },
    { id: '5', title: t('provider.subscriptionPlan'), icon: 'card-outline', color: colors.primary, route: '/(provider)/subscription' as const },
    { id: '6', title: t('provider.sendPush'), icon: 'campaign', color: colors.warning, route: '/(provider)/broadcast-push' as const },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      <GlassHeader style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>{t('provider.profile')}</Text>
        <AnimatedButton onPress={() => router.push('/(provider)/settings')} style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="settings" size={18} color={colors.iconDefault} />
        </AnimatedButton>
      </GlassHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, padding: 16, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: Radius.full, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                <MaterialCommunityIcons name="store" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: colors.onSurface }}>{profile?.business_name || t('provider.yourBusiness')}</Text>
                <Text style={{ color: colors.onSurfaceVariant, fontFamily: 'Cairo', fontSize: 12, marginTop: 2 }}>{profile?.category || t('provider.category')}</Text>
                {profile?.average_rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialIcons name="star" size={12} color={colors.warning} />
                    <Text style={{ color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>{profile.average_rating.toFixed(1)} ({profile.total_reviews})</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={150}>
            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onSurface, marginBottom: 8 }}>{t('provider.settings')}</Text>
            <View style={{ backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.outlineVariant, marginBottom: 20 }}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(item.route as any)}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== menuItems.length - 1 ? 1 : 0, borderBottomColor: colors.surfaceContainer }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginEnd: 12 }}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>{item.title}</Text>
                  {item.id === '5' && subscription?.plan?.profile_badge && (
                    <View style={{ backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 1, borderRadius: Radius.full, marginEnd: 6 }}>
                      <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, color: colors.primary }}>
                        {i18n.language === 'ar' ? subscription.plan.profile_badge_ar : subscription.plan.profile_badge}
                      </Text>
                    </View>
                  )}
                  <MaterialIcons name="chevron-right" size={20} color={colors.iconDefault} style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={2} delay={200}>
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: colors.errorBgDark, padding: 12, borderRadius: Radius.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={16} color={colors.error} />
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.error, marginStart: 8 }}>{t('provider.signOut')}</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
