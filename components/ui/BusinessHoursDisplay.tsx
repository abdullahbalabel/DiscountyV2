import { I18nManager, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '../../hooks/use-theme-colors';

interface BusinessHoursDisplayProps {
  businessHours: Record<string, { open: string; close: string; closed: boolean }> | null;
}

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
const DAYS_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function BusinessHoursDisplay({ businessHours }: BusinessHoursDisplayProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const isRTL = I18nManager.isRTL;

  if (!businessHours || Object.keys(businessHours).length === 0) {
    return (
      <Text style={{ fontSize: 14, color: colors.onSurfaceVariant, textAlign: 'center', paddingVertical: 16 }}>
        —
      </Text>
    );
  }

  const todayIndex = (new Date().getDay() + 6) % 7; // Monday=0

  return (
    <View style={{ gap: 2 }}>
      {DAYS_KEYS.map((dayKey, index) => {
        const dayData = businessHours[dayKey];
        const isToday = index === todayIndex;
        const dayName = isRTL ? DAYS_AR[index] : DAYS_EN[index];

        return (
          <View
            key={dayKey}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderRadius: 8,
              backgroundColor: isToday ? `${colors.primary}14` : 'transparent',
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: isToday ? '700' : '500',
                color: isToday ? colors.primary : colors.onSurface,
                fontFamily: isToday ? 'Cairo_700Bold' : 'Cairo_600SemiBold',
              }}
            >
              {dayName}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: dayData?.closed ? colors.onSurfaceVariant : colors.onSurfaceVariant,
                fontWeight: isToday ? '600' : '400',
                fontFamily: 'Cairo',
              }}
            >
              {dayData?.closed
                ? t('provider.closed')
                : dayData
                  ? `${dayData.open} - ${dayData.close}`
                  : '—'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
