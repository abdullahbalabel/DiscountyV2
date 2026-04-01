import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, useColorScheme, View } from 'react-native';
import { AnimatedButton } from '../../components/ui/AnimatedButton';
import { GlassView } from '../../components/ui/GlassView';
import { useAuth } from '../../contexts/auth';

export default function RoleSelectScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { setUserRole } = useAuth();
  const [isSettingRole, setIsSettingRole] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSelectCustomer = async () => {
    setIsSettingRole(true);
    setError('');
    const result = await setUserRole('customer');
    if (result.error) {
      console.error('Error setting role:', result.error);
      setError(result.error);
      setIsSettingRole(false);
    }
    // Navigation handled by AuthProvider on success
  };

  const handleSelectProvider = () => {
    router.push('/(auth)/provider-signup');
  };

  return (
    <View className="flex-1 bg-surface relative">
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
        className="absolute inset-0 z-0"
        contentFit="cover"
      />
      <View className="absolute inset-0 z-0 bg-black/60" />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <GlassView
          intensity={colorScheme === 'dark' ? 30 : 50}
          className="w-full max-w-lg mx-6 rounded-[2rem] p-10 shadow-2xl z-10 border-white/20"
        >
          {/* Header */}
          <View className="mb-10 items-center">
            <View className="w-16 h-16 rounded-md bg-white/10 border-white/20 items-center justify-center mb-6">
              <MaterialIcons name="person-add" size={32} color="white" />
            </View>
            <Text className="font-headline font-bold text-3xl text-white text-center mb-2">
              Welcome to Discounty
            </Text>
            <Text className="font-body text-white/70 text-center text-base">
              How would you like to use the app?
            </Text>
          </View>

          {/* Role Cards */}
          <View className="flex-col gap-4">
            {/* Customer Card */}
            <AnimatedButton
              className={`bg-white/10 border-2 border-white/20 rounded-3xl p-6 flex-row items-center gap-5 ${isSettingRole ? 'opacity-50' : ''}`}
              onPress={handleSelectCustomer}
              disabled={isSettingRole}
            >
              <View className="w-14 h-14 rounded-2xl overflow-hidden items-center justify-center">
                <LinearGradient
                  colors={['#862045', '#a01840']}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name="local-offer" size={28} color="white" />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="font-headline font-bold text-xl text-white mb-1">
                  {isSettingRole ? 'Setting up...' : "I'm a Customer"}
                </Text>
                <Text className="font-body text-white/60 text-sm leading-5">
                  Browse deals, claim discounts, and rate providers.
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </AnimatedButton>

            {/* Provider Card */}
            <AnimatedButton
              className={`bg-white/10 border-2 border-white/20 rounded-3xl p-6 flex-row items-center gap-5 ${isSettingRole ? 'opacity-50' : ''}`}
              onPress={handleSelectProvider}
              disabled={isSettingRole}
            >
              <View className="w-14 h-14 rounded-2xl overflow-hidden items-center justify-center">
                <LinearGradient
                  colors={['#00694d', '#0f9d6e']}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialCommunityIcons name="store" size={28} color="white" />
                </LinearGradient>
              </View>
              <View className="flex-1">
                <Text className="font-headline font-bold text-xl text-white mb-1">
                  I'm a Business
                </Text>
                <Text className="font-body text-white/60 text-sm leading-5">
                  Post deals, manage customers, and grow your brand.
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </AnimatedButton>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="mt-4 bg-red-500/20 border-red-400/30 rounded-xl px-4 py-3">
              <Text className="text-error font-body text-sm text-center">{error}</Text>
            </View>
          ) : null}

          {/* Footer */}
          <View className="mt-8 pt-6 border-t border-white/20 items-center">
            <Text className="font-body text-white/40 text-xs text-center leading-5">
              You can always change your role later{'\n'}from your profile settings.
            </Text>
          </View>
        </GlassView>
      </ScrollView>
    </View>
  );
}
