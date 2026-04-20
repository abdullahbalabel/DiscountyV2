import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  I18nManager,
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView,
  Text, TextInput,
  View
} from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { resolveMaterialIcon } from '../../lib/iconMapping';
import { supabase } from '../../lib/supabase';
import type { Category, SocialLinks } from '../../lib/types';
import { Shadows } from '../../hooks/use-theme-colors';

export default function ProviderSignupScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { session, setUserRole } = useAuth();

  const STEPS = [t('auth.businessInfo'), t('auth.contactSocial'), t('auth.review')];

  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [businessName, setBusinessName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');

  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('*').order('sort_order');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setLogoUri(result.assets[0].uri);
  };

  const getCurrentLocation = async () => {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(t('auth.locationUnavailable'), t('auth.enableLocationServices'));
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('auth.permissionDenied'), t('auth.locationPermissionNeeded'));
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      if (address) {
        setLocationName([address.street, address.city, address.region].filter(Boolean).join(', '));
      }
    } catch (err: any) {
      console.error('Location error:', err);
      Alert.alert(t('auth.locationUnavailable'), t('auth.locationErrorMessage'));
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoUri || !session?.user) return null;
    try {
      const response = await fetch(logoUri);
      const blob = await response.blob();
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const fileName = `${session.user.id}/logo.${ext}`;
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error } = await supabase.storage.from('provider-assets').upload(fileName, arrayBuffer, {
        contentType: mimeType, upsert: true,
      });
      if (error) { console.error('Logo upload error:', error); return null; }
      const { data: urlData } = supabase.storage.from('provider-assets').getPublicUrl(fileName);
      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Logo upload failed:', err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!session?.user) return;
    setIsLoading(true);
    try {
      const roleResult = await setUserRole('provider');
      if (roleResult.error) throw new Error(roleResult.error);
      const logoUrl = await uploadLogo();
      const { error: profileError } = await supabase.from('provider_profiles').insert({
        user_id: session.user.id,
        business_name: businessName,
        category: selectedCategory,
        description,
        logo_url: logoUrl,
        latitude: latitude || 0,
        longitude: longitude || 0,
        phone,
        website: website || null,
        social_links: socialLinks,
        approval_status: 'pending',
      });
      if (profileError) throw new Error(profileError.message);
      router.replace('/(auth)/pending-approval');
    } catch (err: any) {
      Alert.alert(t('auth.error'), err.message || t('auth.somethingWentWrong'));
    } finally {
      setIsLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return businessName.trim() && selectedCategory;
    return true;
  };

  const inputStyle = {
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E4E4E7', color: '#18181B', fontFamily: 'Cairo', fontSize: 15,
  } as const;

  const labelStyle = {
    fontFamily: 'Cairo_700Bold' as const, fontSize: 12, textTransform: 'uppercase' as const,
    letterSpacing: 1, color: '#71717A', marginStart: 4, marginBottom: 6,
  } as const;

  const renderStep0 = () => (
    <AnimatedEntrance index={0}>
      <View style={{ gap: 20 }}>
        {/* Logo Upload */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Pressable onPress={pickLogo}>
            <View style={{
              width: 88, height: 88, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed',
              borderColor: '#E4E4E7', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', backgroundColor: '#F9FAFB',
            }}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <MaterialIcons name="add-a-photo" size={28} color="#A1A1AA" />
              )}
            </View>
          </Pressable>
          <Text style={{ color: '#A1A1AA', fontSize: 12, marginTop: 8, fontFamily: 'Cairo' }}>{t('auth.tapToAddLogo')}</Text>
        </View>

        {/* Business Name */}
        <View>
          <Text style={labelStyle}>{t('auth.businessNameRequired')}</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor="#A1A1AA"
            placeholder={t('auth.businessNamePlaceholder')}
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        {/* Category */}
        <View>
          <Text style={labelStyle}>{t('auth.categoryRequired')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10,
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: selectedCategory === cat.id ? '#18181B' : '#FFFFFF',
                    borderWidth: 1, borderColor: selectedCategory === cat.id ? '#18181B' : '#E4E4E7',
                  }}
                >
                  <MaterialIcons name={resolveMaterialIcon(cat.icon)} size={16} color={selectedCategory === cat.id ? '#fff' : '#71717A'} />
                  <Text style={{
                    fontFamily: 'Cairo_600SemiBold', fontSize: 13,
                    color: selectedCategory === cat.id ? '#fff' : '#18181B',
                  }}>
                    {i18n.language === 'ar' ? cat.name_ar : cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description */}
        <View>
          <Text style={labelStyle}>{t('provider.description')}</Text>
          <TextInput
            style={[inputStyle, { height: 104, textAlignVertical: 'top' }]}
            placeholderTextColor="#A1A1AA"
            placeholder={t('auth.describeBusinessPlaceholder')}
            multiline
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Location */}
        <View>
          <Text style={labelStyle}>{t('auth.businessLocation')}</Text>
          <AnimatedButton
            style={{
              width: '100%', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7',
            }}
            onPress={getCurrentLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#18181B" />
            <Text style={{ fontFamily: 'Cairo', flex: 1, color: locationName ? '#18181B' : '#A1A1AA' }}>
              {locationName || t('auth.tapCurrentLocation')}
            </Text>
            {latitude && <MaterialIcons name="check-circle" size={20} color="#10b981" />}
          </AnimatedButton>
        </View>
      </View>
    </AnimatedEntrance>
  );

  const renderStep1 = () => (
    <AnimatedEntrance index={0}>
      <View style={{ gap: 20 }}>
        <View>
          <Text style={labelStyle}>{t('auth.businessPhone')}</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor="#A1A1AA"
            placeholder="+966 5XX XXX XXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View>
          <Text style={labelStyle}>{t('customer.website')}</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor="#A1A1AA"
            placeholder="https://www.example.com"
            keyboardType="url"
            autoCapitalize="none"
            value={website}
            onChangeText={setWebsite}
          />
        </View>

        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 16, color: '#18181B', marginTop: 8 }}>{t('auth.socialMedia')}</Text>

        {[
          { key: 'instagram', label: t('auth.instagram'), icon: 'instagram', placeholder: t('auth.instagramPlaceholder') },
          { key: 'facebook', label: t('auth.facebook'), icon: 'facebook', placeholder: t('auth.facebookPlaceholder') },
          { key: 'tiktok', label: t('auth.tikTok'), icon: 'music-note', placeholder: t('auth.tikTokPlaceholder') },
          { key: 'x', label: t('auth.xTwitter'), icon: 'tag', placeholder: t('auth.xTwitterPlaceholder') },
          { key: 'snapchat', label: t('auth.snapchat'), icon: 'camera', placeholder: t('auth.snapchatPlaceholder') },
        ].map((social) => (
          <View key={social.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F4F5' }}>
              <MaterialIcons name={social.icon as any} size={18} color="#71717A" />
            </View>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              placeholderTextColor="#A1A1AA"
              placeholder={social.placeholder}
              autoCapitalize="none"
              value={(socialLinks as any)[social.key] || ''}
              onChangeText={(text) => setSocialLinks((prev) => ({ ...prev, [social.key]: text }))}
            />
          </View>
        ))}
      </View>
    </AnimatedEntrance>
  );

  const renderStep2 = () => (
    <AnimatedEntrance index={0}>
      <View style={{ gap: 16 }}>
        <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: '#18181B', marginBottom: 4 }}>{t('auth.reviewApplication')}</Text>

        <View style={{ borderRadius: 12, padding: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4E4E7', ...Shadows.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
            ) : (
              <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="store" size={28} color="#71717A" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: '#18181B' }}>
                {businessName || t('auth.businessName')}
              </Text>
              <Text style={{ color: '#71717A', fontSize: 13, fontFamily: 'Cairo', marginTop: 2 }}>
                {(i18n.language === 'ar' ? categories.find((c) => c.id === selectedCategory)?.name_ar : categories.find((c) => c.id === selectedCategory)?.name) || t('provider.category')}
              </Text>
            </View>
          </View>

          {description ? (
            <Text style={{ color: '#71717A', fontSize: 14, marginBottom: 14, lineHeight: 20, fontFamily: 'Cairo' }}>{description}</Text>
          ) : null}

          {locationName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="location-on" size={16} color="#71717A" />
              <Text style={{ color: '#18181B', fontSize: 13, fontFamily: 'Cairo' }}>{locationName}</Text>
            </View>
          ) : null}

          {phone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="phone" size={16} color="#71717A" />
              <Text style={{ color: '#18181B', fontSize: 13, fontFamily: 'Cairo' }}>{phone}</Text>
            </View>
          ) : null}

          {website ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="language" size={16} color="#71717A" />
              <Text style={{ color: '#18181B', fontSize: 13, fontFamily: 'Cairo' }}>{website}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF3C7' }}>
          <MaterialIcons name="info" size={18} color="#F59E0B" />
          <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: '#92400E', fontFamily: 'Cairo' }}>
            {t('auth.applicationReviewed')}
          </Text>
        </View>
      </View>
    </AnimatedEntrance>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <AnimatedButton
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F4F4F5', alignItems: 'center', justifyContent: 'center' }}
            onPress={() => step > 0 ? setStep(step - 1) : router.back()}
          >
            <MaterialIcons name="arrow-back" size={22} color="#71717A" style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined} />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 18, color: '#18181B' }}>
            {t('auth.businessRegistration')}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24 }}>
          {/* Step Indicator — dots */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 32 }}>
            {STEPS.map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: idx === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: idx === step ? '#18181B' : '#E4E4E7',
                }}
              />
            ))}
          </View>

          {/* Step Content */}
          {step === 0 && renderStep0()}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Action Bar */}
      <View style={{
        position: 'absolute', bottom: 0, width: '100%', zIndex: 50,
        paddingHorizontal: 24, paddingBottom: 32, paddingTop: 20,
        gap: 12,
        backgroundColor: '#FFFFFF', borderTopWidth: 1, borderColor: '#F4F4F5',
      }}>
        <AnimatedButton
          variant="gradient"
          style={{
            width: '100%', paddingVertical: 18, borderRadius: 14,
            alignItems: 'center', justifyContent: 'center',
            opacity: (!canAdvance() || isLoading) ? 0.6 : 1,
          }}
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}
          disabled={!canAdvance() || isLoading}
        >
          <Text style={{ fontFamily: 'Cairo_700Bold', color: '#fff', fontSize: 16 }}>
            {isLoading ? t('auth.submitting') : step === STEPS.length - 1 ? t('auth.submitApplication') : t('auth.continue')}
          </Text>
        </AnimatedButton>
        {step > 0 && (
          <Pressable
            onPress={() => setStep(step - 1)}
            style={{ paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ fontFamily: 'Cairo_600SemiBold', color: '#71717A', fontSize: 15 }}>{t('auth.back')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
