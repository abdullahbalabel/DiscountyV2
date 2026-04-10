import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { EmptyState } from '../../components/ui/EmptyState';
import { useNotifications } from '../../contexts/notifications';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { createNotification, sendLocalNotification } from '../../lib/notifications';
import { useAuth } from '../../contexts/auth';
import type { NotificationType } from '../../lib/notifications';

function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case 'deal_redeemed':
      return 'check-circle';
    case 'new_deal':
      return 'local-offer';
    case 'account_activity':
      return 'person';
    case 'deal_expiring':
      return 'schedule';
    case 'review_received':
      return 'star';
    default:
      return 'notifications';
  }
}

function getNotificationColor(type: NotificationType, colors: any): string {
  switch (type) {
    case 'deal_redeemed':
      return colors.success;
    case 'new_deal':
      return colors.primary;
    case 'account_activity':
      return colors.info;
    case 'deal_expiring':
      return colors.warning;
    case 'review_received':
      return colors.warning;
    default:
      return colors.iconDefault;
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { t } = useTranslation();
  const { session } = useAuth();
  const { notifications, unreadCount, isLoading, refreshNotifications, markAsRead, markAllAsRead, deleteAll } =
    useNotifications();

  const handleTestNotification = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const types: NotificationType[] = ['deal_redeemed', 'new_deal', 'account_activity'];
      const type = types[Math.floor(Math.random() * types.length)];
      const titles: Record<string, string> = {
        deal_redeemed: 'Deal Redeemed!',
        new_deal: 'New Deal Available!',
        account_activity: 'Account Activity',
      };
      const bodies: Record<string, string> = {
        deal_redeemed: 'Your deal "Summer Special" from Coffee Corner has been redeemed.',
        new_deal: 'Coffee Corner just posted "50% Off Latte". Check it out!',
        account_activity: 'Your profile was updated successfully.',
      };
      // Save to database
      await createNotification(session.user.id, type, titles[type], bodies[type], { type });
      // Show native notification on phone
      await sendLocalNotification(titles[type], bodies[type], { type });
      await refreshNotifications();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [session, refreshNotifications]);

  const handleRefresh = useCallback(async () => {
    await refreshNotifications();
  }, [refreshNotifications]);

  const handleNotificationPress = useCallback(
    async (notification: (typeof notifications)[0]) => {
      if (!notification.is_read) {
        await markAsRead(notification.id);
      }

      const data = notification.data;
      if (data?.type === 'new_deal' && data?.deal_id) {
        router.push({
          pathname: '/(customer)/deals/[id]',
          params: { id: data.deal_id as string },
        } as any);
      }
    },
    [markAsRead, router]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View
        style={{
          width: '100%',
          paddingHorizontal: 16,
          paddingTop: 48,
          paddingBottom: 12,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: colors.surfaceBg,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text
            style={{
              fontFamily: 'Cairo',
              fontWeight: '700',
              letterSpacing: -0.5,
              fontSize: 18,
              color: colors.onSurface,
              flexShrink: 1,
            }}
          >
            {t('notifications.title')}
          </Text>
          {unreadCount > 0 && (
            <View
              style={{
                backgroundColor: colors.primary,
                borderRadius: Radius.full,
                minWidth: 20,
                height: 20,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 6,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead}>
              <Text
                style={{
                  color: colors.primary,
                  fontFamily: 'Cairo',
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {t('notifications.markAllRead')}
              </Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  t('notifications.clearAll'),
                  t('notifications.clearAllConfirm'),
                  [
                    { text: t('auth.cancel'), style: 'cancel' },
                    { text: t('notifications.clearAll'), style: 'destructive', onPress: deleteAll },
                  ]
                )
              }
            >
              <Text
                style={{
                  color: '#E53935',
                  fontFamily: 'Cairo',
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {t('notifications.clearAll')}
              </Text>
            </TouchableOpacity>
          )}
          {unreadCount === 0 && (
            <TouchableOpacity
              onPress={handleTestNotification}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: Radius.md,
                backgroundColor: colors.surfaceContainerHigh,
              }}
            >
              <Text
                style={{
                  color: colors.onSurfaceVariant,
                  fontFamily: 'Cairo',
                  fontWeight: '600',
                  fontSize: 12,
                }}
              >
                Test
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && notifications.length === 0 ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : notifications.length === 0 ? (
          <View style={{ paddingTop: 48 }}>
            <EmptyState
              icon="notifications-none"
              title={t('notifications.empty')}
              message={t('notifications.emptyDesc')}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {notifications.map((notification, idx) => (
              <AnimatedEntrance key={notification.id} index={idx} delay={50}>
                <TouchableOpacity
                  onPress={() => handleNotificationPress(notification)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    padding: 14,
                    backgroundColor: notification.is_read
                      ? colors.surfaceContainerLowest
                      : colors.surfaceContainerLow,
                    borderRadius: Radius.lg,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: notification.is_read
                      ? colors.outlineVariant
                      : `${colors.primary}20`,
                  }}
                >
                  {/* Icon */}
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: Radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: `${getNotificationColor(notification.type, colors)}15`,
                      marginEnd: 12,
                    }}
                  >
                    <MaterialIcons
                      name={getNotificationIcon(notification.type) as any}
                      size={20}
                      color={getNotificationColor(notification.type, colors)}
                    />
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'Cairo',
                          fontWeight: '700',
                          fontSize: 14,
                          color: colors.onSurface,
                          flex: 1,
                          marginEnd: 8,
                        }}
                        numberOfLines={1}
                      >
                        {notification.title}
                      </Text>
                      {!notification.is_read && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.primary,
                            marginTop: 4,
                          }}
                        />
                      )}
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Cairo',
                        fontSize: 13,
                        color: colors.onSurfaceVariant,
                        lineHeight: 18,
                        marginBottom: 4,
                      }}
                      numberOfLines={2}
                    >
                      {notification.body}
                    </Text>
                    <Text
                      style={{
                        fontFamily: 'Cairo',
                        fontSize: 11,
                        color: colors.iconDefault,
                        fontWeight: '500',
                      }}
                    >
                      {timeAgo(notification.created_at)}
                    </Text>
                  </View>
                </TouchableOpacity>
              </AnimatedEntrance>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
