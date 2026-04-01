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

  // Step 1: Business Info
  const [businessName, setBusinessName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState('');

  // Step 2: Contact & Social
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Pick logo image
  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setLogoUri(result.assets[0].uri);
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is needed to set your business location.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);

    // Reverse geocode for display name
    const [address] = await Location.reverseGeocodeAsync({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    });
    if (address) {
      setLocationName(
        [address.street, address.city, address.region].filter(Boolean).join(', ')
      );
    }
  };

  // Upload logo to Supabase Storage
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoUri || !session?.user) return null;

    try {
      const response = await fetch(logoUri);
      const blob = await response.blob();

      // Detect content type from blob (works on web where URI is blob:)
      const mimeType = blob.type || 'image/jpeg';
      const ext = mimeType.split('/')[1] || 'jpg';
      const fileName = `${session.user.id}/logo.${ext}`;

      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error } = await supabase.storage
        .from('provider-assets')
        .upload(fileName, arrayBuffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (error) {
        console.error('Logo upload error:', error);
        return null;
      }

      const { data: urlData } = supabase.storage
        .from('provider-assets')
        .getPublicUrl(fileName);

      return urlData?.publicUrl || null;
    } catch (err) {
      console.error('Logo upload failed:', err);
      return null;
    }
  };

  // Submit
  const handleSubmit = async () => {
    if (!session?.user) return;
    setIsLoading(true);

    try {
      // 1. Set role to provider
      const roleResult = await setUserRole('provider');
      if (roleResult.error) throw new Error(roleResult.error);

      // 2. Upload logo
      const logoUrl = await uploadLogo();

      // 3. Create provider profile
      const { error: profileError } = await supabase
        .from('provider_profiles')
        .insert({
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

      // Navigation handled by AuthProvider (detects pending status)
      router.replace('/(auth)/pending-approval');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const canAdvance = () => {
    if (step === 0) return businessName.trim() && selectedCategory;
    if (step === 1) return true; // Contact info is optional
    return true;
  };

  const renderStep0 = () => (
    <AnimatedEntrance index={0}>
      <View className="flex-col gap-6">
        {/* Logo Upload */}
        <View className="items-center mb-2">
          <Pressable onPress={pickLogo}>
            <View className="w-24 h-24 rounded-3xl border-2 border-dashed items-center justify-center overflow-hidden border-outline-variant/30 bg-surface-container-low">
              {logoUri ? (
                <Image source={{ uri: logoUri }} className="w-full h-full" contentFit="cover" />
              ) : (
                <MaterialIcons name="add-a-photo" size={32} color="#85736f" />
              )}
            </View>
          </Pressable>
          <Text className="text-on-surface-variant text-xs mt-2 font-medium">Tap to add logo</Text>
        </View>

        {/* Business Name */}
        <View>
          <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">
            Business Name *
          </Text>
          <TextInput
            className="w-full px-6 py-4 rounded-xl font-medium shadow-sm bg-surface-container-lowest border-outline-variant/10 text-on-surface"
            placeholderTextColor="#85736f"
            placeholder="e.g. Coffee Corner"
            value={businessName}
            onChangeText={setBusinessName}
          />
        </View>

        {/* Category */}
        <View>
          <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">
            Category *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="overflow-visible">
            <View className="flex-row gap-2">
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-3 rounded-xl flex-row items-center gap-2 ${selectedCategory === cat.id
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container-lowest border-outline-variant/10'
                    }`}
                >
                  <MaterialIcons
                    name={cat.icon as any}
                    size={18}
                    color={selectedCategory === cat.id ? 'white' : '#85736f'}
                  />
                  <Text className={`font-body font-semibold text-sm ${selectedCategory === cat.id ? 'text-white' : 'text-on-surface'
                    }`}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Description */}
        <View>
          <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">
            Description
          </Text>
          <TextInput
            className="w-full px-6 py-4 rounded-xl font-medium shadow-sm h-28 bg-surface-container-lowest border-outline-variant/10 text-on-surface"
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
          <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">
            Business Location
          </Text>
          <AnimatedButton
            className="w-full px-6 py-4 rounded-xl flex-row items-center gap-3 bg-surface-container-lowest border-outline-variant/10"
            onPress={getCurrentLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#862045" />
            <Text className={`font-body flex-1 ${locationName ? 'text-on-surface' : 'text-on-surface-variant'}`}>
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
      <View className="flex-col gap-6">
        {/* Phone */}
        <View>
          <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">
            Business Phone
          </Text>
          <TextInput
            className="w-full px-6 py-4 rounded-xl font-medium shadow-sm bg-surface-container-lowest border-outline-variant/10 text-on-surface"
            placeholderTextColor="#85736f"
            placeholder="+966 5XX XXX XXX"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
        </View>

        {/* Website */}
        <View>
          <Text className="font-label font-bold text-xs uppercase tracking-wider text-on-surface-variant ml-1 mb-2">
            Website
          </Text>
          <TextInput
            className="w-full px-6 py-4 rounded-xl font-medium shadow-sm bg-surface-container-lowest border-outline-variant/10 text-on-surface"
            placeholderTextColor="#85736f"
            placeholder="https://www.example.com"
            keyboardType="url"
            autoCapitalize="none"
            value={website}
            onChangeText={setWebsite}
          />
        </View>

        {/* Social Links */}
        <Text className="font-headline font-bold text-lg text-on-surface mt-2">Social Media</Text>

        {[
          { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: '@your_handle' },
          { key: 'facebook', label: 'Facebook', icon: 'facebook', placeholder: 'facebook.com/page' },
          { key: 'tiktok', label: 'TikTok', icon: 'music-note', placeholder: '@tiktok_handle' },
          { key: 'x', label: 'X (Twitter)', icon: 'tag', placeholder: '@handle' },
          { key: 'snapchat', label: 'Snapchat', icon: 'camera', placeholder: '@snapchat_user' },
        ].map((social) => (
          <View key={social.key} className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-xl items-center justify-center bg-surface-container-high">
              <MaterialIcons name={social.icon as any} size={20} color="#85736f" />
            </View>
            <TextInput
              className="flex-1 px-4 py-3 rounded-xl font-medium shadow-sm bg-surface-container-lowest border-outline-variant/10 text-on-surface"
              placeholderTextColor="#85736f"
              placeholder={social.placeholder}
              autoCapitalize="none"
              value={(socialLinks as any)[social.key] || ''}
              onChangeText={(text) =>
                setSocialLinks((prev) => ({ ...prev, [social.key]: text }))
              }
            />
          </View>
        ))}
      </View>
    </AnimatedEntrance>
  );

  const renderStep2 = () => (
    <AnimatedEntrance index={0}>
      <View className="flex-col gap-4">
        <Text className="font-headline font-bold text-xl text-on-surface mb-2">Review Your Application</Text>

        {/* Summary Card */}
        <View className="rounded-3xl p-6 bg-surface-container-lowest border-outline-variant/10">
          <View className="flex-row items-center gap-4 mb-4">
            {logoUri ? (
              <Image source={{ uri: logoUri }} className="w-16 h-16 rounded-2xl" contentFit="cover" />
            ) : (
              <View className="w-16 h-16 rounded-2xl bg-primary/10 items-center justify-center">
                <MaterialCommunityIcons name="store" size={32} color="#862045" />
              </View>
            )}
            <View className="flex-1">
              <Text className="font-headline font-bold text-xl text-on-surface">
                {businessName || 'Business Name'}
              </Text>
              <Text className="text-on-surface-variant text-sm font-medium mt-1">
                {categories.find((c) => c.id === selectedCategory)?.name || 'Category'}
              </Text>
            </View>
          </View>

          {description ? (
            <Text className="text-on-surface-variant text-sm mb-4 leading-5">{description}</Text>
          ) : null}

          {locationName ? (
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="location-on" size={16} color="#862045" />
              <Text className="text-on-surface text-sm">{locationName}</Text>
            </View>
          ) : null}

          {phone ? (
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="phone" size={16} color="#10b981" />
              <Text className="text-on-surface text-sm">{phone}</Text>
            </View>
          ) : null}

          {website ? (
            <View className="flex-row items-center gap-2 mb-2">
              <MaterialIcons name="language" size={16} color="#7b5733" />
              <Text className="text-on-surface text-sm">{website}</Text>
            </View>
          ) : null}
        </View>

        {/* Notice */}
        <View className="rounded-2xl p-4 flex-row items-start gap-3 bg-surface-container border-outline-variant/10">
          <MaterialIcons name="info" size={20} color="#f59e0b" />
          <Text className="flex-1 text-sm leading-5 text-on-surface-variant">
            Your application will be reviewed by our team. You'll be notified once approved and can start posting deals immediately.
          </Text>
        </View>
      </View>
    </AnimatedEntrance>
  );

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-6 pt-14 pb-4 flex-row justify-between items-center bg-surface">
        <View className="flex-row items-center gap-4">
          <AnimatedButton
            className="w-10 h-10 rounded-full bg-surface-container-high items-center justify-center p-0"
            onPress={() => step > 0 ? setStep(step - 1) : router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#85736f" />
          </AnimatedButton>
          <Text className="font-headline font-bold tracking-tight text-xl text-on-surface">
            Business Registration
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 24 }}>
          {/* Progress Stepper */}
          <View className="flex-row items-center justify-between mb-8">
            {STEPS.map((label, idx) => (
              <React.Fragment key={label}>
                <View className="items-center gap-2">
                  <View className={`w-10 h-10 rounded-full items-center justify-center ${idx <= step ? 'bg-primary' : 'bg-surface-container-highest'
                    }`}>
                    {idx < step ? (
                      <MaterialIcons name="check" size={20} color="white" />
                    ) : (
                      <Text className={`font-bold text-sm ${idx <= step ? 'text-white' : 'text-on-surface-variant'
                        }`}>
                        {idx + 1}
                      </Text>
                    )}
                  </View>
                  <Text className={`text-[10px] font-label font-bold uppercase tracking-widest ${idx <= step ? 'text-primary' : 'text-on-surface-variant'
                    }`}>
                    {label}
                  </Text>
                </View>
                {idx < STEPS.length - 1 && (
                  <View className={`flex-1 h-[2px] mx-3 ${idx < step ? 'bg-primary' : 'bg-surface-container-highest'
                    }`} />
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
      <View className="absolute bottom-0 w-full z-50 px-6 pb-8 pt-4 flex-row gap-4 bg-surface/90 border-t border-outline-variant/10">
        {step > 0 && (
          <AnimatedButton
            className="flex-1 py-4 rounded-full border-2 border-outline-variant/20 items-center justify-center"
            onPress={() => setStep(step - 1)}
          >
            <Text className="font-body font-bold text-on-surface">Back</Text>
          </AnimatedButton>
        )}
        <AnimatedButton
          variant="gradient"
          className={`${step > 0 ? 'flex-[2]' : 'flex-1'} py-4 rounded-full items-center justify-center`}
          onPress={step === STEPS.length - 1 ? handleSubmit : () => setStep(step + 1)}
          disabled={!canAdvance() || isLoading}
        >
          <Text className="font-body font-bold text-white text-base">
            {isLoading
              ? 'Submitting...'
              : step === STEPS.length - 1
                ? 'Submit Application'
                : 'Continue'
            }
          </Text>
        </AnimatedButton>
      </View>
    </View>
  );
}
