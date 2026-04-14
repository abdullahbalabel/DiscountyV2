import React, { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useThemeColors, Shadows, Radius } from '../../hooks/use-theme-colors';
import { FunPatternBackground } from './FunPatternBackground';

export interface TabConfig {
  name: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: number;
}

interface AnimatedTabBarProps {
  tabs: TabConfig[];
  fabTab?: TabConfig;
  state: any;
  descriptors: any;
  navigation: any;
}

export function AnimatedTabBar({ tabs, fabTab, state, descriptors, navigation }: AnimatedTabBarProps) {
  const colors = useThemeColors();

  // find focused visible tab name
  const focusedRoute = state.routes[state.index];
  const focusedOptions = focusedRoute ? descriptors[focusedRoute.key]?.options : undefined;
  const isHiddenFocused = focusedOptions?.href === null;

  // if focused route is hidden (e.g. deals/[id]), keep last visible tab active
  const focusedName = isHiddenFocused
    ? findLastVisibleTab(state, descriptors, tabs)
    : focusedRoute?.name;

  const handlePress = (routeName: string) => {
    const route = state.routes.find((r: any) => r.name === routeName);
    if (!route) return;

    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });
    if (event.defaultPrevented) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    navigation.navigate(route.name);
  };

  const bgColor = colors.isDark
    ? 'rgba(39, 29, 27, 0.92)'
    : 'rgba(255, 255, 255, 0.92)';
  const borderColor = colors.isDark
    ? 'rgba(255, 255, 255, 0.08)'
    : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { backgroundColor: bgColor, borderColor }]}>
        <View style={StyleSheet.absoluteFill}>
          <FunPatternBackground />
        </View>
        {tabs.slice(0, 2).map((tab) => (
          <TabItem
            key={tab.name}
            icon={tab.icon}
            title={tab.title}
            isFocused={focusedName === tab.name}
            colors={colors}
            badge={tab.badge}
            onPress={() => handlePress(tab.name)}
          />
        ))}
        {fabTab && <View style={{ width: styles.fab.width }} />}
        {tabs.slice(2).map((tab) => (
          <TabItem
            key={tab.name}
            icon={tab.icon}
            title={tab.title}
            isFocused={focusedName === tab.name}
            colors={colors}
            badge={tab.badge}
            onPress={() => handlePress(tab.name)}
          />
        ))}
      </View>

      {fabTab && (
        <View style={styles.fabWrapper}>
          <FAB
            icon={fabTab.icon}
            isFocused={focusedName === fabTab.name}
            colors={colors}
            onPress={() => handlePress(fabTab.name)}
          />
        </View>
      )}
    </View>
  );
}

/** When a hidden route is focused, find last visible tab name to keep highlighted */
function findLastVisibleTab(state: any, descriptors: any, tabs: TabConfig[]): string {
  // walk backwards from focused index to find a visible route that matches a tab
  for (let i = state.index - 1; i >= 0; i--) {
    const route = state.routes[i];
    const opts = descriptors[route.key]?.options;
    if (opts?.href !== null && tabs.some((t) => t.name === route.name)) {
      return route.name;
    }
  }
  return tabs[0]?.name ?? '';
}

/* ─── TabItem ──────────────────────────────────────────────── */

interface TabItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  isFocused: boolean;
  colors: any;
  badge?: number;
  onPress: () => void;
}

function TabItem({ icon, title, isFocused, colors, badge, onPress }: TabItemProps) {
  const scale = useSharedValue(isFocused ? 0.88 : 1.5);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(isFocused ? 0.88 : 1.5, {
      duration: 180,
      easing: Easing.bezierFn(0.4, 0, 0.2, 1),
    });
    labelOpacity.value = withTiming(isFocused ? 1 : 0, {
      duration: 180,
      easing: Easing.bezierFn(0.4, 0, 0.2, 1),
    });
  }, [isFocused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.Text
        style={[
          styles.label,
          {
            color: isFocused ? colors.primary : colors.tabBarInactive,
            position: 'absolute',
            top: 0,
          },
          labelStyle,
        ]}
        numberOfLines={1}
      >
        {title}
      </Animated.Text>
      <Animated.View style={[iconStyle, { justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialIcons
          name={icon}
          size={24}
          color={isFocused ? colors.primary : colors.tabBarInactive}
        />
        {badge != null && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: colors.onPrimary }]}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

/* ─── FAB ──────────────────────────────────────────────────── */

interface FABProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  isFocused: boolean;
  colors: any;
  onPress: () => void;
}

function FAB({ icon, isFocused, colors, onPress }: FABProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    rotation.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isFocused]);

  const handlePressIn = () => {
    scale.value = withTiming(0.88, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.fab,
          { backgroundColor: colors.primary, ...Shadows.glow },
          animatedStyle,
        ]}
      >
        <Animated.View style={iconStyle}>
          <MaterialIcons name={icon} size={26} color={colors.onPrimary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

/* ─── Styles ───────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 49 : 37,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    height: 60,
    borderRadius: Radius.xxl,
    borderWidth: 0.5,
    overflow: 'visible',
    ...Shadows.md,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: 2,
  },
  label: {
    fontFamily: 'Cairo',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Cairo',
    fontWeight: '700',
  },
  fabWrapper: {
    position: 'absolute',
    top: -(52 / 2) + 4,
    zIndex: 10,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
