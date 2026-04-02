import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView, Platform, Pressable,
  ScrollView,
  Text, TextInput,
  useColorScheme,
  View
} from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { supabase } from '../../lib/supabase';
import type { Category, SocialLinks } from '../../lib/types';

const STEPS = ['Business Info', 'Contact & Social', 'Review'];

export default function ProviderSignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { session, setUserRole } = useAuth();

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
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is needed to set your business location.');
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
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return businessName.trim() && selectedCategory;
    return true;
  };

  // Common styles
  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  const inputStyle = {
    paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12,
    fontWeight: '500' as const, backgroundColor: surfaceContainerLowest,
    borderWidth: 1, borderColor: outlineVariant, color: onSurface, fontFamily: 'Manrope', fontSize: 16,
  } as const;

  const labelStyle = {
    fontFamily: 'Manrope', fontWeight: '700' as const, fontSize: 12, textTransform: 'uppercase' as const,
    letterSpacing: 1.5, color: onSurfaceVariant, marginLeft: 4, marginBottom: 8,
  } as const;

  const renderStep0 = () => (
    <AnimatedEntrance index={0}>
      <View style={{ gap: 24 }}>
        {/* Logo Upload */}
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Pressable onPress={pickLogo}>
            <View style={{
              width: 96, height: 96, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed',
              borderColor: onSurfaceVariant + '4D', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', backgroundColor: surfaceContainerHigh,
            }}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
              ) : (
                <MaterialIcons name="add-a-photo" size={32} color="#85736f" />
              )}
            </View>
          </Pressable>
          <Text style={{ color: onSurfaceVariant, fontSize: 12, marginTop: 8, fontWeight: '500' }}>Tap to add logo</Text>
        </View>

        {/* Business Name */}
        <View>
          <Text style={labelStyle}>Business Name *</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor="#85736f"
            placeholder="e.g. Coffee Corner"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        {/* Category */}
        <View>
          <Text style={labelStyle}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ overflow: 'visible' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12,
                    flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: selectedCategory === cat.id ? '#862045' : surfaceContainerLowest,
                    borderWidth: 1, borderColor: selectedCategory === cat.id ? '#862045' : outlineVariant,
                  }}
                >
                  <MaterialIcons name={cat.icon as any} size={18} color={selectedCategory === cat.id ? 'white' : '#85736f'} />
                  <Text style={{
                    fontFamily: 'Manrope', fontWeight: '600', fontSize: 14,
                    color: selectedCategory === cat.id ? '#fff' : onSurface,
                  }}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description */}
        <View>
          <Text style={labelStyle}>Description</Text>
          <TextInput
            style={[inputStyle, { height: 112 }]}
            placeholderTextColor="#85736f"
            placeholder="Tell customers about your business..."
            multiline
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Location */}
        <View>
          <Text style={labelStyle}>Business Location</Text>
          <AnimatedButton
            style={{
              width: '100%', paddingHorizontal: 24, paddingVertical: 16, borderRadius: 12,
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: surfaceContainerLowest, borderWidth: 1, borderColor: outlineVariant,
            }}
            onPress={getCurrentLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#862045" />
            <Text style={{ fontFamily: 'Manrope', flex: 1, color: locationName ? onSurface : onSurfaceVariant }}>
              {locationName || 'Tap to use current location'}
            </Text>
            {latitude && <MaterialIcons name="check-circle" size={20} color="#10b981" />}
          </AnimatedButton>
        </View>
      </View>
    </AnimatedEntrance>
  );

  const renderStep1 = () => (
    <AnimatedEntrance index={0}>
      <View style={{ gap: 24 }}>
        <View>
          <Text style={labelStyle}>Business Phone</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor="#85736f"
            placeholder="+966 5XX XXX XXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        <View>
          <Text style={labelStyle}>Website</Text>
          <TextInput
            style={inputStyle}
            placeholderTextColor="#85736f"
            placeholder="https://www.example.com"
            keyboardType="url"
            autoCapitalize="none"
            value={website}
            onChangeText={setWebsite}
          />
        </View>

        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 18, color: onSurface, marginTop: 8 }}>Social Media</Text>

        {[
          { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: '@your_handle' },
          { key: 'facebook', label: 'Facebook', icon: 'facebook', placeholder: 'facebook.com/page' },
          { key: 'tiktok', label: 'TikTok', icon: 'music-note', placeholder: '@tiktok_handle' },
          { key: 'x', label: 'X (Twitter)', icon: 'tag', placeholder: '@handle' },
          { key: 'snapchat', label: 'Snapchat', icon: 'camera', placeholder: '@snapchat_user' },
        ].map((social) => (
          <View key={social.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: surfaceContainerHigh }}>
              <MaterialIcons name={social.icon as any} size={20} color="#85736f" />
            </View>
            <TextInput
              style={[inputStyle, { flex: 1 }]}
              placeholderTextColor="#85736f"
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
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface, marginBottom: 8 }}>Review Your Application</Text>

        <View style={{ borderRadius: 24, padding: 24, backgroundColor: surfaceContainerLowest, borderWidth: 1, borderColor: outlineVariant }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={{ width: 64, height: 64, borderRadius: 16 }} contentFit="cover" />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="store" size={32} color="#862045" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: onSurface }}>
                {businessName || 'Business Name'}
              </Text>
              <Text style={{ color: onSurfaceVariant, fontSize: 14, fontWeight: '500', marginTop: 4 }}>
                {categories.find((c) => c.id === selectedCategory)?.name || 'Category'}
              </Text>
            </View>
          </View>

          {description ? (
            <Text style={{ color: onSurfaceVariant, fontSize: 14, marginBottom: 16, lineHeight: 20 }}>{description}</Text>
          ) : null}

          {locationName ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="location-on" size={16} color="#862045" />
              <Text style={{ color: onSurface, fontSize: 14 }}>{locationName}</Text>
            </View>
          ) : null}

          {phone ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="phone" size={16} color="#10b981" />
              <Text style={{ color: onSurface, fontSize: 14 }}>{phone}</Text>
            </View>
          ) : null}

          {website ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MaterialIcons name="language" size={16} color="#7b5733" />
              <Text style={{ color: onSurface, fontSize: 14 }}>{website}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: surfaceContainer, borderWidth: 1, borderColor: outlineVariant }}>
          <MaterialIcons name="info" size={20} color="#f59e0b" />
          <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: onSurfaceVariant }}>
            Your application will be reviewed by our team. You'll be notified once approved and can start posting deals immediately.
          </Text>
        </View>
      </View>
    </AnimatedEntrance>
  );

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      {/* Header */}
      <View style={{ width: '100%', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <AnimatedButton
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => step > 0 ? setStep(step - 1) : router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 20, color: onSurface }}>
            Business Registration
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24 }}>
          {/* Progress Stepper */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            {STEPS.map((label, idx) => (
              <React.Fragment key={label}>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: idx <= step ? '#862045' : surfaceContainerHigh,
                  }}>
                    {idx < step ? (
                      <MaterialIcons name="check" size={20} color="white" />
                    ) : (
                      <Text style={{ fontWeight: '700', fontSize: 14, color: idx <= step ? '#fff' : onSurfaceVariant }}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 10, fontFamily: 'Manrope', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 3, color: idx <= step ? '#862045' : onSurfaceVariant }}>
                    {label}
                  </Text>
                </View>
                {idx < STEPS.length - 1 && (
                  <View style={{ flex: 1, height: 2, marginHorizontal: 12, backgroundColor: idx < step ? '#862045' : surfaceContainerHigh }} />
                )}
              </React.Fragment>
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
        paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16,
        flexDirection: 'row', gap: 16,
        backgroundColor: surfaceBg + 'E6', borderTopWidth: 1, borderColor: outlineVariant,
      }}>
        {step > 0 && (
          <AnimatedButton
            style={{ flex: 1, paddingVertical: 16, borderRadius: 999, borderWidth: 2, borderColor: outlineVariant, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => setStep(step - 1)}
          >
            <Text style={{ fontFamily: 'Manrope', fontWeight: '700', color: onSurface }}>Back</Text>
          </AnimatedButton>
        )}
        <AnimatedButton
          variant="gradient"
          style={{ flex: step > 0 ? 2 : 1, paddingVertical: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center', opacity: (!canAdvance() || isLoading) ? 0.6 : 1 }}
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}
          disabled={!canAdvance() || isLoading}
        >
          <Text style={{ fontFamily: 'Manrope', fontWeight: '700', color: '#fff', fontSize: 16 }}>
            {isLoading ? 'Submitting...' : step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
}
