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
  };

  const handleSelectProvider = () => {
    router.push('/(auth)/provider-signup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff8f6', position: 'relative' }}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop' }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
        contentFit="cover"
      />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, backgroundColor: 'rgba(0,0,0,0.6)' }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}>
        <GlassView
          intensity={colorScheme === 'dark' ? 30 : 50}
          style={{ width: '100%', maxWidth: 512, marginHorizontal: 24, borderRadius: 32, padding: 40, zIndex: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
        >
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <MaterialIcons name="person-add" size={32} color="white" />
            </View>
            <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 30, color: '#fff', textAlign: 'center', marginBottom: 8 }}>
              Welcome to Discounty
            </Text>
            <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontSize: 16 }}>
              How would you like to use the app?
            </Text>
          </View>

          {/* Role Cards */}
          <View style={{ gap: 16 }}>
            {/* Customer Card */}
            <AnimatedButton
              onPress={handleSelectCustomer}
              disabled={isSettingRole}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20,
                opacity: isSettingRole ? 0.5 : 1,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient
                  colors={['#862045', '#a01840']}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialIcons name="local-offer" size={28} color="white" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: '#fff', marginBottom: 4 }}>
                  {isSettingRole ? 'Setting up...' : "I'm a Customer"}
                </Text>
                <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20 }}>
                  Browse deals, claim discounts, and rate providers.
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </AnimatedButton>

            {/* Provider Card */}
            <AnimatedButton
              onPress={handleSelectProvider}
              disabled={isSettingRole}
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
                borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20,
                opacity: isSettingRole ? 0.5 : 1,
              }}
            >
              <View style={{ width: 56, height: 56, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient
                  colors={['#00694d', '#0f9d6e']}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MaterialCommunityIcons name="store" size={28} color="white" />
                </LinearGradient>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Epilogue', fontWeight: '700', fontSize: 20, color: '#fff', marginBottom: 4 }}>
                  I'm a Business
                </Text>
                <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20 }}>
                  Post deals, manage customers, and grow your brand.
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="rgba(255,255,255,0.5)" />
            </AnimatedButton>
          </View>

          {/* Error Message */}
          {error ? (
            <View style={{ marginTop: 16, backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.3)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Text style={{ color: '#ef4444', fontFamily: 'Manrope', fontSize: 14, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : null}

          {/* Footer */}
          <View style={{ marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Manrope', color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', lineHeight: 20 }}>
              You can always change your role later{'\n'}from your profile settings.
            </Text>
          </View>
        </GlassView>
      </ScrollView>
    </View>
  );
}
