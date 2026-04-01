# Discounty — Full-Stack Implementation Plan

## Understanding Summary

- **What:** A mobile discount/deals marketplace app where providers (restaurants, cafes, clothing stores, etc.) post deals and customers redeem them via QR codes
- **Why:** Connect local businesses with customers through verified, trackable discount offers with a built-in accountability layer (mandatory reviews)
- **Who:** Two user types — **Customers** (browse/claim/redeem deals) and **Providers** (create/manage deals, scan QR codes). **Admin** is a separate app (deferred)
- **Core Flow:** Provider posts deal → Customer claims deal (max 3 active slots) → Customer gets unique QR code → Shows QR to provider → Provider scans QR in-app → Deal marked redeemed → Customer prompted to rate (dismissible, but slot stays occupied until reviewed)
- **Auth:** Phone/OTP via Supabase Auth (primary), with optional Google account linking later
- **Scale:** Small/local year 1 (~50 providers, ~1K customers), regional year 2, multi-city year 5+
- **Platform:** Mobile-only (iOS + Android) via Expo/EAS

## Assumptions

1. Supabase Pro tier is sufficient for year 1 (active project: `yzwwzxffexjwxynnwngw`)
2. Provider approval handled manually via separate admin app or Supabase dashboard
3. One QR code per redemption (unique hash, not reusable)
4. Deals have time windows (`start_time` to `end_time`)
5. Customer can have up to **3 active deal slots** — a slot is occupied from claim until review is submitted
6. Images stored in **Supabase Storage**
7. Existing UI design system (NativeWind + custom components) preserved and extended
8. Arabic + English i18n maintained
9. Categories are admin-managed (dynamic, not hardcoded)
10. Reviews are **public** — visible to all customers on provider profiles
11. Providers can **reply** to reviews (social-media style)

---

## Database Schema Changes

### New Table: `categories`

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` |
| `name` | varchar | NOT NULL |
| `name_ar` | varchar | NOT NULL (Arabic name) |
| `icon` | varchar | MaterialIcons name |
| `sort_order` | int | default 0 |
| `is_active` | bool | default true |
| `created_at` | timestamptz | default `now()` |

### Modify: `discounts`

Add columns:

| Column | Type | Notes |
|--------|------|-------|
| `category_id` | uuid | FK → `categories.id` |
| `description` | text | Deal description |
| `image_url` | text | Supabase Storage URL |
| `max_redemptions` | int | Limit on total claims |
| `current_redemptions` | int | Counter, default 0 |

### Modify: `customer_profiles`

Add columns:

| Column | Type | Notes |
|--------|------|-------|
| `display_name` | varchar | Customer display name |
| `avatar_url` | text | Profile photo URL |

### Database Functions (PostgreSQL)

#### `claim_deal(p_deal_id uuid)`
Checks:
1. Deal exists and status = 'active'
2. Deal not expired (`end_time > now()`)
3. `current_redemptions < max_redemptions`
4. Customer hasn't already claimed this deal
5. **Slot check:** count of customer's redemptions where `status = 'claimed'` OR (`status = 'redeemed'` AND no corresponding review exists) must be < 3

On success:
- Inserts into `redemptions` with status `claimed`
- Generates and stores `qr_code_hash`
- Increments `discounts.current_redemptions`

#### `redeem_deal(p_qr_code_hash varchar)`
Checks:
1. Hash exists in `redemptions`
2. Redemption status = 'claimed'
3. Associated deal belongs to the calling provider

On success:
- Updates status to `redeemed`
- Sets `redeemed_at = now()`

#### `submit_review(p_redemption_id uuid, p_rating smallint, p_comment text)`
Checks:
1. Redemption exists and belongs to calling customer
2. Redemption status = 'redeemed'
3. No review already exists for this redemption

On success:
- Inserts into `reviews`
- Frees the deal slot (the slot logic is query-based, not a status change)

#### Trigger: `update_provider_rating()`
- After INSERT on `reviews`
- Recalculates provider's average rating (stored as materialized/cached value on `provider_profiles`)

### RLS Policies

**`categories`:**
- SELECT: all authenticated users

**`discounts`:**
- SELECT: all authenticated users (active deals only via policy)
- INSERT/UPDATE/DELETE: provider owns the deal (`provider_id` matches provider profile)

**`redemptions`:**
- SELECT own redemptions: customer where `customer_id = auth.uid()`
- SELECT for provider: provider can see redemptions of their deals
- INSERT: via `claim_deal()` function only (SECURITY DEFINER)
- UPDATE: via `redeem_deal()` function only (SECURITY DEFINER)
- `qr_code_hash` visible only to owning customer

**`reviews`:**
- SELECT: all authenticated users (public)
- INSERT: via `submit_review()` function only
- UPDATE `provider_reply`: provider owns the review's provider_id

**`customer_profiles`:**
- SELECT: own profile
- UPDATE: own profile

**`provider_profiles`:**
- SELECT: all authenticated users (public profiles)
- UPDATE: own profile only

**`user_roles`:**
- SELECT: own role
- INSERT: via trigger on auth.users creation

---

## Authentication Flow

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│ Phone Entry │ ──→ │ OTP Verify   │ ──→ │ Role Select   │
│ +country    │     │ 6-digit code │     │ Customer/Biz  │
└─────────────┘     └──────────────┘     └───────┬───────┘
                                                  │
                         ┌────────────────────────┼────────────────┐
                         ▼                                         ▼
                  ┌──────────────┐                    ┌──────────────────┐
                  │ Customer     │                    │ Provider Signup  │
                  │ Feed (home)  │                    │ (multi-step form)│
                  └──────────────┘                    └────────┬─────────┘
                                                               ▼
                                                    ┌──────────────────┐
                                                    │ Pending Approval │
                                                    │ (waiting screen) │
                                                    └──────────────────┘
```

