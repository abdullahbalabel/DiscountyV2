import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';
import { useThemeColors, Radius } from '../../hooks/use-theme-colors';
import { fetchOwnProviderProfile, updateProviderProfile } from '../../lib/api';
import { useRouter } from 'expo-router';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}
TIME_OPTIONS.push('24:00');

type DayHours = { open: string; close: string; closed: boolean };

function parseDayHours(value: string | undefined): DayHours {
  if (!value || value === 'closed') return { open: '09:00', close: '22:00', closed: true };
  const [open, close] = value.split('-');
  return { open: open || '09:00', close: close || '22:00', closed: false };
}

export default function BusinessHoursScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hours, setHours] = useState<Record<string, DayHours>>({});
  const [activePicker, setActivePicker] = useState<{ day: string; field: 'open' | 'close' } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchOwnProviderProfile();
        if (data?.business_hours) {
          const parsed: Record<string, DayHours> = {};
          for (const day of DAYS) {
            parsed[day] = parseDayHours((data.business_hours as Record<string, string>)[day]);
          }
          setHours(parsed);
        } else {
          const defaultHours: Record<string, DayHours> = {};
          for (const day of DAYS) {
            defaultHours[day] = { open: '09:00', close: '22:00', closed: false };
          }
          setHours(defaultHours);
        }
      } catch {
        Alert.alert(t('auth.error'), t('auth.somethingWentWrong'));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [t]);

  const updateDay = (day: string, updates: Partial<DayHours>) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], ...updates } }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const businessHours: Record<string, string> = {};
      for (const day of DAYS) {
        const h = hours[day];
        businessHours[day] = h.closed ? 'closed' : `${h.open}-${h.close}`;
      }
      await updateProviderProfile({ business_hours: businessHours });
      Alert.alert(t('provider.saved'));
    } catch (err: any) {
      Alert.alert(t('provider.failedToSave'), err?.message || t('auth.somethingWentWrong'));
    } finally {
      setIsSaving(false);
    }
  };

  const applyToAll = (day: string) => {
    const source = hours[day];
    if (!source) return;
    const updated: Record<string, DayHours> = {};
    for (const d of DAYS) {
      updated[d] = { ...source };
    }
    setHours(updated);
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surfaceBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
        <Text style={{ fontFamily: 'Cairo', fontWeight: '700', letterSpacing: -0.5, fontSize: 18, color: colors.onSurface, flex: 1 }}>
          {t('provider.businessHoursTitle')}
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: colors.primary }}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 13, color: colors.onPrimary }}>{t('provider.saveChanges')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {DAYS.map((day, idx) => {
            const dayHours = hours[day];
            if (!dayHours) return null;

            return (
              <AnimatedEntrance key={day} index={idx} delay={50 + idx * 30}>
                <View style={{
                  backgroundColor: colors.surfaceContainerLowest,
                  borderRadius: Radius.xl,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  padding: 14,
                  marginBottom: 10,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: dayHours.closed ? 0 : 10 }}>
                    <Text style={{ fontFamily: 'Cairo', fontWeight: '700', fontSize: 14, color: colors.onSurface, textTransform: 'capitalize' }}>
                      {t(`provider.${day}`)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => applyToAll(day)}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.md, backgroundColor: colors.surfaceContainerHigh }}
                      >
                        <Text style={{ fontFamily: 'Cairo', fontWeight: '600', fontSize: 11, color: colors.onSurfaceVariant }}>{t('provider.everyDay')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => updateDay(day, { closed: !dayHours.closed })}
                        style={{
                          paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.md,
                          backgroundColor: dayHours.closed ? colors.errorBgDark : colors.successBg,
                        }}
                      >
                        <Text style={{
                          fontFamily: 'Cairo', fontWeight: '700', fontSize: 11,
                          color: dayHours.closed ? colors.error : colors.successText,
                        }}>
                          {dayHours.closed ? t('provider.closed') : t('provider.open')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {!dayHours.closed && (
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Cairo', fontWeight: '600', fontSize: 11, color: colors.onSurfaceVariant, marginStart: 4, marginBottom: 4 }}>
                          {t('provider.openTime')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setActivePicker(activePicker?.day === day && activePicker.field === 'open' ? null : { day, field: 'open' })}
                          style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.lg,
                            backgroundColor: colors.surfaceContainerHigh, borderWidth: 1,
                            borderColor: activePicker?.day === day && activePicker.field === 'open' ? colors.primary : colors.outlineVariant,
                          }}
                        >
                          <Text style={{ fontFamily: 'Cairo', fontWeight: '600', fontSize: 14, color: colors.onSurface }}>{dayHours.open}</Text>
                          <MaterialIcons name="access-time" size={16} color={colors.iconDefault} />
                        </TouchableOpacity>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: 'Cairo', fontWeight: '600', fontSize: 11, color: colors.onSurfaceVariant, marginStart: 4, marginBottom: 4 }}>
                          {t('provider.closeTime')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setActivePicker(activePicker?.day === day && activePicker.field === 'close' ? null : { day, field: 'close' })}
                          style={{
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.lg,
                            backgroundColor: colors.surfaceContainerHigh, borderWidth: 1,
                            borderColor: activePicker?.day === day && activePicker.field === 'close' ? colors.primary : colors.outlineVariant,
                          }}
                        >
                          <Text style={{ fontFamily: 'Cairo', fontWeight: '600', fontSize: 14, color: colors.onSurface }}>{dayHours.close}</Text>
                          <MaterialIcons name="access-time" size={16} color={colors.iconDefault} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {activePicker?.day === day && !dayHours.closed && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {TIME_OPTIONS.map((time) => (
                          <TouchableOpacity
                            key={time}
                            onPress={() => {
                              updateDay(day, { [activePicker.field]: time });
                              setActivePicker(null);
                            }}
                            style={{
                              paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md,
                              backgroundColor: dayHours[activePicker.field] === time ? colors.primary : colors.surfaceContainerHigh,
                            }}
                          >
                            <Text style={{
                              fontFamily: 'Cairo', fontWeight: '600', fontSize: 12,
                              color: dayHours[activePicker.field] === time ? colors.onPrimary : colors.onSurface,
                            }}>
                              {time}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  )}
                </View>
              </AnimatedEntrance>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
