import { Link, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-colors';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <>
      <Stack.Screen options={{ title: t('notFound.title') }} />
      <ThemedView style={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="error-outline" size={64} color={colors.tabBarInactive} />
        </View>
        <ThemedText type="title">{t('notFound.pageTitle')}</ThemedText>
        <ThemedText style={styles.description}>
          {t('notFound.description')}
        </ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">{t('notFound.goHome')}</ThemedText>
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
