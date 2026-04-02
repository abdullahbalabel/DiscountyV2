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
  const isDark = colorScheme === 'dark';
  const { t, i18n } = useTranslation();

  const toggleTheme = () => {
    Appearance.setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language?.startsWith('ar') ? 'en' : 'ar');
  };

  const surfaceBg = isDark ? '#1a110f' : '#fff8f6';
  const surfaceContainerLowest = isDark ? '#322825' : '#ffffff';
  const surfaceContainerHigh = isDark ? '#534340' : '#f5ddd9';
  const surfaceContainer = isDark ? '#3d3230' : '#f0e0dc';
  const onSurface = isDark ? '#f1dfda' : '#231917';
  const onSurfaceVariant = isDark ? '#d8c2bd' : '#564340';
  const borderColor = isDark ? '#3d3230' : '#f0e0dc';

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
    <View style={{ flex: 1, backgroundColor: surfaceBg }}>
      <View style={{ width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isDark ? '#2c1600' : surfaceBg }}>
        <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: onSurface }}>Profile</Text>
        <AnimatedButton style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name="settings" size={18} color={isDark ? '#d8c2bd' : '#564340'} />
        </AnimatedButton>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 12 }}>
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 8 }}>
          <AnimatedEntrance index={0} delay={100}>
            <View style={{ backgroundColor: surfaceContainerLowest, padding: 16, borderRadius: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: 'rgba(134,32,69,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <MaterialIcons name="person" size={24} color="#862045" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 16, color: onSurface }}>Alexa Doe</Text>
                <Text style={{ color: onSurfaceVariant, fontFamily: 'Manrope', fontSize: 12, marginTop: 2 }}>alexa.doe@example.com</Text>
              </View>
              <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialIcons name="edit" size={16} color={isDark ? '#d8c2bd' : '#564340'} />
              </TouchableOpacity>
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={1} delay={150}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: onSurface, marginBottom: 8 }}>Account Settings</Text>
            <View style={{ backgroundColor: surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              {menuItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== menuItems.length - 1 ? 1 : 0, borderBottomColor: borderColor }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Epilogue', fontWeight: '600', fontSize: 14, color: onSurface }}>{item.title}</Text>
                  <MaterialIcons name="chevron-right" size={20} color={isDark ? '#a08d88' : '#85736f'} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={2} delay={200}>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: onSurface, marginBottom: 8 }}>Preferences</Text>
            <View style={{ backgroundColor: surfaceContainerLowest, borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
              {preferencesItems.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={item.onPress}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx !== preferencesItems.length - 1 ? 1 : 0, borderBottomColor: borderColor }}
                >
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: surfaceContainerHigh, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <MaterialIcons name={item.icon as any} size={16} color={item.color} />
                  </View>
                  <Text style={{ flex: 1, fontFamily: 'Epilogue', fontWeight: '600', fontSize: 14, color: onSurface }}>{item.title}</Text>
                  <MaterialIcons name="sync" size={16} color={isDark ? '#a08d88' : '#85736f'} />
                </TouchableOpacity>
              ))}
            </View>
          </AnimatedEntrance>

          <AnimatedEntrance index={3} delay={250}>
            <TouchableOpacity
              style={{ width: '100%', backgroundColor: isDark ? 'rgba(186,26,26,0.2)' : '#ffdad6', padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
              onPress={() => signOut()}
            >
              <MaterialIcons name="logout" size={16} color="#ba1a1a" style={{ marginRight: 8 }} />
              <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 14, color: '#ba1a1a' }}>Sign Out</Text>
            </TouchableOpacity>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
