# Feature Specification: Provider Profile Sub-Pages

## 1. Overview & Objectives
- **Goal:** Implement the 5 placeholder buttons in the provider profile page: Business Information, Business Hours, Social Media Links, Help & Support, and a new Settings page (gear icon).
- **Scope:**
  - Full CRUD for business information (name, description, phone, website, logo, cover photo)
  - Full CRUD for business hours (Mon-Sun time ranges)
  - Full CRUD for social media links (Instagram, Facebook, TikTok, X, Snapchat)
  - Static FAQ list + contact support form
  - Settings page (theme toggle, language toggle)
  - Navigation wiring from profile menu items
  - API function `updateProviderProfile()` in `lib/api.ts`
  - i18n translations for all new UI strings

## 2. User Stories & Workflows

### Business Information
- As a provider, I want to edit my business name, description, phone, and website so customers see accurate info.
- As a provider, I want to upload/change my logo and cover photo.

**Flow:** Profile -> Business Information -> Edit fields -> Save -> Returns to profile.

### Business Hours
- As a provider, I want to set opening/closing hours for each day of the week.

**Flow:** Profile -> Business Hours -> Tap day -> Pick open/close times -> Save.

### Social Media Links
- As a provider, I want to add/edit my social media links so customers can find me on social platforms.

**Flow:** Profile -> Social Media Links -> Enter URLs -> Save.

### Help & Support
- As a provider, I want to read FAQs and send a support message to the admin.

**Flow:** Profile -> Help & Support -> Browse FAQ / Fill contact form -> Send.

### Settings
- As a provider, I want to toggle dark/light mode and change language from the gear icon.

**Flow:** Profile -> Gear icon -> Toggle theme/language.

## 3. Technical Implementation

### 3.1 API Changes (`lib/api.ts`)
Add `updateProviderProfile()` function:
```typescript
export async function updateProviderProfile(updates: {
  business_name?: string;
  description?: string | null;
  phone?: string | null;
  website?: string | null;
  logo_url?: string | null;
  cover_photo_url?: string | null;
  social_links?: SocialLinks | null;
  business_hours?: Record<string, string> | null;
}): Promise<ProviderProfile>
```

Add `uploadProviderImage()` for logo/cover uploads (reuse `provider-assets` bucket).

### 3.2 New Pages

| Page | File Path | Key Features |
|------|-----------|--------------|
| Business Information | `app/(provider)/business-information.tsx` | Editable fields: name, description, phone, website. Logo & cover photo upload. Save button. |
| Business Hours | `app/(provider)/business-hours.tsx` | 7-day list with open/close time pickers. Closed toggle per day. |
| Social Media Links | `app/(provider)/social-media-links.tsx` | 5 input fields (Instagram, Facebook, TikTok, X, Snapchat) with icons. |
| Help & Support | `app/(provider)/help-support.tsx` | Static FAQ accordion + contact form (subject, message, submit). |
| Settings | `app/(provider)/settings.tsx` | Theme toggle (light/dark), Language toggle (ar/en). |

### 3.3 Navigation Wiring (`app/(provider)/profile.tsx`)
- Add `onPress` to each menu item → `router.push('/(provider)/business-information')` etc.
- Add `onPress` to gear icon → `router.push('/(provider)/settings')`.
- Add new pages as hidden tabs in `app/(provider)/_layout.tsx`.

### 3.4 i18n Keys to Add
New keys in `en.json` and `ar.json` under `provider`:
- `businessInfo`, `editBusinessInfo`, `businessName`, `description`, `phone`, `website`, `logo`, `coverPhoto`, `save`, `saved`, `businessHoursTitle`, `open`, `closed`, `openTime`, `closeTime`, `socialMediaTitle`, `helpFaq`, `contactSupport`, `subject`, `message`, `send`, `messageSent`, `settingsTitle`, `theme`, `language`, `lightMode`, `darkMode`.

### 3.5 Patterns to Follow
- Use `useThemeColors()` for all colors
- Use `AnimatedEntrance` for staggered animations
- Use `TouchableOpacity` with consistent padding/borderRadius from existing pages
- Use `MaterialIcons` for all icons
- RTL support via `I18nManager.isRTL` on chevrons
- Loading states with `ActivityIndicator`
- Follow `customer/profile.tsx` name edit modal pattern for edit modals

## 4. Acceptance Criteria

- [ ] All 4 menu items in provider profile navigate to their respective pages
- [ ] Gear icon navigates to Settings page
- [ ] Business Information page loads current data and allows editing all fields
- [ ] Logo and cover photo upload works via `ImagePicker`
- [ ] Business Hours page displays current hours and allows editing with time pickers
- [ ] Social Media Links page loads current links and allows editing
- [ ] Help & Support page shows FAQ accordion and contact form
- [ ] Settings page toggles theme and language correctly
- [ ] All new pages register as hidden tabs in the layout
- [ ] All strings are translated in both English and Arabic
- [ ] RTL layout works correctly on all new pages
- [ ] `npm run lint` passes
- [ ] `npx tsc --noEmit` passes
