import '../i18n'; // Initialize i18n
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../contexts/auth';
import { ThemeProvider as AppThemeProvider } from '../contexts/theme';
import { SavedDealsProvider } from '../contexts/savedDeals';
import { NotificationsProvider } from '../contexts/notifications';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
  Cairo_900Black,
} from '@expo-google-fonts/cairo';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? '#1a110f' : '#fff8f6',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator
          size="large"
          color={colorScheme === 'dark' ? '#fff' : '#862045'}
        />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(customer)" options={{ headerShown: false }} />
        <Stack.Screen name="(provider)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Cairo: Cairo_400Regular,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    Cairo_900Black,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <ThemeProvider value={DefaultTheme}>
          <AuthProvider>
            <NotificationsProvider>
              <SavedDealsProvider>
                <AppContent />
              </SavedDealsProvider>
            </NotificationsProvider>
          </AuthProvider>
        </ThemeProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  );
}
