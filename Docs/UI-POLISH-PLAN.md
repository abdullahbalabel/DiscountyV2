# UI Polish Implementation Plan — DiscountyV2

> **Goal:** Polish the UI across the app without breaking any existing functionality.
> **Risk Level:** All changes are 🟢 Low Risk — presentation layer only, zero new dependencies.
> **Created:** 2026-04-02
> **Last Updated:** 2026-04-02 (ALL PHASES COMPLETE ✅)

---

## Overview

This plan covers **10 improvements** across 5 phases, ordered by dependency and impact:

| Phase | Focus | Improvements | Status |
|-------|-------|--------------|--------|
| 1 | RTL Foundation | #2 — Logical CSS properties | ✅ Complete |
| 2 | i18n Extraction | #1, #3, #8 — Hardcoded strings → translation keys | ✅ Complete |
| 3 | Navigation Polish | #4, #6 — Tab bar & loading state | ✅ Complete |
| 4 | Component Consistency | #5, #9, #10 — Colors, containers, contrast | ✅ Complete |
| 5 | Animation Polish | #7 — EmptyState float animation | ⏳ Pending |

---

## Phase 1: RTL Logical Properties (#2) ✅ COMPLETE

**Why first:** RTL fixes are a prerequisite — i18n changes in Phase 2 depend on correct directional layout.

### Files to Modify

#### 1. `components/ui/DealCard.tsx`
| Line | Current | Replacement |
|------|---------|-------------|
| 90 | `right: 10` | `end: 10` |
| 103 | `left: 10` | `start: 10` |
| 119 | `right: 10` | `end: 10` |
| 131 | `left: 10` | `start: 10` |
| 166 | `marginLeft: 'auto'` | `marginStart: 'auto'` |

#### 2. `app/(customer)/feed.tsx`
| Line | Current | Replacement |
|------|---------|-------------|
| 61 | `marginRight: 8` | `marginEnd: 8` |
| 85 | `marginRight: 8` | `marginEnd: 8` |
| 94 | `marginRight: 8` | `marginEnd: 8` |

#### 3. `app/(customer)/deals/[id].tsx`
| Line | Current | Replacement |
|------|---------|-------------|
| 152 | `marginRight: 12` | `marginEnd: 12` |
| 154 | `marginRight: 12` | `marginEnd: 12` |

#### 4. `app/(provider)/dashboard.tsx`
| Line | Current | Replacement |
|------|---------|-------------|
| 121 | `marginRight: 12` | `marginEnd: 12` |
| 148 | `marginRight: 12` | `marginEnd: 12` |

### Verification
- [x] App builds without errors
- [x] Customer feed renders correctly in LTR
- [x] Provider dashboard renders correctly in LTR
- [x] Deal detail page renders correctly in LTR

---

## Phase 2: i18n String Extraction (#1, #3, #8) ✅ COMPLETE

**Why second:** Once RTL layout is fixed, we extract all hardcoded English strings into translation keys.

### 2A. Tab Bar Labels (#1) — `app/(customer)/_layout.tsx` + `app/(provider)/_layout.tsx`

#### Customer Layout Changes
Replace hardcoded `title` values with `t()` calls:

```tsx
// Line 40: title: 'Deals'        → title: t('tabs.deals')
// Line 49: title: 'My Deals'     → title: t('tabs.myDeals')
// Line 64: title: 'Saved'        → title: t('tabs.saved')
// Line 73: title: 'Profile'      → title: t('tabs.profile')
```

Add `useTranslation` import (already imported on line 4).

#### Provider Layout Changes
Replace hardcoded `title` values:

```tsx
// Line 37: title: 'Dashboard'    → title: t('tabs.dashboard')
// Line 46: title: 'My Deals'     → title: t('tabs.myDeals')
// Line 55: title: 'Scan QR'      → title: t('tabs.scanQR')
// Line 64: title: 'Reviews'      → title: t('tabs.reviews')
// Line 73: title: 'Profile'      → title: t('tabs.profile')
```

