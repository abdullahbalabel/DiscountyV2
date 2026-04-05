/**
 * Maps icon names from other icon families (e.g., Ionicons) to valid MaterialIcons names.
 * Use this when icon names come from a database or external source that may use different naming conventions.
 */

import { MaterialIcons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/**
 * Mapping of common non-Material icon names to their MaterialIcons equivalents.
 */
const ICON_MAP: Record<string, MaterialIconName> = {
  // Cafe / Coffee
  'cafe': 'local-cafe',
  'cafe-outline': 'local-cafe',
  'coffee': 'local-cafe',
  'coffee-outline': 'local-cafe',

  // Game Controller / Entertainment
  'game-controller': 'sports-esports',
  'game-controller-outline': 'sports-esports',
  'gamepad': 'sports-esports',
  'gamepad-outline': 'sports-esports',

  // Fitness / Health / Exercise
  'fitness': 'fitness-center',
  'fitness-outline': 'fitness-center',
  'barbell': 'fitness-center',
  'barbell-outline': 'fitness-center',
  'dumbbell': 'fitness-center',

  // Construction / Tools / Build
  'construct': 'build',
  'construct-outline': 'build',
  'hammer': 'build',
  'hammer-outline': 'build',
  'tools': 'build',
  'tools-outline': 'build',
  'wrench': 'build',
  'wrench-outline': 'build',

  // Airplane / Travel / Flight
  'airplane': 'flight',
  'airplane-outline': 'flight',
  'plane': 'flight',
  'plane-outline': 'flight',
  'travel': 'flight',
  'travel-outline': 'flight',

  // Shopping
  'cart': 'shopping-cart',
  'bag': 'shopping-bag',

  // Restaurant / Food
  'restaurant': 'restaurant',
  'fast-food': 'fastfood',
  'food': 'restaurant',

  // Beauty / Spa
  'beauty': 'spa',

  // People / Users
  'user': 'person',
  'users': 'people',

  // Home
  'home-outline': 'home',
  'house': 'home',

  // Heart / Favorite
  'heart': 'favorite',
  'heart-outline': 'favorite-border',

  // Notifications
  'bell': 'notifications',
  'bell-outline': 'notifications-none',

  // Settings
  'cog': 'settings',
  'gear': 'settings',

  // Mail / Email
  'mail': 'email',
  'envelope': 'email',

  // Camera
  'camera': 'camera-alt',

  // Location
  'pin': 'place',
  'map-pin': 'place',
  'navigate': 'navigation',

  // Calendar / Time
  'calendar': 'event',
  'clock': 'access-time',

  // Money / Payment
  'cash': 'payments',
  'card': 'credit-card',
  'wallet': 'account-balance-wallet',

  // Download / Upload
  'download': 'file-download',
  'upload': 'file-upload',

  // Edit / Delete
  'create': 'edit',
  'pencil': 'edit',
  'trash': 'delete',

  // QR Code
  'qr-code': 'qr-code',
  'scan': 'qr-code-scanner',

  // Offer / Tag
  'pricetag': 'local-offer',
  'tag': 'local-offer',
  'ticket': 'confirmation-number',

  // Store / Business
  'storefront': 'store',
  'business': 'business',

  // Misc common mappings
  'information': 'info',
  'information-circle': 'info',
  'information-circle-outline': 'info',
  'alert': 'error',
  'alert-circle': 'error',
  'alert-circle-outline': 'error',
  'bookmark-outline': 'bookmark-border',
  'globe': 'public',
  'globe-outline': 'public',
  'flash': 'bolt',
  'flash-outline': 'bolt',
  'zap': 'bolt',
  'zap-outline': 'bolt',
  'sunny': 'light-mode',
  'sunny-outline': 'light-mode',
  'moon': 'dark-mode',
  'moon-outline': 'dark-mode',
  'funnel': 'filter-list',
  'funnel-outline': 'filter-list',
  'gift': 'card-giftcard',
  'gift-outline': 'card-giftcard',
  'trophy': 'emoji-events',
  'trophy-outline': 'emoji-events',
  'flame': 'local-fire-department',
  'flame-outline': 'local-fire-department',
  'car': 'directions-car',
  'car-outline': 'directions-car',
  'car-sport': 'directions-car',
  'car-sport-outline': 'directions-car',
  'medical': 'medical-services',
  'medical-outline': 'medical-services',
  'shirt': 'checkroom',
  'shirt-outline': 'checkroom',
  'bed': 'bed',
  'bed-outline': 'bed',
  'paw': 'pets',
  'paw-outline': 'pets',
  'leaf': 'eco',
  'leaf-outline': 'eco',
  'diamond': 'diamond',
  'diamond-outline': 'diamond',
  'glasses': 'visibility',
  'glasses-outline': 'visibility',
  'color-palette': 'palette',
  'color-palette-outline': 'palette',
  'cut': 'content-cut',
  'cut-outline': 'content-cut',
  'brush': 'brush',
  'brush-outline': 'brush',
  'musical-notes': 'music-note',
  'musical-notes-outline': 'music-note',
  'musical-note': 'music-note',
  'phone-portrait': 'phone-iphone',
  'phone-portrait-outline': 'phone-iphone',
  'laptop': 'laptop',
  'laptop-outline': 'laptop',
  'tv': 'tv',
  'tv-outline': 'tv',
  'flower': 'local-florist',
  'flower-outline': 'local-florist',
};

/**
 * Resolves an icon name to a valid MaterialIcons name.
 * If the icon name is already a valid MaterialIcons name, it returns it as-is.
 * Otherwise, it attempts to map it from a known alternative icon family name.
 *
 * @param iconName - The icon name to resolve
 * @returns A valid MaterialIcons icon name
 */
export function resolveMaterialIcon(iconName: string | undefined | null): MaterialIconName {
  if (!iconName) {
    return 'category';
  }

  // Check if it's in our mapping
  if (ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }

  // Return as-is (assumes it's already a valid MaterialIcons name)
  return iconName as MaterialIconName;
}

/**
 * Default/fallback icon for categories when no valid icon is found.
 */
export const DEFAULT_CATEGORY_ICON: MaterialIconName = 'category';

export default resolveMaterialIcon;
