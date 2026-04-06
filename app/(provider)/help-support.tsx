import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { useRouter } from 'expo-router';

const FAQ_KEYS = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5'] as const;

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(t('auth.error'), t('provider.enterSubject'));
      return;
    }

    setIsSending(true);
    try {
      // Simulate sending - in production this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubject('');
      setMessage('');
      Alert.alert(t('provider.messageSent'));
    } catch {
      Alert.alert(t('provider.failedToSend'));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <View style={{
        width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceBg,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <MaterialIcons name={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'} size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>
          {t('provider.helpSupport')}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, gap: 20, paddingTop: 8 }}>
          {/* FAQ Section */}
          <AnimatedEntrance index={0} delay={50}>
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: 1.5,
              color: colors.onSurfaceVariant, marginBottom: 8, marginStart: 4,
            }}>
              {t('provider.helpFaq')}
            </Text>
            <View style={{
              backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl,
              borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden',
            }}>
              {FAQ_KEYS.map((key, idx) => {
                const isExpanded = expandedFaq === key;
                return (
                  <View key={key}>
                    <TouchableOpacity
                      onPress={() => setExpandedFaq(isExpanded ? null : key)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', padding: 14,
                        borderBottomWidth: idx !== FAQ_KEYS.length - 1 ? 1 : 0,
                        borderBottomColor: colors.surfaceContainer,
                      }}
                    >
                      <MaterialIcons name="help-outline" size={18} color={colors.primary} style={{ marginEnd: 10 }} />
                      <Text style={{ flex: 1, fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.onSurface }}>
                        {t(`provider.${key}Question`)}
                      </Text>
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={20}
                        color={colors.iconDefault}
                      />
                    </TouchableOpacity>
                    {isExpanded && (
                      <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4, backgroundColor: colors.surfaceContainerLow }}>
                        <Text style={{ fontFamily: 'Cairo', fontSize: 13, lineHeight: 20, color: colors.onSurfaceVariant }}>
                          {t(`provider.${key}Answer`)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </AnimatedEntrance>

          {/* Contact Form */}
          <AnimatedEntrance index={1} delay={100}>
            <Text style={{
              fontFamily: 'Cairo_700Bold', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: 1.5,
              color: colors.onSurfaceVariant, marginBottom: 8, marginStart: 4,
            }}>
              {t('provider.contactSupport')}
            </Text>
            <View style={{
              backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl,
              borderWidth: 1, borderColor: colors.outlineVariant, padding: 16, gap: 12,
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
                  value={subject}
                  onChangeText={setSubject}
                  placeholder={t('provider.enterSubject')}
                  placeholderTextColor={colors.iconDefault}
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
                  value={message}
                  onChangeText={setMessage}
                  placeholder={t('provider.enterMessage')}
                  placeholderTextColor={colors.iconDefault}
                  multiline
                />
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={isSending}
                style={{
                  backgroundColor: colors.primary, borderRadius: Radius.lg,
                  paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
                  justifyContent: 'center',
                }}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color={colors.onPrimary} />
                ) : (
                  <>
                    <MaterialIcons name="send" size={16} color={colors.onPrimary} style={{ marginEnd: 8 }} />
                    <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.onPrimary }}>
                      {t('provider.send')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </AnimatedEntrance>
        </View>
      </ScrollView>
    </View>
  );
}
