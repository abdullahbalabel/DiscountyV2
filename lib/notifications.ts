// ============================================
// Discounty Native Push Notification Service
// ============================================

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase, supabaseUrl } from './supabase';

// ── Types ──────────────────────────────────────

export type NotificationType =
  | 'deal_redeemed'
  | 'new_deal'
  | 'account_activity'
  | 'deal_expiring'
  | 'review_received'
  | 'admin_broadcast'
  | 'admin_message';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// ── Lazy Load expo-notifications (native only) ─

let Notifications: any = null;
let Device: any = null;
let moduleLoaded = false;

function isExpoGo(): boolean {
  // StoreClient = Expo Go app
  // Bare/Standalone = dev build or production build
  return Constants?.executionEnvironment === 'storeClient';
}

async function loadNotificationsModule() {
  if (Platform.OS === 'web') return null;
  if (moduleLoaded) return Notifications;

  // Skip loading in Expo Go - push notifications not supported
  if (isExpoGo()) {
    console.info('[Notifications] Skipping native module in Expo Go');
    moduleLoaded = true;
    return null;
  }

  try {
    const [notifMod, deviceMod] = await Promise.all([
      import('expo-notifications'),
      import('expo-device'),
    ]);
    Notifications = notifMod;
    Device = deviceMod;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    moduleLoaded = true;
    console.info('[Notifications] Native module loaded successfully');
    return Notifications;
  } catch (e) {
    console.warn('expo-notifications not available:', e);
    moduleLoaded = true;
    return null;
  }
}

// ── Register for Push Notifications ────────────

export async function registerForPushNotifications(): Promise<string | null> {
  const notif = await loadNotificationsModule();
  if (!notif || !Device) {
    console.warn('Push notifications not available on this platform');
    return null;
  }

  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await notif.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await notif.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get project ID from Expo config (EAS project ID or app slug)
  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) {
    console.warn(
      'No Expo projectId found. Push notifications require EAS project ID. ' +
      'Run `eas init` to create one, then add it to app.json under extra.eas.projectId'
    );
    return null;
  }

  try {
    const token = await notif.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error: any) {
    // Expo Go doesn't support push notifications in SDK 53+
    if (error?.message?.includes('Expo Go') || error?.message?.includes('development build')) {
      console.info('Push notifications require a development build (not Expo Go)');
      return null;
    }
    console.error('Failed to get push token:', error);
    return null;
  }
}

// ── Save Push Token to Database ────────────────

export async function savePushToken(token: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('push_tokens')
    .upsert(
      {
        user_id: user.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    );

  if (error) {
    console.error('Failed to save push token:', error);
    throw error;
  }
}

// ── Fetch User Notifications ───────────────────

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }

  return (data || []) as AppNotification[];
}

// ── Mark Notification as Read ──────────────────

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.warn('Cannot mark notification as read: not authenticated');
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

// ── Mark All Notifications as Read ─────────────

export async function markAllNotificationsAsRead(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.warn('Cannot mark all notifications as read: not authenticated');
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', session.user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

// ── Delete All Notifications ───────────────────

export async function deleteAllNotifications(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.warn('Cannot delete notifications: not authenticated');
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', session.user.id);

  if (error) {
    console.error('Failed to delete all notifications:', error);
    throw error;
  }
}

// ── Get Unread Count ───────────────────────────

export async function getUnreadNotificationCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error) return 0;
  return count || 0;
}

// ── Send Local Notification (native only) ─────

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const notif = await loadNotificationsModule();
  if (!notif) return;

  await notif.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
    },
    trigger: null,
  });
}

// ── Notification Listener Setup ────────────────

export async function addNotificationReceivedListener(
  callback: (notification: any) => void
): Promise<{ remove: () => void }> {
  const notif = await loadNotificationsModule();
  if (!notif) return { remove: () => {} };
  return notif.addNotificationReceivedListener(callback);
}

export async function addNotificationResponseListener(
  callback: (response: any) => void
): Promise<{ remove: () => void }> {
  const notif = await loadNotificationsModule();
  if (!notif) return { remove: () => {} };
  return notif.addNotificationResponseReceivedListener(callback);
}

// ── Send Push Notification via Edge Function ──

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('No session for push notification');
      return;
    }

    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          title,
          body,
          data: data || {},
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Push notification request failed:', response.status, errorText);
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

// ── Create Notification in DB ──────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      body,
      data: data || {},
      is_read: false,
    });

  if (error) {
    console.error('Failed to create notification:', error);
  }
}

// ── Send Deal Redeemed Notification ────────────

export async function notifyDealRedeemed(
  customerUserId: string,
  dealTitle: string,
  providerName: string
): Promise<void> {
  await createNotification(
    customerUserId,
    'deal_redeemed',
    'Deal Redeemed!',
    `Your deal "${dealTitle}" from ${providerName} has been successfully redeemed.`,
    { type: 'deal_redeemed' }
  );
}

// ── Send New Deal Notification ─────────────────

export async function notifyNewDeal(
  customerUserId: string,
  dealTitle: string,
  providerName: string,
  dealId: string
): Promise<void> {
  await createNotification(
    customerUserId,
    'new_deal',
    'New Deal Available!',
    `${providerName} just posted "${dealTitle}". Check it out!`,
    { type: 'new_deal', deal_id: dealId }
  );
}

// ── Send Account Activity Notification ─────────

export async function notifyAccountActivity(
  userId: string,
  activity: string
): Promise<void> {
  await createNotification(
    userId,
    'account_activity',
    'Account Activity',
    activity,
    { type: 'account_activity' }
  );
}

// ── Send Provider Deal Redeemed Notification ──

export async function notifyProviderDealRedeemed(
  providerUserId: string,
  dealTitle: string,
  dealId: string
): Promise<void> {
  await createNotification(
    providerUserId,
    'deal_redeemed',
    'Deal Redeemed!',
    `Your deal "${dealTitle}" has been redeemed by a customer.`,
    { type: 'deal_redeemed', deal_id: dealId }
  );
}
