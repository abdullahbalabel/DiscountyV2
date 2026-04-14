import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { HeaderBar } from '../../components/ui/HeaderBar';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useThemeColors, Radius, TAB_BAR_OFFSET } from '../../hooks/use-theme-colors';
import { useRouter } from 'expo-router';
import { broadcastPushToCustomers, checkProviderPushLimit } from '../../lib/api';
import type { PushLimitCheck } from '../../lib/api';

export default function BroadcastPushScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pushLimit, setPushLimit] = useState<PushLimitCheck | null>(null);
  const [loadingLimit, setLoadingLimit] = useState(true);

  useEffect(() => {
    loadPushLimit();
  }, []);

  const loadPushLimit = async () => {
    try {
      const limit = await checkProviderPushLimit();
      setPushLimit(limit);
    } catch {
    } finally {
      setLoadingLimit(false);
    }
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert(t('auth.error'), t('provider.enterSubject'));
      return;
    }

    if (pushLimit && !pushLimit.allowed) {
      Alert.alert(t('provider.pushLimitReached'));
      return;
    }

    setIsSending(true);
    try {
      await broadcastPushToCustomers(title.trim(), body.trim());
      setTitle('');
      setBody('');
      await loadPushLimit();
      Alert.alert(
        t('provider.messageSent'),
        t('provider.pushCounter', { used: (pushLimit?.sent_count || 0) + 1, max: pushLimit?.max_allowed || 0 })
      );
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  const isLocked = pushLimit?.max_allowed === 0;
  const isLimitReached = pushLimit && !pushLimit.allowed && !isLocked;

  return (
    <ScreenWrapper>
      <HeaderBar
        title={t('provider.sendPush')}
        onBack={() => router.back()}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: TAB_BAR_OFFSET }}>
        <View style={{ paddingHorizontal: 16, gap: 20, paddingTop: 8 }}>
          {/* Push Counter */}
          {loadingLimit ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : pushLimit ? (
            <AnimatedEntrance index={0} delay={50}>
              <View style={{
                backgroundColor: isLocked ? colors.surfaceContainerLowest : colors.surfaceContainerLowest,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: isLocked ? colors.outlineVariant : colors.outlineVariant,
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: Radius.lg,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isLocked ? colors.surfaceContainerHigh : `${colors.primary}15`,
                  marginEnd: 14,
                }}>
                  <MaterialIcons
                    name={isLocked ? 'lock' : 'notifications-active'}
                    size={22}
                    color={isLocked ? colors.iconDefault : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Cairo_700Bold', fontSize: 14,
                    color: colors.onSurface,
                  }}>
                    {t('provider.pushNotifications')}
                  </Text>
                  <Text style={{
                    fontFamily: 'Cairo', fontSize: 12,
                    color: colors.onSurfaceVariant, marginTop: 2,
                  }}>
                    {isLocked
                      ? t('provider.pushLocked')
                      : t('provider.pushCounter', { used: pushLimit.sent_count, max: pushLimit.max_allowed })
                    }
                  </Text>
                </View>
                {!isLocked && (
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md,
                    backgroundColor: isLimitReached ? `${colors.warning}15` : `${colors.primary}15`,
                  }}>
                    <Text style={{
                      fontFamily: 'Cairo_700Bold', fontSize: 12,
                      color: isLimitReached ? colors.warning : colors.primary,
                    }}>
                      {pushLimit.sent_count}/{pushLimit.max_allowed}
                    </Text>
                  </View>
                )}
              </View>
            </AnimatedEntrance>
          ) : null}

          {/* Locked CTA */}
          {isLocked && (
            <AnimatedEntrance index={1} delay={100}>
              <TouchableOpacity
                onPress={() => router.push('/(provider)/subscription')}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: Radius.lg,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <MaterialIcons name="upgrade" size={18} color={colors.onPrimary} />
                <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onPrimary }}>
                  {t('provider.upgradePlan')}
                </Text>
              </TouchableOpacity>
            </AnimatedEntrance>
          )}

          {/* Compose Form */}
          {!isLocked && (
            <AnimatedEntrance index={1} delay={100}>
              <Text style={{
                fontFamily: 'Cairo_700Bold', fontSize: 10,
                textTransform: 'uppercase', letterSpacing: 1.5,
                color: colors.onSurfaceVariant, marginBottom: 8, marginStart: 4,
              }}>
                {t('provider.contactSupport') ? t('provider.sendPush') : ''}
              </Text>
              <View style={{
                backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: colors.outlineVariant, padding: 16, gap: 12,
                opacity: isLimitReached ? 0.5 : 1,
              }}>
                <View>
                  <Text style={{
                    fontFamily: 'Cairo_700Bold', fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: 1.2,
                    color: colors.onSurfaceVariant, marginStart: 4, marginBottom: 6,
                  }}>
                    {t('provider.subject')}
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg,
                      backgroundColor: colors.surfaceContainerHigh, borderWidth: 1,
                      borderColor: colors.outlineVariant, color: colors.onSurface,
                      fontFamily: 'Cairo', fontSize: 14,
                    }}
                    value={title}
                    onChangeText={setTitle}
                    placeholder={t('provider.enterSubject')}
                    placeholderTextColor={colors.iconDefault}
                    editable={!isLimitReached}
                  />
                </View>
                <View>
                  <Text style={{
                    fontFamily: 'Cairo_700Bold', fontSize: 12,
                    textTransform: 'uppercase', letterSpacing: 1.2,
                    color: colors.onSurfaceVariant, marginStart: 4, marginBottom: 6,
                  }}>
                    {t('provider.message')}
                  </Text>
                  <TextInput
                    style={{
                      paddingHorizontal: 14, paddingVertical: 10, borderRadius: Radius.lg,
                      backgroundColor: colors.surfaceContainerHigh, borderWidth: 1,
                      borderColor: colors.outlineVariant, color: colors.onSurface,
                      fontFamily: 'Cairo', fontSize: 14, height: 100, textAlignVertical: 'top',
                    }}
                    value={body}
                    onChangeText={setBody}
                    placeholder={t('provider.enterMessage')}
                    placeholderTextColor={colors.iconDefault}
                    multiline
                    editable={!isLimitReached}
                  />
                </View>
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={isSending || isLimitReached || !title.trim() || !body.trim()}
                  style={{
                    backgroundColor: isLimitReached ? colors.surfaceContainerHigh : colors.primary,
                    borderRadius: Radius.lg,
                    paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={colors.onPrimary} />
                  ) : (
                    <>
                      <MaterialIcons name="send" size={16} color={isLimitReached ? colors.iconDefault : colors.onPrimary} style={{ marginEnd: 8 }} />
                      <Text style={{
                        fontFamily: 'Cairo_700Bold', fontSize: 14,
                        color: isLimitReached ? colors.iconDefault : colors.onPrimary,
                      }}>
                        {isLimitReached ? t('provider.pushLimitReached') : t('provider.sendPush')}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </AnimatedEntrance>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