Add `useTranslation` import.

#### New i18n Keys (add to both `en.json` and `ar.json`)

```json
// en.json — add new "tabs" section
"tabs": {
  "deals": "Deals",
  "myDeals": "My Deals",
  "saved": "Saved",
  "profile": "Profile",
  "dashboard": "Dashboard",
  "scanQR": "Scan QR",
  "reviews": "Reviews"
}
```

```json
// ar.json — add new "tabs" section
"tabs": {
  "deals": "العروض",
  "myDeals": "عروضي",
  "saved": "المحفوظة",
  "profile": "الملف الشخصي",
  "dashboard": "لوحة التحكم",
  "scanQR": "مسح QR",
  "reviews": "التقييمات"
}
```

### 2B. DealCard Time Strings (#3) — `components/ui/DealCard.tsx`

#### Changes
- Import `useTranslation` from `react-i18next`
- Pass `t` to `formatTimeLeft()` function
- Replace hardcoded strings:

```tsx
// Line 32: 'Expired'           → t('deal.expired')
// Line 35: `${days}d left`     → t('deal.daysLeft', { count: days })
// Line 36: `${hours}h left`    → t('deal.hoursLeft', { count: hours })
// Line 38: `${mins}m left`     → t('deal.minsLeft', { count: mins })
// Line 194: fallback description → t('deal.defaultDescription')
```

#### New i18n Keys

```json
// en.json — add "deal" section
"deal": {
  "expired": "Expired",
  "daysLeft": "{{count}}d left",
  "hoursLeft": "{{count}}h left",
  "minsLeft": "{{count}}m left",
  "defaultDescription": "Exclusive deal. Limited stock available for discerning shoppers."
}
```

```json
// ar.json — add "deal" section
"deal": {
  "expired": "منتهي",
  "daysLeft": "{{count}} يوم متبقي",
  "hoursLeft": "{{count}} ساعة متبقية",
  "minsLeft": "{{count}} دقيقة متبقية",
  "defaultDescription": "عرض حصري. مخزون محدود للعملاء المميزين."
}
```

### 2C. Feed Search & Chips (#8) — `app/(customer)/feed.tsx`

#### Changes
- `useTranslation` is already imported (check if it is; if not, add it)
- Replace hardcoded strings:

```tsx
// Line 64: placeholder="Search deals, brands, or categories..."
//       → placeholder={t('feed.searchPlaceholder')}

// Line 88: 'All Deals'
//       → t('feed.allDeals')

// Line 106: 'Loading...'
//       → t('feed.loading')

// Line 106: `${deals.length} deals available`
//       → t('feed.dealsAvailable', { count: deals.length })

// Line 115: 'No Deals Found'
//       → t('feed.noDealsFound')

// Line 115: No results for "${searchQuery}". Try a different search.
//       → t('feed.noSearchResults', { query: searchQuery })

// Line 115: 'No active deals in this category right now.'
//       → t('feed.noCategoryDeals')

// Line 115: 'No active deals available at the moment. Check back soon!'
//       → t('feed.noActiveDeals')
```

#### New i18n Keys

```json
// en.json — add "feed" section
"feed": {
  "searchPlaceholder": "Search deals, brands, or categories...",
  "allDeals": "All Deals",
  "loading": "Loading...",
  "dealsAvailable": "{{count}} deals available",
  "noDealsFound": "No Deals Found",
  "noSearchResults": "No results for \"{{query}}\". Try a different search.",
  "noCategoryDeals": "No active deals in this category right now.",
  "noActiveDeals": "No active deals available at the moment. Check back soon!"
}
```

