import { GoogleSignin } from '@react-native-google-signin/google-signin';

export function configureGoogleSignin() {
  // Temporarily disabled — missing iosUrlScheme in options
  // GoogleSignin.configure({
  //   webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  //   offlineAccess: true,
  // });
}
