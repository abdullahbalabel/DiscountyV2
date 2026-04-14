import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { useThemeColors, Radius, TAB_BAR_OFFSET } from '../../hooks/use-theme-colors';
import { updatePrivacySettings, requestDataExport, requestAccountDeletion, fetchDataRequests, fetchOwnCustomerProfile } from '../../lib/api';
import type { CustomerProfile, DataRequest } from '../../lib/types';

export default function PrivacyDataScreen() {
  const colors = useThemeColors();
  const { t } = useTranslation();

  const [, setProfile] = useState<CustomerProfile | null>(null);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, requestsData] = await Promise.all([
          fetchOwnCustomerProfile(),
          fetchDataRequests(),
        ]);
        setProfile(profileData);
        setDataRequests(requestsData);
        if (profileData) {
          setLocationTracking(profileData.location_tracking_enabled);
          setMarketingEmails(profileData.marketing_emails_enabled);
        }
      } catch (err) {
        console.warn('[PrivacyData] Failed to load:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePrivacyToggle = async (
    field: 'location_tracking' | 'marketing_emails' | 'data_sharing',
    value: boolean,
    setter: (v: boolean) => void,
  ) => {
    setter(value);
    try {
      await updatePrivacySettings({ [field]: value });
    } catch (err: any) {
      setter(!value);
      Alert.alert(t('common.error'), err?.message || t('common.tryAgain'));
    }
  };

  const handleExportData = () => {
    Alert.alert(
      t('privacyData.confirmExport'),
      undefined,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacyData.exportData'),
          onPress: async () => {
            try {
              await requestDataExport();
              const updated = await fetchDataRequests();
              setDataRequests(updated);
              Alert.alert(t('common.ok'), t('privacyData.exportRequested'));
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || t('common.tryAgain'));
            }
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('privacyData.confirmDeleteTitle'),
      t('privacyData.deleteWarning'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('privacyData.confirmDelete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await requestAccountDeletion();
              const updated = await fetchDataRequests();
              setDataRequests(updated);
              Alert.alert(t('common.ok'), t('privacyData.deletionRequested'));
            } catch (err: any) {
              Alert.alert(t('common.error'), err?.message || t('common.tryAgain'));
            }
          },
        },
      ],
    );
  };

  const pendingRequests = dataRequests.filter(r => r.status === 'pending' || r.status === 'processing');

  const renderSection = (title: string, children: React.ReactNode, index: number) => (
    <AnimatedEntrance index={index} delay={100}>
      <Text style={{
        fontFamily: 'Cairo_700Bold',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: colors.onSurfaceVariant,
        marginBottom: 8,
        marginStart: 4,
      }}>{title}</Text>
      <View style={{
        backgroundColor: colors.surfaceContainerLowest,
        borderRadius: Radius.xl,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        marginBottom: 20,
      }}>
        {children}
      </View>
    </AnimatedEntrance>
  );

  const renderToggleRow = (
    icon: string,
    label: string,
    description: string,
    value: boolean,
    onToggle: (v: boolean) => void,
    isFirst: boolean,
    isLast: boolean,
  ) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.surfaceContainer,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginEnd: 14,
      }}>
        <MaterialIcons name={icon as any} size={20} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>{label}</Text>
        <Text style={{ fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
        thumbColor={colors.onPrimary}
      />
    </View>
  );

  const renderDataRow = (
    icon: string,
    label: string,
    description: string,
    isLast: boolean,
  ) => (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.surfaceContainer,
    }}>
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.surfaceContainerHigh,
        alignItems: 'center',
        justifyContent: 'center',
        marginEnd: 14,
      }}>
        <MaterialIcons name={icon as any} size={20} color={colors.onSurfaceVariant} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>{label}</Text>
        <Text style={{ fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>{description}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenWrapper style={{ alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: TAB_BAR_OFFSET }}>
        <View style={{ paddingHorizontal: 16, gap: 16, paddingTop: 56 }}>
          {/* Header */}
          <AnimatedEntrance index={0} delay={50}>
            <Text style={{ fontFamily: 'Cairo_800ExtraBold', fontSize: 24, color: colors.onSurface, letterSpacing: -0.5, marginBottom: 4 }}>
              {t('privacyData.title')}
            </Text>
          </AnimatedEntrance>

          {/* Pending Request Banners */}
          {pendingRequests.length > 0 && (
            <AnimatedEntrance index={0} delay={80}>
              {pendingRequests.map((req) => (
                <View key={req.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: Radius.lg,
                  backgroundColor: req.status === 'pending' ? colors.warningBg : `${colors.info}1a`,
                  marginBottom: 8,
                }}>
                  <MaterialIcons
                    name="info"
                    size={18}
                    color={req.status === 'pending' ? colors.warningText : colors.info}
                    style={{ marginEnd: 10 }}
                  />
                  <Text style={{
                    flex: 1,
                    fontFamily: 'Cairo_600SemiBold',
                    fontSize: 13,
                    color: req.status === 'pending' ? colors.warningText : colors.info,
                  }}>
                    {t('privacyData.pendingRequest', { type: t(`privacyData.${req.request_type}`) })}
                  </Text>
                </View>
              ))}
            </AnimatedEntrance>
          )}

          {/* Section 1: Notification Preferences */}
          {renderSection(t('privacyData.notifications'), (
            <>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 14,
                borderBottomWidth: 1,
                borderBottomColor: colors.surfaceContainer,
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.surfaceContainerHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: 14,
                }}>
                  <MaterialIcons name="campaign" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>
                    {t('privacyData.promotionalNotifications')}
                  </Text>
                </View>
                <Switch
                  value={marketingEmails}
                  onValueChange={(v) => handlePrivacyToggle('marketing_emails', v, setMarketingEmails)}
                  trackColor={{ false: colors.surfaceContainerHigh, true: colors.primary }}
                  thumbColor={colors.onPrimary}
                />
              </View>
            </>
          ), 1)}

          {/* Section 2: Location Settings */}
          {renderSection(t('privacyData.locationSettings'), (
            renderToggleRow(
              'my-location',
              t('privacyData.exactLocation'),
              t('privacyData.exactLocationDesc'),
              locationTracking,
              (v) => handlePrivacyToggle('location_tracking', v, setLocationTracking),
              true,
              true,
            )
          ), 2)}

          {/* Section 3: Data Transparency */}
          {renderSection(t('privacyData.dataTransparency'), (
            <>
              {renderDataRow('person', t('privacyData.profileInfo'), t('privacyData.profileInfoDesc'), false)}
              {renderDataRow('location-on', t('privacyData.locationData'), t('privacyData.locationDataDesc'), false)}
              {renderDataRow('history', t('privacyData.browsingHistory'), t('privacyData.browsingHistoryDesc'), false)}
              {renderDataRow('receipt', t('privacyData.redemptionHistory'), t('privacyData.redemptionHistoryDesc'), true)}
              <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center' }}>
                <MaterialIcons name="lock" size={14} color={colors.success} style={{ marginEnd: 8 }} />
                <Text style={{ flex: 1, fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant }}>
                  {t('privacyData.dataSecured')}
                </Text>
              </View>
            </>
          ), 3)}

          {/* Section 4: Data Management */}
          {renderSection(t('privacyData.dataManagement'), (
            <>
              <TouchableOpacity
                onPress={handleExportData}
                disabled={dataRequests.some(r => r.request_type === 'export' && r.status === 'pending')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.surfaceContainer,
                  opacity: dataRequests.some(r => r.request_type === 'export' && r.status === 'pending') ? 0.5 : 1,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primaryContainer,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: 14,
                }}>
                  <MaterialIcons name="download" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.onSurface }}>
                    {t('privacyData.exportData')}
                  </Text>
                  <Text style={{ fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                    {t('privacyData.exportDataDesc')}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.iconDefault} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.errorBgDark,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: 14,
                }}>
                  <MaterialIcons name="delete-forever" size={20} color={colors.error} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Cairo_600SemiBold', fontSize: 14, color: colors.error }}>
                    {t('privacyData.deleteAccount')}
                  </Text>
                  <Text style={{ fontFamily: 'Cairo', fontSize: 11, color: colors.onSurfaceVariant, marginTop: 2 }}>
                    {t('privacyData.deleteAccountDesc')}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.error} />
              </TouchableOpacity>
            </>
          ), 4)}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
