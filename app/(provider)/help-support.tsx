import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { GlassHeader } from '../../components/ui/GlassHeader';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { useRouter } from 'expo-router';
import { submitSupportTicketWithPriority, fetchProviderSupportTickets, fetchTicketMessages, sendTicketMessage, getProviderPlanFeatures } from '../../lib/api';
import type { SupportTicket, TicketMessage, PlanFeatures } from '../../lib/types';

const FAQ_KEYS = ['faq1', 'faq2', 'faq3', 'faq4', 'faq5'] as const;

export default function HelpSupportScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [ticketMessages, setTicketMessages] = useState<Record<string, TicketMessage[]>>({});
  const [followUpText, setFollowUpText] = useState('');
  const [sendingFollowUp, setSendingFollowUp] = useState<string | null>(null);
  const [planFeatures, setPlanFeatures] = useState<PlanFeatures | null>(null);

  useEffect(() => {
    fetchProviderSupportTickets().then(setTickets).catch(() => {});
    getProviderPlanFeatures().then(setPlanFeatures).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      Alert.alert(t('auth.error'), t('provider.enterSubject'));
      return;
    }

    setIsSending(true);
    try {
      await submitSupportTicketWithPriority(subject.trim(), message.trim());
      setSubject('');
      setMessage('');
      const updated = await fetchProviderSupportTickets();
      setTickets(updated);
      Alert.alert(t('provider.messageSent'));
    } catch (err: any) {
      Alert.alert(t('provider.failedToSend'), err?.message || 'Unknown error');
    } finally {
      setIsSending(false);
    }
  };

  const handleExpandTicket = async (ticketId: string) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null);
      return;
    }
    setExpandedTicket(ticketId);
    if (!ticketMessages[ticketId]) {
      try {
        const msgs = await fetchTicketMessages(ticketId);
        setTicketMessages((prev) => ({ ...prev, [ticketId]: msgs }));
      } catch {}
    }
  };

  const handleSendFollowUp = async (ticketId: string) => {
    if (!followUpText.trim()) return;
    setSendingFollowUp(ticketId);
    try {
      const msg = await sendTicketMessage(ticketId, followUpText.trim());
      setTicketMessages((prev) => ({
        ...prev,
        [ticketId]: [...(prev[ticketId] || []), msg],
      }));
      setFollowUpText('');
      const updated = await fetchProviderSupportTickets();
      setTickets(updated);
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message || 'Unknown error');
    } finally {
      setSendingFollowUp(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceBg }}>
      {/* Header */}
      <GlassHeader
        style={{
          width: '100%', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
          flexDirection: 'row', alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginEnd: 12 }}>
          <MaterialIcons name={I18nManager.isRTL ? 'chevron-right' : 'chevron-left'} size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Cairo_700Bold', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface }}>
          {t('provider.helpSupport')}
        </Text>
      </GlassHeader>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, gap: 20, paddingTop: 8 }}>
          {/* Priority Support Badge */}
          {planFeatures?.has_priority_support && (
            <AnimatedEntrance index={0} delay={30}>
              <View style={{
                backgroundColor: `${colors.success}12`,
                borderRadius: Radius.xl,
                borderWidth: 1,
                borderColor: `${colors.success}30`,
                padding: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <MaterialIcons name="verified" size={22} color={colors.success} style={{ marginEnd: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 14, color: colors.success }}>
                    {t('provider.prioritySupportBadge')}
                  </Text>
                  <Text style={{ fontFamily: 'Cairo', fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 }}>
                    {t('provider.prioritySupportHint')}
                  </Text>
                </View>
              </View>
            </AnimatedEntrance>
          )}

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

          {/* Ticket History */}
          {tickets.length > 0 && (
            <AnimatedEntrance index={2} delay={150}>
              <Text style={{
                fontFamily: 'Cairo_700Bold', fontSize: 10,
                textTransform: 'uppercase', letterSpacing: 1.5,
                color: colors.onSurfaceVariant, marginBottom: 8, marginStart: 4,
              }}>
                {t('provider.ticketHistory')}
              </Text>
              <View style={{
                backgroundColor: colors.surfaceContainerLowest, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: colors.outlineVariant, overflow: 'hidden',
              }}>
                {tickets.map((ticket, idx) => {
                  const isExpanded = expandedTicket === ticket.id;
                  const statusColor = ticket.status === 'open' ? '#b45309' : ticket.status === 'replied' ? '#16a34a' : '#85736f';
                  const statusIcon = ticket.status === 'open' ? 'hourglass-empty' : ticket.status === 'replied' ? 'check-circle' : 'lock';
                  const msgs = ticketMessages[ticket.id] || [];
                  return (
                    <View key={ticket.id}>
                      <TouchableOpacity
                        onPress={() => handleExpandTicket(ticket.id)}
                        style={{
                          flexDirection: 'row', alignItems: 'center', padding: 14,
                          borderBottomWidth: idx !== tickets.length - 1 ? 1 : 0,
                          borderBottomColor: colors.surfaceContainer,
                        }}
                      >
                        <MaterialIcons name={statusIcon as any} size={18} color={statusColor} style={{ marginEnd: 10 }} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 13, color: colors.onSurface }} numberOfLines={1}>
                              {ticket.subject}
                            </Text>
                            {ticket.is_priority && (
                              <MaterialIcons name="verified" size={14} color={colors.success} />
                            )}
                          </View>
                          <Text style={{ fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{
                          paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.sm,
                          backgroundColor: statusColor + '18', marginEnd: 8,
                        }}>
                          <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 10, color: statusColor }}>
                            {t(`provider.ticketStatus.${ticket.status}`)}
                          </Text>
                        </View>
                        <MaterialIcons
                          name={isExpanded ? 'expand-less' : 'expand-more'}
                          size={20}
                          color={colors.iconDefault}
                        />
                      </TouchableOpacity>
                      {isExpanded && (
                        <View style={{ paddingHorizontal: 14, paddingBottom: 14, paddingTop: 4, backgroundColor: colors.surfaceContainerLow }}>
                          {/* Original message */}
                          <View style={{ marginBottom: msgs.length > 0 ? 8 : 0 }}>
                            <Text style={{ fontFamily: 'Cairo_700Bold', fontSize: 11, color: colors.onSurfaceVariant, marginBottom: 4 }}>
                              {t('provider.you')}
                            </Text>
                            <Text style={{ fontFamily: 'Cairo', fontSize: 13, lineHeight: 20, color: colors.onSurface }}>
                              {ticket.message}
                            </Text>
                          </View>

                          {/* Conversation messages */}
                          {msgs.map((msg) => (
                            <View
                              key={msg.id}
                              style={{
                                marginTop: 8, padding: 10, borderRadius: Radius.md,
                                backgroundColor: msg.sender_role === 'admin' ? colors.surfaceContainerHigh : 'transparent',
                                borderStartWidth: msg.sender_role === 'admin' ? 3 : 0,
                                borderStartColor: '#16a34a',
                              }}
                            >
                              <Text style={{
                                fontFamily: 'Cairo_700Bold', fontSize: 11,
                                color: msg.sender_role === 'admin' ? '#16a34a' : colors.primary,
                                marginBottom: 4,
                              }}>
                                {msg.sender_role === 'admin' ? t('provider.adminReply') : t('provider.you')}
                              </Text>
                              <Text style={{ fontFamily: 'Cairo', fontSize: 13, lineHeight: 20, color: colors.onSurface }}>
                                {msg.message}
                              </Text>
                              <Text style={{ fontFamily: 'Cairo', fontSize: 10, color: colors.onSurfaceVariant, marginTop: 4 }}>
                                {new Date(msg.created_at).toLocaleString()}
                              </Text>
                            </View>
                          ))}

                          {/* Follow-up input (only for open/replied tickets) */}
                          {ticket.status !== 'closed' && (
                            <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
                              <TextInput
                                style={{
                                  flex: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.md,
                                  backgroundColor: colors.surfaceContainerHigh, borderWidth: 1,
                                  borderColor: colors.outlineVariant, color: colors.onSurface,
                                  fontFamily: 'Cairo', fontSize: 13, maxHeight: 80,
                                }}
                                value={followUpText}
                                onChangeText={setFollowUpText}
                                placeholder={t('provider.typeReply')}
                                placeholderTextColor={colors.iconDefault}
                                multiline
                              />
                              <TouchableOpacity
                                onPress={() => handleSendFollowUp(ticket.id)}
                                disabled={!followUpText.trim() || sendingFollowUp === ticket.id}
                                style={{
                                  width: 36, height: 36, borderRadius: Radius.md,
                                  backgroundColor: followUpText.trim() ? colors.primary : colors.surfaceContainerHigh,
                                  alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                {sendingFollowUp === ticket.id ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <MaterialIcons name="send" size={16} color={followUpText.trim() ? '#fff' : colors.iconDefault} />
                                )}
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </AnimatedEntrance>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
