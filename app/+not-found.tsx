import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="error-outline" size={64} color="#85736f" />
        </View>
        <ThemedText type="title">Page Not Found</ThemedText>
        <ThemedText style={styles.description}>
          The page you're looking for doesn't exist or has been moved.
        </ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to Home Screen</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 16,
  },
  description: {
    marginTop: 8,
    marginBottom: 24,
    textAlign: 'center',
    opacity: 0.7,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
