import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Appearance, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useAuth } from '../../contexts/auth';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();
  const { t, i18n } = useTranslation();

  const toggleTheme = () => {
    Appearance.setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language?.startsWith('ar') ? 'en' : 'ar');
  };

  const menuItems = [
    { id: '1', title: 'Personal Information', icon: 'person-outline', color: '#7b5733' },
    { id: '2', title: 'Payment Methods', icon: 'credit-card', color: '#10b981' },
    { id: '3', title: 'Security', icon: 'shield', color: '#8b5cf6' },
    { id: '4', title: 'Help & Support', icon: 'help-outline', color: '#85736f' },
  ];

  const preferencesItems = [
    {
      id: 'theme',
      title: colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode',
      icon: colorScheme === 'dark' ? 'light-mode' : 'dark-mode',
      color: '#f59e0b',
      onPress: toggleTheme
    },
    {
      id: 'lang',
      title: i18n.language?.startsWith('ar') ? 'English' : 'العربية',
      icon: 'language',
      color: '#0ea5e9',
      onPress: toggleLanguage
    },
  ];

  return (
    <View className="flex-1 bg-surface">
      {/* Header */}
      <View className={`w-full px-4 pt-12 pb-2 flex-row justify-between items-center ${colorScheme === 'dark' ? 'bg-[#2c1600]' : 'bg-surface'}`}>
        <View className="flex-row items-center gap-2">
          <Text className="font-headline font-bold tracking-tight text-lg text-on-surface">
            Profile
          </Text>
        </View>
        <AnimatedButton className="w-8 h-8 rounded-md bg-surface-container-high items-center justify-center p-0">
          <MaterialIcons name="settings" size={18} color={colorScheme === 'dark' ? '#d8c2bd' : '#564340'} />
        </AnimatedButton>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 12 }}>
        <View className="px-4 gap-y-4 pt-2">
          {/* Profile Card */}
          <AnimatedEntrance index={0} delay={100}>
            <View className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm mb-5 flex-row items-center">
              <View className="w-12 h-12 rounded-md bg-primary/10 items-center justify-center mr-3">
                <MaterialIcons name="person" size={24} color="#862045" />
              </View>
              <View className="flex-1">
                <Text className="font-headline font-bold text-base text-on-surface">Alexa Doe</Text>
                <Text className="text-on-surface-variant font-body text-xs mt-0.5">alexa.doe@example.com</Text>
              </View>
              <TouchableOpacity className="w-8 h-8 rounded-md bg-surface-container-high items-center justify-center">
                <MaterialIcons name="edit" size={16} color={colorScheme === 'dark' ? '#d8c2bd' : '#564340'} />
              </TouchableOpacity>
            </View>
          </AnimatedEntrance>

          {/* Menu Items */}
          <AnimatedEntrance index={1} delay={150}>
            <Text className="font-headline font-bold text-sm text-on-surface mb-2">Account Settings</Text>
            <View className="bg-surface-container-lowest rounded-2xl overflow-hidden mb-5">
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  className={`flex-row items-center p-3 ${idx !== menuItems.length - 1 ? 'border-b border-surface-container' : ''}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-surface-container-high items-center justify-center mr-3">
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text className="flex-1 font-headline font-semibold text-sm text-on-surface">{item.title}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={colorScheme === 'dark' ? '#a08d88' : '#85736f'} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          {/* Preferences */}
          <AnimatedEntrance index={2} delay={200}>
            <Text className="font-headline font-bold text-sm text-on-surface mb-2">Preferences</Text>
            <View className="bg-surface-container-lowest rounded-2xl overflow-hidden mb-5">
              {preferencesItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  className={`flex-row items-center p-3 ${idx !== preferencesItems.length - 1 ? 'border-b border-surface-container' : ''}`}
                >
                  <View className="w-8 h-8 rounded-lg bg-surface-container-high items-center justify-center mr-3">
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text className="flex-1 font-headline font-semibold text-sm text-on-surface">{item.title}</Text>
                  <MaterialIcons name="sync" size={16} color={colorScheme === 'dark' ? '#a08d88' : '#85736f'} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          {/* Action Buttons */}
          <AnimatedEntrance index={3} delay={250}>
            <TouchableOpacity
              className="w-full bg-error-container p-3 rounded-xl flex-row items-center justify-center mb-3"
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={16} color="#ba1a1a" className="mr-2" />
              <Text className="font-headline font-bold text-sm text-error">Sign Out</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
