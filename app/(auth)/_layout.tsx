import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { Appearance } from 'react-native';

export default function AuthLayout() {
  useEffect(() => {
    Appearance.setColorScheme('light');
    return () => {
      Appearance.setColorScheme(null);
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="provider-signup" />
      <Stack.Screen name="pending-approval" />
      <Stack.Screen name="account-suspended" />
    </Stack>
  );
}
