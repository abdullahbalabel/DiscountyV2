const DAYS_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function to12h(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export interface BusinessHoursStatus {
  isOpen: boolean;
  /** e.g. "Closes at 10:00 PM" or "Opens at 9:00 AM" */
  nextChange: string;
}

export function getBusinessHoursStatus(
  businessHours: Record<string, unknown> | null | undefined,
  t: (key: string, opts?: Record<string, unknown>) => string,
): BusinessHoursStatus | null {
  if (!businessHours || Object.keys(businessHours).length === 0) return null;

  const now = new Date();
  const dayIndex = (now.getDay() + 6) % 7; // Monday=0 … Sunday=6
  const currentDay = DAYS_KEYS[dayIndex];
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const raw = businessHours[currentDay];
  if (typeof raw !== 'string' || raw === 'closed') {
    // Find next open day
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (dayIndex + i) % 7;
      const nextDay = DAYS_KEYS[nextIdx];
      const nextRaw = businessHours[nextDay];
      if (typeof nextRaw === 'string' && nextRaw !== 'closed' && nextRaw.includes('-')) {
        const [open] = nextRaw.split('-');
        return { isOpen: false, nextChange: `${t('provider.opensAt')} ${to12h(open)}` };
      }
    }
    return { isOpen: false, nextChange: '' };
  }

  const [open, close] = raw.split('-');
  const [oH, oM] = open.split(':').map(Number);
  const [cH, cM] = close.split(':').map(Number);
  const openMin = oH * 60 + oM;
  const closeMin = cH * 60 + cM;

  if (currentTime >= openMin && currentTime < closeMin) {
    return { isOpen: true, nextChange: `${t('provider.closesAt')} ${to12h(close)}` };
  }

  if (currentTime < openMin) {
    return { isOpen: false, nextChange: `${t('provider.opensAt')} ${to12h(open)}` };
  }

  // Past close today — find next open day
  for (let i = 1; i <= 7; i++) {
    const nextIdx = (dayIndex + i) % 7;
    const nextDay = DAYS_KEYS[nextIdx];
    const nextRaw = businessHours[nextDay];
    if (typeof nextRaw === 'string' && nextRaw !== 'closed' && nextRaw.includes('-')) {
      const [nextOpen] = nextRaw.split('-');
      return { isOpen: false, nextChange: `${t('provider.opensAt')} ${to12h(nextOpen)}` };
    }
  }

  return { isOpen: false, nextChange: '' };
}