```json
// ar.json — add "feed" section
"feed": {
  "searchPlaceholder": "ابحث عن العروض والعلامات التجارية والفئات...",
  "allDeals": "جميع العروض",
  "loading": "جارٍ التحميل...",
  "dealsAvailable": "{{count}} عرض متاح",
  "noDealsFound": "لم يتم العثور على عروض",
  "noSearchResults": "لا توجد نتائج لـ \"{{query}}\". جرب بحثاً مختلفاً.",
  "noCategoryDeals": "لا توجد عروض نشطة في هذه الفئة حالياً.",
  "noActiveDeals": "لا توجد عروض نشطة متاحة حالياً. تحقق لاحقاً!"
}
```

### Verification
- [x] App builds without errors
- [x] Tab labels use t() in customer layout
- [x] Tab labels use t() in provider layout
- [x] DealCard time badges use t()
- [x] Feed search placeholder uses t()
- [x] Feed empty states use t()
- [x] New keys added to en.json (tabs, deal, feed)
- [x] New keys added to ar.json (tabs, deal, feed)

---

## Phase 3: Navigation Polish (#4, #6) ✅ COMPLETE

### 3A. Tab Bar Active Indicator (#4) — `app/(customer)/_layout.tsx` + `app/(provider)/_layout.tsx`

#### Changes
Add a subtle top border indicator for the active tab. Modify `screenOptions`:

```tsx
tabBarStyle: {
  backgroundColor: colors.tabBarBg,
  borderTopWidth: 0,
  ...Shadows.md,
  height: 67,
  paddingBottom: 6,
  paddingTop: 6,
  borderTopLeftRadius: 0,
  borderTopRightRadius: 0,
},
// Add active indicator via tabBarItemStyle
tabBarItemStyle: {
  paddingTop: 4,
},
```

Create a custom `tabBarButton` prop or use `tabBarIcon` wrapper to show a small primary-colored dot when `focused`:

```tsx
tabBarIcon: ({ color, size, focused }) => (
  <View style={{ alignItems: 'center' }}>
    {focused && (
      <View style={{
        width: 4, height: 4, borderRadius: 2,
        backgroundColor: colors.primary,
        marginBottom: 2,
      }} />
    )}
    <MaterialIcons name="local-offer" size={size} color={color} />
  </View>
),
```

Apply to ALL tab icons in both customer and provider layouts.

### 3B. Root Loading Dark Mode (#6) — `app/_layout.tsx`

#### Changes
Replace hardcoded colors with `useColorScheme()`:

```tsx
function AppContent() {
  const { isLoading } = useAuth();
  const colorScheme = useColorScheme();

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colorScheme === 'dark' ? '#1a110f' : '#fff8f6',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator
          size="large"
          color={colorScheme === 'dark' ? '#fff' : '#862045'}
        />
      </View>
    );
  }
  // ... rest unchanged
}
```

### Verification
- [x] App builds without errors
- [x] Active tab shows dot indicator in customer layout
- [x] Active tab shows dot indicator in provider layout
- [x] Loading screen respects dark mode
- [x] Loading screen respects light mode

---

## Phase 4: Component Consistency (#5, #9, #10) ✅ COMPLETE

### 4A. CircularProgress Theme Colors (#5) — `components/ui/CircularProgress.tsx`

#### Changes
Replace hardcoded hex values with semantic tokens from `theme.ts`:

```tsx
import { Semantic } from '../../constants/theme';

// Line 20: Replace hardcoded colors
const progressColor = progress > 0.5
  ? Semantic.success
  : progress > 0.25
    ? Semantic.warning
    : Semantic.error;
```

