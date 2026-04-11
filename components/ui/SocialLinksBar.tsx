import { MaterialIcons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { Pressable, View } from 'react-native';
import { useThemeColors } from '../../hooks/use-theme-colors';
import type { SocialLinks } from '../../lib/types';

interface SocialLinksBarProps {
  links: SocialLinks | null;
}

const PLATFORMS: { key: keyof SocialLinks; icon: keyof typeof MaterialIcons.glyphMap; urlPrefix: string }[] = [
  { key: 'instagram', icon: 'camera-alt', urlPrefix: 'https://instagram.com/' },
  { key: 'facebook', icon: 'facebook', urlPrefix: 'https://facebook.com/' },
  { key: 'tiktok', icon: 'music-note', urlPrefix: 'https://tiktok.com/@' },
  { key: 'x', icon: 'close', urlPrefix: 'https://x.com/' },
  { key: 'snapchat', icon: 'chat-bubble', urlPrefix: 'https://snapchat.com/add/' },
];

function buildUrl(value: string, prefix: string): string {
  if (value.startsWith('http://') || value.startsWith('https://')) return value;
  // Strip leading @ for prefixing platforms that already include it
  const handle = value.startsWith('@') ? value.slice(1) : value;
  return `${prefix}${handle}`;
}

export function SocialLinksBar({ links }: SocialLinksBarProps) {
  const colors = useThemeColors();

  if (!links) return null;

  const activePlatforms = PLATFORMS.filter((p) => links[p.key]);

  if (activePlatforms.length === 0) return null;

  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      {activePlatforms.map(({ key, icon, urlPrefix }) => (
        <Pressable
          key={key}
          onPress={() => {
            const url = buildUrl(links[key]!, urlPrefix);
            Linking.openURL(url);
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surfaceContainerHigh,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcons name={icon} size={20} color={colors.onSurfaceVariant} />
        </Pressable>
      ))}
    </View>
  );
}
