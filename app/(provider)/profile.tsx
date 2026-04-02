import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';
import { supabase } from '../../lib/supabase';
import type { ProviderProfile } from '../../lib/types';

export default function ProviderProfileScreen() {
  const { signOut, session } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [profile, setProfile] = useState<ProviderProfile | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from('provider_profiles').select('*').eq('user_id', session.user.id).single();
      if (data) setProfile(data as ProviderProfile);
    };
    fetchProfile();
  }, [session]);

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const borderColor = isDark ? '#3d3230' : '#f0e0dc';
  const outlineVariant = isDark ? 'rgba(160,141,136,0.1)' : 'rgba(133,115,111,0.1)';

  const menuItems = [
    { id: '1', title: 'Business Information', icon: 'store', color: '#7b5733' },
    { id: '2', title: 'Business Hours', icon: 'schedule', color: '#10b981' },
    { id: '3', title: 'Social Media Links', icon: 'share', color: '#8b5cf6' },
    { id: '4', title: 'Help & Support', icon: 'help-outline', color: '#85736f' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>Profile</Text>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="settings" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: surfaceContainerLowest, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: outlineVariant, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialCommunityIcons name="store" size={24} color="#862045" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface }}>{profile?.business_name || 'Your Business'}</Text>
                <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', fontSize: 12, marginTop: 2 }}>{profile?.category || 'Category'}</Text>
                {profile?.average_rating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <MaterialIcons name="star" size={12} color="#f59e0b" />
                    <Text style={{ color: onSurfaceVariant, fontSize: 12, fontWeight: '600' }}>{profile.average_rating.toFixed(1)} ({profile.total_reviews})</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={150}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: onSurface, marginBottom: 8 }}>Settings</Text>
            <View style={{ backgroundColor: surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: outlineVariant, marginBottom: 20 }}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== menuItems.length - 1 ? 1 : 0, borderBottomColor: borderColor }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Epilogue', fontWeight: '600', fontSize: 14, color: onSurface }}>{item.title}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#85736f" />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={2} delay={200}>
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: isDark ? 'rgba(186,26,26,0.2)' : '#ffdad6', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={16} color="#ba1a1a" />
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: '#ba1a1a', marginLeft: 8 }}>Sign Out</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
