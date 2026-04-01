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
      const { data } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (data) setProfile(data as ProviderProfile);
    };
    fetchProfile();
  }, [session]);

  const menuItems = [
    { id: '1', title: 'Business Information', icon: 'store', color: '#7b5733' },
    { id: '2', title: 'Business Hours', icon: 'schedule', color: '#10b981' },
    { id: '3', title: 'Social Media Links', icon: 'share', color: '#8b5cf6' },
    { id: '4', title: 'Help & Support', icon: 'help-outline', color: '#85736f' },
  ];

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className="w-full px-4 pt-12 pb-2 flex-row justify-between items-center bg-surface">
        <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
          Profile
        </Text>
        <AnimatedButton className="w-8 h-8 rounded-full bg-surface-container-high items-center justify-center p-0">
          <MaterialIcons name="settings" size={18} color="#85736f" />
        </AnimatedButton>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 12 }}>
        <View className="px-4 gap-y-4 pt-2">
          {/* Profile Card */}
          <AnimatedEntrance index={0} delay={100}>
            <View className="bg-surface-container-lowest p-4 rounded-2xl border-outline-variant/10 shadow-sm mb-5 flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mr-3">
                <MaterialCommunityIcons name="store" size={24} color="#862045" />
              </View>
              <View className="flex-1">
                <Text className="font-headline font-bold text-base text-on-surface">
                  {profile?.business_name || 'Your Business'}
                </Text>
                <Text className="text-on-surface-variant font-body text-xs mt-0.5">
                  {profile?.category || 'Category'}
                </Text>
                {profile?.average_rating ? (
                  <View className="flex-row items-center gap-1 mt-0.5">
                    <MaterialIcons name="star" size={12} color="#f59e0b" />
                    <Text className="text-on-surface-variant text-xs font-semibold">
                      {profile.average_rating.toFixed(1)} ({profile.total_reviews})
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </AnimatedEntrance>

          {/* Menu */}
          <AnimatedEntrance index={1} delay={150}>
            <Text className="font-headline font-bold text-sm text-on-surface mb-2">Settings</Text>
            <View className="bg-surface-container-lowest rounded-2xl border-outline-variant/10 overflow-hidden mb-5">
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  className={`flex-row items-center p-3 ${idx !== menuItems.length - 1 ? 'border-b border-surface-container' : ''}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-surface-container-high items-center justify-center mr-3">
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text className="flex-1 font-headline font-semibold text-sm text-on-surface">{item.title}</Text>
                  <MaterialIcons name="chevron-right" size={20} color="#85736f" />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          {/* Sign Out */}
          <AnimatedEntrance index={2} delay={200}>
            <TouchableOpacity
              className="w-full bg-error-container p-3 rounded-xl flex-row items-center justify-center mb-3"
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={16} color="#ba1a1a" />
              <Text className="font-headline font-bold text-sm text-error ml-2">Sign Out</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