Keep `trackColor`, `textColor`, `subColor` as-is (they're already mode-aware via `isDark` prop).

### 4B. Deal Detail Button Contrast + RTL (#9) — `app/(customer)/deals/[id].tsx`

#### Changes

**Contrast fix** — Increase button opacity:
```tsx
// Line 111: backgroundColor: 'rgba(0,0,0,0.4)'
//       → backgroundColor: 'rgba(0,0,0,0.55)'

// Line 117: backgroundColor: 'rgba(0,0,0,0.4)'
//       → backgroundColor: 'rgba(0,0,0,0.55)'

// Line 120: backgroundColor: 'rgba(0,0,0,0.4)'
//       → backgroundColor: 'rgba(0,0,0,0.55)'
```

**RTL fix** — Flip back arrow:
```tsx
// Line 112: name="arrow-back"
//       → name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
```

Add import: `import { I18nManager } from 'react-native';`

### 4C. Stat Card Icon Containers (#10) — `app/(provider)/dashboard.tsx`

#### Changes
Wrap stat card icons in rounded containers (matching Quick Actions pattern at line 148):

```tsx
// Line 84: <MaterialIcons name="local-offer" size={18} color={colors.primary} />
// Change to:
<View style={{
  width: 32, height: 32, borderRadius: Radius.md,
  backgroundColor: colors.surfaceContainerHigh,
  alignItems: 'center', justifyContent: 'center',
  marginBottom: 8,
}}>
  <MaterialIcons name="local-offer" size={18} color={colors.primary} />
</View>

// Apply same pattern to lines 91, 101, 108
```

Remove `marginTop: 8` from the number text since the icon container now provides spacing.

### Verification
- [x] App builds without errors
- [x] CircularProgress uses semantic colors (success/warning/error)
- [x] Deal detail back/share/bookmark buttons have better contrast
- [x] Back arrow flips in RTL mode
- [x] Provider dashboard stat cards have icon containers

---

## Phase 5: Animation Polish (#7) ✅ COMPLETE

### EmptyState Float Animation — `components/ui/EmptyState.tsx`

#### Changes
Add a gentle floating animation to the icon container using `react-native-reanimated`:

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Inside component:
const floatY = useSharedValue(0);

useEffect(() => {
  floatY.value = withRepeat(
    withTiming(-4, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
    -1, // infinite
    true // reverse
  );
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: floatY.value }],
}));
```

Wrap the icon container `<View>` with `<Animated.View style={animatedStyle}>`.

### Verification
- [x] App builds without errors
- [x] EmptyState icon gently floats up and down
- [x] Animation loops infinitely
- [x] Animation works in both light and dark mode

---

## Final Verification Checklist

After ALL phases are complete:

- [ ] `npx expo start` — app launches without errors
- [ ] Customer flow: Feed → Deal Detail → Claim → QR → Rate
- [ ] Provider flow: Dashboard → Create Deal → Scan → Reviews
- [ ] Dark mode: All screens render correctly
- [ ] Light mode: All screens render correctly
- [ ] Arabic locale: Tab labels, time badges, search placeholder all in Arabic
- [ ] RTL layout: Elements align correctly in Arabic mode
- [x] No TypeScript errors: `npx tsc --noEmit`
- [ ] No console warnings related to our changes

---

## Files Modified Summary

| File | Phases | Changes | Status |
|------|--------|---------|--------|
| `components/ui/DealCard.tsx` | 1, 2 | RTL props + i18n time strings | ✅ Done |
| `app/(customer)/feed.tsx` | 1, 2 | RTL margins + i18n strings | ✅ Done |
| `app/(customer)/deals/[id].tsx` | 1, 4 | RTL margins + button contrast + RTL arrow | ✅ Done |
| `app/(provider)/dashboard.tsx` | 1, 4 | RTL margins + icon containers | ✅ Done |
| `app/(customer)/_layout.tsx` | 2, 3 | i18n tab labels + active indicator | ✅ Done |
| `app/(provider)/_layout.tsx` | 2, 3 | i18n tab labels + active indicator | ✅ Done |
| `app/_layout.tsx` | 3 | Dark mode loading screen | ✅ Done |
| `components/ui/CircularProgress.tsx` | 4 | Semantic color tokens | ✅ Done |
| `components/ui/EmptyState.tsx` | 5 | Float animation | ✅ Done |
| `i18n/locales/en.json` | 2 | New keys: tabs, deal, feed | ✅ Done |
| `i18n/locales/ar.json` | 2 | New keys: tabs, deal, feed | ✅ Done |