**Provider signup form collects:**
- Business name
- Category (from `categories` table)
- Location (map picker or GPS)
- Description
- Logo upload
- Phone number
- Website
- Social links (Instagram, Facebook, TikTok, X, Snapchat)

**Session management:**
- `@supabase/supabase-js` with `expo-secure-store` adapter
- Auto-refresh tokens
- Role check on app start → route to correct group

---

## QR Code Redemption Flow

### Customer Claims Deal
1. Taps "Claim Deal" on deal detail screen
2. `claim_deal()` DB function validates (3-slot limit, no expired, etc.)
3. Unique hash generated: `SHA256(UUID + deal_id + timestamp)`
4. Hash stored in `redemptions.qr_code_hash`
5. Customer sees QR code in "My Deals" tab

### Provider Scans QR
1. Provider taps "Scan QR" → camera opens (`expo-camera`)
2. Reads QR data (the hash)
3. Calls `redeem_deal(hash)` → validates ownership
4. Shows confirmation: deal title, customer info, discount value
5. Redemption status: `claimed` → `redeemed`

### Rating Prompt
1. Supabase Realtime detects status change on customer's device
2. Rating modal appears (dismissible)
3. If dismissed: deal slot stays occupied, "Rate Now" badge on My Deals tab
4. If submitted: star rating (1-5, required) + comment (optional) → slot freed

### Slot System
```
Slot occupied: status = 'claimed' OR (status = 'redeemed' AND no review)
Slot free:     review submitted for the redemption
Max slots:     3 concurrent
```

---

## Screen Map

### `(auth)` — Unauthenticated

| Screen | File | Purpose |
|--------|------|---------|
| Phone Entry | `app/(auth)/index.tsx` | Phone number + country code input |
| OTP Verify | `app/(auth)/otp-verify.tsx` | 6-digit code entry |
| Role Select | `app/(auth)/role-select.tsx` | Choose Customer or Provider |
| Provider Signup | `app/(auth)/provider-signup.tsx` | Multi-step business form |
| Pending Approval | `app/(auth)/pending-approval.tsx` | Provider waiting screen |

### `(customer)` — Bottom Tabs

| Tab | Screen | File | Purpose |
|-----|--------|------|---------|
| Feed | Feed | `app/(customer)/feed.tsx` | Browse deals, search, filter |
| My Deals | Redemptions | `app/(customer)/my-deals.tsx` | Active QR codes, history, rate badges |
| Saved | Bookmarks | `app/(customer)/saved.tsx` | Bookmarked deals |
| Profile | Profile | `app/(customer)/profile.tsx` | Settings, personal info, Google link |

**Customer Modals/Stacks:**

| Screen | File | Purpose |
|--------|------|---------|
| Deal Detail | `app/(customer)/deals/[id].tsx` | Full deal info + claim button |
| Provider Profile | `app/(customer)/provider/[id].tsx` | Public profile + reviews |
| Rating Modal | `app/(customer)/rate/[redemptionId].tsx` | Star rating + comment |
| QR Display | `app/(customer)/qr/[redemptionId].tsx` | Full-screen QR code |

### `(provider)` — Bottom Tabs

| Tab | Screen | File | Purpose |
|-----|--------|------|---------|
| Dashboard | Home | `app/(provider)/dashboard.tsx` | Stats, overview, aggregate rating |
| My Deals | Deals | `app/(provider)/deals.tsx` | List/manage deals |
| Scan QR | Scanner | `app/(provider)/scan.tsx` | Camera + validation |
| Reviews | Reviews | `app/(provider)/reviews.tsx` | All reviews + reply |
| Profile | Profile | `app/(provider)/profile.tsx` | Business info, settings |

