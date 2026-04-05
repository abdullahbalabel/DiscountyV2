import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  registerForPushNotifications,
  savePushToken,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteAllNotifications,
  getUnreadNotificationCount,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  type AppNotification,
} from '../lib/notifications';
import { useAuth } from './auth';

interface NotificationsState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  refreshNotifications: async () => {},
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  deleteAll: async () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { session, role } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        fetchNotifications(),
        getUnreadNotificationCount(),
      ]);
      setNotifications(notifs);
      setUnreadCount(count);
    } catch (err) {
      console.error('Error refreshing notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to delete all notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (!session) return;

    let receivedSub: { remove: () => void } | undefined;
    let responseSub: { remove: () => void } | undefined;
    let cancelled = false;

    const setup = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token && !cancelled) {
          await savePushToken(token);
        }
      } catch (err) {
        console.error('Error setting up push notifications:', err);
      }

      if (cancelled) return;

      receivedSub = await addNotificationReceivedListener(() => {
        refreshNotifications();
      });

      responseSub = await addNotificationResponseListener((response: any) => {
        const data = response?.notification?.request?.content?.data;
        if (role === 'provider') {
          if (data?.type === 'deal_redeemed') {
            router.push('/(provider)/dashboard' as any);
          } else {
            router.push('/(provider)/dashboard' as any);
          }
        } else {
          if (data?.type === 'new_deal' && data?.deal_id) {
            router.push({
              pathname: '/(customer)/deals/[id]',
              params: { id: data.deal_id as string },
            } as any);
          } else {
            router.push('/(customer)/notifications' as any);
          }
        }
      });
    };

    setup();
    refreshNotifications();

    refreshIntervalRef.current = setInterval(() => {
      refreshNotifications();
    }, 30000);

    return () => {
      cancelled = true;
      receivedSub?.remove();
      responseSub?.remove();
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [session, role, refreshNotifications, router]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        deleteAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}