**Provider Stacks:**

| Screen | File | Purpose |
|--------|------|---------|
| Create Deal | `app/(provider)/create-deal.tsx` | New deal form (existing) |
| Edit Deal | `app/(provider)/edit-deal/[id].tsx` | Modify deal |
| Scan Result | `app/(provider)/scan-result.tsx` | Confirmation after scan |

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Expo SDK 54 | Already set up |
| Routing | Expo Router | File-based, role-based groups |
| Styling | NativeWind + Tailwind | Existing design system |
| Backend | Supabase (direct SDK) | Auth, DB, Storage, Realtime |
| Auth | Supabase Phone/OTP | Built-in, anti-fraud |
| State | React Context + hooks | Simple, sufficient for v1 |
| QR Generate | `react-native-qrcode-svg` | SVG-based, customizable |
| QR Scan | `expo-camera` | Built-in barcode scanning |
| Secure Storage | `expo-secure-store` | Auth token persistence |
| Location | `expo-location` | Provider location, distance calc |
| Image Upload | `expo-image-picker` + Supabase Storage | Deal images, logos, avatars |
| Realtime | Supabase Realtime | Detect redemption status changes |
| i18n | i18next | en/ar already configured |
| Crypto | `expo-crypto` | QR hash generation |

**New dependencies to install:**
```
@supabase/supabase-js expo-secure-store expo-camera expo-location
expo-image-picker expo-crypto react-native-qrcode-svg react-native-svg
```

**Installed so far:**
- [x] `@supabase/supabase-js` (Phase 1)
- [x] `expo-secure-store` (Phase 1)
- [x] `expo-image-picker` (Phase 3)
- [x] `expo-camera` (Phase 4)
- [x] `expo-crypto` (Phase 4)
- [x] `react-native-qrcode-svg` (Phase 4)
- [x] `react-native-svg` (Phase 4)

---

## Implementation Phases

### Phase 1: Foundation (Backend + Auth) ✅ COMPLETED
- [x] Install Supabase SDK + secure storage
- [x] Database migrations: `categories` table, `discounts` column additions
- [x] Database functions: `claim_deal`, `redeem_deal`, `submit_review`
- [x] Database trigger: `update_provider_rating`
- [x] RLS policies for all tables
- [x] Phone/OTP auth flow screens (phone entry → OTP → role select)
- [x] Provider signup form (multi-step with image upload)
- [x] Pending approval screen
- [x] Session persistence + role-based routing
- [x] Seed `categories` table with initial data
- [x] Supabase Storage bucket for provider assets
- [x] TypeScript types for all database entities
- [x] Provider tab navigation (Dashboard, New Deal, Scan QR, Reviews, Profile)

### Phase 2: Customer Core ✅ COMPLETED
- [x] Supabase service layer (`lib/api.ts` — typed queries for deals, providers, categories, redemptions)
- [x] Feed screen → real data with category filtering, search, pull-to-refresh, empty states
- [x] Deal detail screen with claim button + 3-slot validation + live countdown timer
- [x] Provider profile screen (public info + social links + reviews + active deals)
- [x] Saved/bookmarked deals (AsyncStorage for v1, with toggle from deal detail)
- [x] Customer dashboard/My Deals (3-slot indicator, claim stats, active redemptions list)
- [x] Enhanced DealCard component (provider logo, category tag, time-left badge, rating)

### Phase 3: Provider Core ✅ COMPLETED
- [x] Provider API layer (`lib/api.ts` — provider stats, deal CRUD, image upload, redemption analytics)
- [x] Provider dashboard (`dashboard.tsx`) — real-time stats (rating card, active deals, redemptions breakdown, recent activity feed, quick actions)
- [x] Create deal form (`create-deal.tsx`) — 3-step wizard (Details → Review → Success) with image upload via `expo-image-picker` → Supabase Storage, dynamic category picker, form validation, Save Draft / Publish
- [x] Edit deal screen (`edit-deal/[id].tsx`) — loads real deal data, redemption stats, image replacement, category editing, Pause/Activate toggle, Delete with confirmation
- [x] Deals management list (`deals.tsx`) — filter tabs (All/Active/Paused/Draft), deal cards with stats, inline quick actions (pause/activate/edit/delete), empty state CTA
- [x] Provider tab layout restructure — Dashboard → My Deals → Scan QR → Reviews → Profile (create-deal and edit-deal as hidden routes)
- [x] i18n translations for all provider screens (en + ar)
- [x] `expo-image-picker` dependency installed (SDK 54 compatible)
- [x] TypeScript: 0 errors (`tsc --noEmit` passes)
- [ ] QR Scanner screen (`scan.tsx`) → moved to Phase 4
- [ ] Reviews screen (`reviews.tsx`) → moved to Phase 5
- [ ] Provider Profile screen (`profile.tsx`) → moved to Phase 6

### Phase 4: QR Redemption Flow ✅ COMPLETED (code-complete, visual test blocked by auth)
- [x] API layer: `redeemDeal`, `fetchRedemptionByQrHash`, `fetchRedemptionById` functions
- [x] Customer: QR code display screen (`qr/[redemptionId].tsx`) — shows QR via `react-native-qrcode-svg`, web fallback, deal info, status-aware rendering, instructions
- [x] Customer: Rating screen (`rate/[redemptionId].tsx`) — 1-5 star selector, optional comment, success animation, calls `submitReview` API
- [x] Provider: QR scanner (`scan.tsx`) — `expo-camera` barcode scanning on native, manual code entry on web, validates via `redeemDeal` API
- [x] Provider: Scan result (`scan-result.tsx`) — success/failure confirmation, deal details card, "Scan Another" / "Back to Dashboard" nav
- [x] Customer dashboard: QR/Rate navigation wired up (claimed → QR, redeemed → Rate)
- [x] Route registration: `qr/[redemptionId]` and `rate/[redemptionId]` in customer layout, `scan-result` in provider layout
- [x] i18n: All Phase 4 keys added (en + ar)
- [x] Dependencies installed: `expo-camera`, `expo-crypto`, `react-native-qrcode-svg`, `react-native-svg`
- [x] TypeScript: 0 errors
- [ ] Realtime subscription for redemption status changes (deferred — requires working auth to test)
- [ ] 3-slot enforcement UI feedback when slots full (existing in `claim_deal` DB function; UI indicator already in dashboard)
- ⚠️ **BLOCKER:** Visual testing blocked by auth guard — need working login flow to access protected routes

### Phase 5: Reviews & Social
- [ ] Provider reviews tab with reply functionality
- [ ] Public reviews on provider profile (customer-visible)
- [ ] Aggregate rating display (provider dashboard + provider profile)
- [ ] Review reply notification (UI indicator)

### Phase 6: Polish
- [ ] Google account linking from profile settings
- [ ] Location-based deal sorting (nearby first)
- [ ] Search with real data
- [ ] i18n for all new screens (en/ar)
- [ ] Error handling, loading states, empty states
- [ ] Skeleton loaders, pull-to-refresh
- [ ] App icon, splash screen updates

---

## Decision Log

| # | Decision | Alternatives Considered | Rationale |
|---|----------|------------------------|-----------|
| 1 | **Mobile-only** (iOS + Android) | Mobile + Web admin, Universal | Simpler scope for v1, admin deferred to separate app |
| 2 | **Separate admin app** | Built-in admin, super-provider | Security isolation, cleaner codebase, can build later |
| 3 | **In-app QR scan** (provider scans customer's QR) | Deep link scan, customer scans provider QR | Most secure — provider verifies customer's unique QR, no spoofing |
| 4 | **Separate signup flows** for customer vs provider | Single signup, everyone-starts-as-customer | Providers need business info upfront; cleaner onboarding |
| 5 | **Immediate rating prompt** (dismissible) | Push notification later, forced modal | Best UX — prompt while experience is fresh but don't trap the user |
| 6 | **3-slot system** with mandatory review to free slot | 1-at-a-time, unlimited | Balance between flexibility and review enforcement |
| 7 | **Phone/OTP primary auth** | Email/password, social-only | Anti-fraud (real phone = real identity), common in target market |
| 8 | **Direct Supabase SDK** (Approach A) | Edge Functions API, Hybrid | Fastest to build, minimal complexity, sufficient for year-1 scale |
| 9 | **Admin-managed categories** | Hardcoded, provider-created | Controlled taxonomy, prevents duplicates, requires `categories` table |
| 10 | **Public reviews** with provider replies | Private reviews, no replies | Builds trust, social engagement, accountability for providers |

---

## Verification Plan

### Automated Tests
- Database function tests via `execute_sql` (claim with full slots, expired deals, etc.)
- RLS policy tests (customer can't modify provider data, etc.)
- Auth flow end-to-end test via Expo development build

### Manual Verification
- QR code scan test on two physical devices (customer + provider)
- Rating flow walkthrough (claim → redeem → rate → slot freed)
- 3-slot limit enforcement (try to claim 4th deal)
- Provider signup → pending approval → admin approves → provider can post deals
- Arabic/English language switching on all new screens
