# Discounty

> A cross-platform discount & deal discovery app connecting customers with local business offers via QR-based redemption.

**Repository:** [github.com/abdullahbalabel/DiscountyV2](https://github.com/abdullahbalabel/DiscountyV2.git)

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Architecture](#architecture)
- [Application Workflow](#application-workflow)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation (Development)](#installation-development)
- [Environment Setup](#environment-setup)
- [Running the App](#running-the-app)
- [Dependencies](#dependencies)
- [Project Structure](#project-structure)
- [Internationalization](#internationalization)
- [Admin Panel](#admin-panel)
- [Stripe Integration](#stripe-integration)
- [Building for Production](#building-for-production)
- [Contributing](#contributing)
- [License](#license)

---

## About

Discounty is a mobile application built with **Expo (React Native)** and **Supabase** backend. It provides a marketplace where:

- **Customers** can browse, claim, and redeem discount deals from local businesses using QR codes.
- **Providers** (business owners) can create, manage, and track their discount campaigns and scan customer QR codes at the point of sale.

The app supports English and Arabic (RTL) with full internationalization, dark/light theming, and push notifications.

---

## Features

### Customer Side
- Browse active deals with category filtering and search
- Claim deals and receive QR codes for in-store redemption
- Save/bookmark deals for later
- View deal history (claimed, redeemed, expired)
- Rate and review providers after redemption
- View provider profiles with ratings, location, and social media links
- Push notifications for new deals and redemption updates
- Dashboard with personal stats (claimed, redeemed, saved, active)

### Provider Side
- Business profile management (name, logo, cover photo, description, hours)
- Create, edit, pause, activate, and delete deals (percentage or fixed discounts)
- QR code scanner to redeem customer deals at the point of sale
- Dashboard with analytics (active deals, total redemptions, ratings)
- Customer review management with reply capability
- Social media links management
- Provider approval workflow (pending/approved/rejected)

### Auth & Security
- Phone (OTP) and email/password authentication via Supabase Auth
- Role-based access control (Customer, Provider, Admin)
- Provider approval flow for new business signups
- Account suspension/ban management
- Secure token storage (Expo SecureStore on native, localStorage on web)

### Monetization / Subscriptions
- Tiered subscription plans for providers (Free, Basic, and future tiers)
- Monthly and yearly billing cycles via Stripe Checkout
- Each plan defines limits: active deals, featured deals, push notifications, analytics, priority support, homepage placement
- Upgrades take effect immediately through Stripe Checkout
- Downgrades are scheduled to take effect at the end of the current billing period (no Stripe checkout needed)
- Subscription lifecycle managed via Stripe webhooks (checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted)
- Admin manual subscription assignment from the admin web panel (bypasses Stripe)
- Automatic deal pausing when a plan change reduces the deal limit
- Pending downgrade banner with cancel option for providers
- SAR (Saudi Riyal) currency for all prices

---

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Mobile App  │────▶│   Supabase API   │────▶│  PostgreSQL │
│  (Expo/RN)   │◀────│   Auth, Realtime │◀────│  Database   │
└─────────────┘     └──────────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    │ Edge Functions│
                    │ (Push Notif, │
                    │  Stripe)     │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Stripe    │
                    │   (Payments)│
                    └─────────────┘
┌─────────────┐
│ Admin Panel  │  (Next.js web app)
│ (admin-web/) │
└─────────────┘
```

---

## Application Workflow

### Overview

Discounty has three user roles with distinct workflows:

```
                    ┌──────────────┐
                    │  Admin Panel  │
                    │  (Next.js Web)│
                    └──────┬───────┘
                           │ approves/rejects
                    ┌──────▼───────┐
                    │  Supabase DB  │
                    └──┬────────┬──┘
                       │        │
              ┌────────▼──┐  ┌─▼────────┐
              │  Customer  │  │ Provider  │
              │  (Mobile)  │  │ (Mobile)  │
              └────────────┘  └──────────┘
```

---

### 1. Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Login    │────▶│  OTP Verify  │────▶│  Auth Token  │
│ (Email/  │     │  (Phone only)│     │  Stored      │
│  Phone)   │     └──────────────┘     └──────┬───────┘
└─────┬─────┘                                  │
      │ Email auth                             │
      └────────────────────────────────────────┘
                                              │
                                    ┌─────────▼─────────┐
                                    │   New User?        │
                                    └──┬──────────────┬──┘
                                       │ Yes          │ No
                                ┌──────▼──────┐  ┌───▼────────┐
                                │ Role Select │  │ Redirect   │
                                │ (Customer / │  │ to Home    │
                                │  Provider)  │  └────────────┘
                                └──┬────────┬──┘
                                   │        │
                          ┌────────▼──┐  ┌──▼──────────────┐
                          │ Customer  │  │ Provider Signup  │
                          │ Feed      │  │ (3-step wizard)  │
                          └───────────┘  └────────┬─────────┘
                                                   │
                                            ┌──────▼──────┐
                                            │  Pending    │
                                            │  Approval   │
                                            └──────┬──────┘
                                                   │
                                            ┌──────▼──────┐
                                            │ Admin       │
                                            │ Approves/   │
                                            │ Rejects     │
                                            └──────┬──────┘
                                                   │
                                         ┌─────────▼─────────┐
                                    ┌────┤                    ├────┐
                                    ▼                         ▼
                              ┌──────────┐            ┌─────────────┐
                              │ Provider │            │  Account    │
                              │Dashboard │            │  Suspended  │
                              └──────────┘            └─────────────┘
```

**Authentication methods:**
- **Phone + OTP:** Enter phone number with country code (supports 11 countries) → receive SMS OTP → enter 6-digit code → authenticated
- **Email + Password:** Toggle to email mode → sign in or sign up → authenticated

**Session management:** Supabase handles session tokens. Tokens are stored in Expo SecureStore (native) or localStorage (web) with auto-refresh enabled.

---

### 2. Customer Journey

```
┌────────┐   ┌──────────┐   ┌────────────┐   ┌──────────────┐   ┌───────────┐
│ Browse  │──▶│  Deal    │──▶│  Claim     │──▶│  QR Code     │──▶│  Visit    │
│  Feed   │   │  Details │   │  Deal      │   │  Displayed   │   │  Store    │
└────────┘   └──────────┘   └────────────┘   └──────┬───────┘   └─────┬─────┘
                                                     │                 │
                                                     │          ┌──────▼──────┐
                                                     │          │ Provider    │
                                                     │          │ Scans QR   │
                                                     │          └──────┬──────┘
                                                     │                 │
                                              ┌──────▼────────┐  ┌────▼────────┐
                                              │ Status:       │  │ Status:     │
                                              │ "Ready to     │  │ "Redeemed"  │
                                              │  Scan"        │  │             │
                                              └───────────────┘  └──────┬──────┘
                                                                        │
                                                                 ┌──────▼──────┐
                                                                 │  Rate &     │
                                                                 │  Review     │
                                                                 └──────┬──────┘
                                                                        │
                                                                 ┌──────▼──────┐
                                                                 │  Slot Freed │
                                                                 │  (max 3)    │
                                                                 └─────────────┘
```

**Step-by-step:**

1. **Browse Feed** (`/(customer)/feed`) — Scroll through active deals. Filter by category pills or search by keyword. Deals are fetched from Supabase with joined provider and category data. Pull to refresh.

2. **Deal Details** (`/(customer)/deals/[id]`) — Tap a deal card to view full details: image, discount value, countdown timer, spots remaining, provider info. Save or share the deal.

3. **Claim Deal** — Press "Claim Deal" button. The app checks the **slot limit** (max 3 active deals per customer). Calls `claim_deal` RPC which creates a redemption record with a unique QR code hash.

4. **QR Code** (`/(customer)/qr/[redemptionId]`) — Displays the QR code rendered via `react-native-qrcode-svg`. Shows "Ready to Scan" status badge.

5. **In-Store Redemption** — Customer visits the provider and shows the QR code. Provider scans it using the app.

6. **Redeemed** — After provider scan, QR screen updates to "Redeemed" with a green checkmark. A "Rate Experience" button appears.

7. **Rate & Review** (`/(customer)/rate/[redemptionId]`) — Select 1-5 stars, optionally add a comment (max 500 chars). Submit calls `submit_review` RPC which creates the review, updates the provider's average rating, and **frees the slot**.

**Slot System:** Customers can hold a maximum of 3 active deals simultaneously. A slot is occupied when a deal is "claimed" or "redeemed but not yet reviewed." Reviewing a redeemed deal frees its slot.

---

### 3. Provider Journey

```
┌──────────┐   ┌──────────────┐   ┌───────────┐   ┌───────────┐
│ Provider │──▶│  3-Step      │──▶│  Pending  │──▶│  Admin    │
│ Signup   │   │  Registration│   │  Approval │   │  Reviews  │
└──────────┘   └──────────────┘   └───────────┘   └─────┬─────┘
                                                         │
                                              ┌──────────▼──────────┐
                                         ┌────┤                     ├────┐
                                         ▼                          ▼
                                   ┌───────────┐           ┌──────────────┐
                                   │ Approved  │           │  Rejected/   │
                                   │           │           │  Suspended   │
                                   └─────┬─────┘           └──────────────┘
                                         │
                                  ┌──────▼──────┐
                                  │  Dashboard  │
                                  └──┬───┬───┬──┘
                                     │   │   │
                    ┌────────────────┘   │   └────────────────┐
                    ▼                    ▼                    ▼
             ┌───────────┐       ┌───────────┐        ┌───────────┐
             │  Create   │       │  Scan QR  │        │  Manage   │
             │  Deals    │       │ (Redeem)  │        │  Reviews  │
             └───────────┘       └───────────┘        └───────────┘
```

**Step-by-step:**

1. **Provider Signup** (`/(auth)/provider-signup`) — 3-step wizard:
   - **Step 1 - Business Info:** Upload logo, enter business name, select category, description, set GPS location
   - **Step 2 - Contact:** Phone, website, social media links (Instagram, Facebook, TikTok, X, Snapchat)
   - **Step 3 - Review:** Summary of all info, submit application

2. **Pending Approval** (`/(auth)/pending-approval`) — Shows a 3-step progress tracker: Application Received → Under Review → Approved. Provider waits here until admin action.

3. **Admin Approval** (Admin Web Panel) — Admin reviews the provider application and clicks Approve or Reject.

4. **Dashboard** (`/(provider)/dashboard`) — Shows rating, stats (active deals, total redemptions, pending/completed), recent activity, and quick actions.

5. **Create Deal** (`/(provider)/create-deal`) — 3-step wizard:
   - **Step 1 - Details:** Cover image, title, description, category, discount value (% or fixed), expiry date, max redemptions
   - **Step 2 - Review:** Preview how the deal appears to customers
   - **Step 3 - Success:** Confirmation. Options to return to dashboard or create another. Can also save as draft.

6. **Manage Deals** (`/(provider)/deals`) — List all deals with filtering (All/Active/Paused/Draft/Expired), search, sorting, and actions (Pause, Activate, Edit, Delete).

7. **Scan QR** (`/(provider)/scan`) — Camera-based QR scanner with manual entry fallback. Scans customer QR code → calls `redeem_deal` RPC → navigates to result screen. Sends push notifications to both customer and provider on success.

8. **Reviews** (`/(provider)/reviews`) — View customer reviews, reply to them. Tab badge shows unreplied count (polled every 30 seconds).

---

### 4. QR Code End-to-End Flow

```
 Customer Side                          Provider Side
┌──────────────────┐                 ┌──────────────────┐
│                  │                 │                  │
│ 1. Claim Deal    │                 │                  │
│    (RPC call)    │                 │                  │
│        │         │                 │                  │
│        ▼         │                 │                  │
│ 2. Server creates│                 │                  │
│    redemption    │                 │                  │
│    with unique   │                 │                  │
│    qr_code_hash  │                 │                  │
│        │         │                 │                  │
│        ▼         │                 │                  │
│ 3. QR code       │                 │                  │
│    displayed on  │                 │                  │
│    phone screen  │                 │                  │
│        │         │                 │                  │
│        └──────────────────────────▶│ 4. Provider      │
│                  │                 │    scans QR      │
│                  │                 │    with camera   │
│                  │                 │        │         │
│                  │                 │        ▼         │
│                  │                 │ 5. RPC:          │
│                  │                 │    redeem_deal   │
│                  │                 │    (qr_hash)     │
│                  │                 │        │         │
│                  │                 │        ▼         │
│                  │                 │ 6. Server marks  │
│                  │                 │    redemption as │
│                  │                 │    "redeemed"    │
│                  │◀────────────────┤ 7. Push notif   │
│ 8. QR screen     │                 │    sent to       │
│    shows         │                 │    customer      │
│    "Redeemed"    │                 │                  │
└──────────────────┘                 └──────────────────┘
```

The QR code contains a unique hash string generated server-side when the deal is claimed. The provider's scanner reads this hash and passes it to the `redeem_deal` Supabase RPC, which validates and updates the redemption status atomically.

---

### 5. Push Notification Flow

```
┌──────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  App Event   │────▶│  notifications.ts │────▶│  Supabase Edge   │
│  (redeem,    │     │  - createNotif()  │     │  Function        │
│   new deal,  │     │  - sendPush()     │     │  (send-push-     │
│   review)    │     └───────────────────┘     │   notification)  │
└──────────────┘                               └────────┬─────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │  Expo Push API   │
                                               │  (exp.host)      │
                                               └────────┬─────────┘
                                                        │
                                                        ▼
                                               ┌──────────────────┐
                                               │  User Device     │
                                               │  (notification   │
                                               │   displayed)     │
                                               └──────────────────┘
```

**Notification types:** `deal_redeemed`, `new_deal`, `review_received`, `account_activity`, `deal_expiring`, `admin_broadcast`, `admin_message`

**How it works:**
1. On app launch, `NotificationsProvider` registers the device for push notifications and saves the Expo push token to the `push_tokens` Supabase table
2. When an event occurs (deal redeemed, new deal created, review received), the app inserts a record into the `notifications` table and calls the `send-push-notification` Edge Function
3. The Edge Function fetches the target user's push tokens and sends messages via the Expo Push API
4. The app also subscribes to Supabase Realtime on the `notifications` table for in-app notification updates and deep-links users to relevant screens on tap

---

### 6. Admin Approval Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                        Admin Web Panel                           │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Pending Tab  │───▶│ Review       │───▶│ Approve /    │       │
│  │              │    │ Provider     │    │ Reject       │       │
│  └──────────────┘    └──────────────┘    └──────┬───────┘       │
│                                                  │               │
│                                    ┌─────────────▼──────────┐    │
│                                    │ Update provider_profiles│    │
│                                    │ approval_status field   │    │
│                                    └─────────────┬──────────┘    │
└──────────────────────────────────────────────────┼───────────────┘
                                                   │
                                          ┌────────▼────────┐
                                          │  On next login  │
                                          └──┬───────────┬──┘
                                             │           │
                                    ┌────────▼───┐  ┌────▼──────────┐
                                    │  Provider  │  │  Account      │
                                    │  Dashboard │  │  Suspended    │
                                    └────────────┘  └───────────────┘
```

**Admin actions available:**
- **Approve** — Sets `approval_status` to `approved`, provider gains dashboard access
- **Reject** — Sets `approval_status` to `rejected`, provider sees "Account Suspended" screen
- **Suspend** — Sets an approved provider back to `rejected`
- **Reactivate** — Sets a rejected provider back to `approved`
- **Edit** — Modify provider business details
- **Delete** — Permanently remove the provider profile

---

### 7. Supabase RPC Functions

| RPC Function | Parameters | Called By | Purpose |
|-------------|-----------|-----------|---------|
| `claim_deal` | `p_deal_id` | Customer | Creates redemption with QR hash, validates max 3 slots |
| `redeem_deal` | `p_qr_code_hash` | Provider | Validates QR, marks redemption as "redeemed" |
| `submit_review` | `p_redemption_id`, `p_rating`, `p_comment` | Customer | Creates review, updates provider rating, frees slot |
| `process_subscription_downgrades` | (none) | Scheduled (pg_cron) | Activates pending downgrades at period end, pauses excess deals |

---

### 8. Database Schema Overview

| Table | Purpose |
|-------|---------|
| `user_roles` | Maps users to roles (customer/provider/admin) |
| `customer_profiles` | Customer data, display name, avatar, ban status |
| `provider_profiles` | Business data, approval status, rating, location, social links |
| `discounts` | Deal data (title, value, type, status, timing, max redemptions) |
| `redemptions` | Claim/redeem records with QR code hashes |
| `reviews` | Star ratings and comments with provider replies |
| `categories` | Deal categories (name, icon, sort order) |
| `notifications` | In-app notification records |
| `push_tokens` | Expo push notification device tokens |
| `subscription_plans` | Plan definitions with pricing, Stripe IDs, feature limits |
| `provider_subscriptions` | Active/historical subscriptions with Stripe customer/subscription IDs, pending downgrade state |
| `admin_profiles` | Admin user profiles |
| `admin_roles` | Admin role assignments (super_admin, admin, moderator) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile Framework | [Expo SDK 54](https://expo.dev/) / [React Native 0.81](https://reactnative.dev/) |
| Navigation | [Expo Router v6](https://docs.expo.dev/router/) (file-based routing) |
| Backend / BaaS | [Supabase](https://supabase.com/) (Auth, PostgreSQL, Storage, Edge Functions) |
| State Management | React Context API |
| UI Components | Custom components, Expo Blur, Linear Gradient |
| Icons | Expo Symbols, React Native SVG |
| Animations | React Native Reanimated |
| Internationalization | i18next / react-i18next |
| Fonts | Cairo (Google Fonts) |
| QR Codes | expo-camera (scanner), react-native-qrcode-svg (generator) |
| Notifications | expo-notifications + Supabase Edge Functions |
| Payments | [Stripe](https://stripe.com/) (Checkout Sessions, Subscriptions, Webhooks) |
| Build System | EAS Build |
| Admin Panel | Next.js 16 + shadcn/ui + Tailwind CSS |
| Language | TypeScript 5.9 |

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 22 (project uses `npx -y -p node@22` internally)
- **npm** >= 10
- **Git**
- **Expo CLI**: `npm install -g expo-cli` (optional, `npx` is used)
- **EAS CLI** (for builds): `npm install -g eas-cli`
- For iOS: macOS with Xcode >= 15
- For Android: Android Studio with SDK 34+

---

## Installation (Development)

### 1. Clone the repository

```bash
git clone https://github.com/abdullahbalabel/DiscountyV2.git
cd DiscountyV2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase and Firebase values:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Firebase (for Android push notifications)
FIREBASE_PROJECT_NUMBER=your-project-number
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_APP_ID=your-app-id
FIREBASE_API_KEY=your-api-key
FIREBASE_PACKAGE_NAME=com.balabel.discounty
```

### 4. Generate Android config

This generates `google-services.json` from your `.env` values:

```bash
npm run setup
```

### 5. Start the development server

```bash
npm start
```

### 5. Open the app

In the Expo CLI output, choose one of:

- **Expo Go** — scan the QR code with the Expo Go app on your phone
- **Android Emulator** — press `a` (requires Android Studio setup)
- **iOS Simulator** — press `i` (requires Xcode on macOS)
- **Development Build** — press `d` (requires building a dev client)

---

## Environment Setup

### Android

1. Install [Android Studio](https://developer.android.com/studio)
2. Configure an Android Virtual Device (AVD) with API 34+
3. `google-services.json` is auto-generated by `npm run setup` from your `.env` (do not commit this file)

### iOS

1. Install Xcode 15+
2. Run `npx expo prebuild` to generate the `ios/` directory
3. Open `ios/Discounty.xcworkspace` in Xcode
4. Configure a development team and signing certificate

---

## Running the App

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo dev server |
| `npm run android` | Start on Android emulator |
| `npm run ios` | Start on iOS simulator |
| `npm run web` | Start web version |
| `npm run lint` | Run ESLint |

---

## Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `expo` | ~54.0.33 | Expo SDK core |
| `react` | 19.1.0 | UI library |
| `react-native` | 0.81.5 | Mobile framework |
| `react-dom` | 19.1.0 | React DOM (web) |
| `react-native-web` | ~0.21.0 | Web support for RN |
| `@supabase/supabase-js` | ^2.101.1 | Supabase client |
| `expo-router` | ~6.0.23 | File-based routing |
| `@react-navigation/native` | ^7.1.8 | Navigation core |
| `@react-navigation/bottom-tabs` | ^7.4.0 | Tab navigation |
| `@react-navigation/elements` | ^2.6.3 | Navigation UI elements |
| `expo-camera` | ~17.0.10 | QR code scanning |
| `react-native-qrcode-svg` | ^6.3.21 | QR code generation |
| `expo-notifications` | ~0.32.16 | Push notifications |
| `expo-secure-store` | ~15.0.8 | Secure token storage |
| `@react-native-async-storage/async-storage` | 2.2.0 | Local storage (saved deals) |
| `expo-image` | ~3.0.11 | Optimized image component |
| `expo-image-picker` | ~17.0.10 | Image selection |
| `expo-location` | ~19.0.8 | Location services |
| `expo-localization` | ~17.0.8 | Locale detection |
| `i18next` | ^26.0.3 | Internationalization core |
| `react-i18next` | ^17.0.2 | React i18n bindings |
| `expo-font` | ~14.0.11 | Custom font loading |
| `@expo-google-fonts/cairo` | ^0.4.2 | Cairo font family |
| `expo-splash-screen` | ~31.0.13 | Splash screen |
| `expo-haptics` | ~15.0.8 | Haptic feedback |
| `expo-blur` | ~15.0.8 | Blur effects |
| `expo-linear-gradient` | ~15.0.8 | Gradient backgrounds |
| `react-native-reanimated` | ~4.1.1 | Animations |
| `react-native-gesture-handler` | ~2.28.0 | Gesture handling |
| `react-native-safe-area-context` | ~5.6.0 | Safe area insets |
| `react-native-screens` | ~4.16.0 | Native screen containers |
| `react-native-svg` | 15.12.1 | SVG rendering |
| `expo-svg` | — | (via react-native-svg) |
| `expo-constants` | ~18.0.13 | App constants |
| `expo-device` | ~8.0.10 | Device info |
| `expo-crypto` | ~15.0.8 | Crypto utilities |
| `expo-linking` | ~8.0.11 | Deep linking |
| `expo-status-bar` | ~3.0.9 | Status bar control |
| `expo-symbols` | ~1.0.8 | SF Symbols |
| `expo-system-ui` | ~6.0.9 | System UI control |
| `expo-updates` | ~29.0.16 | OTA updates |
| `expo-web-browser` | ~15.0.10 | In-app browser |
| `expo-dev-client` | ~6.0.20 | Development client |
| `@expo/vector-icons` | ^15.0.3 | Icon packs |
| `@tamagui/theme-builder` | ^2.0.0-rc.36 | Theme building |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `typescript` | ~5.9.2 | TypeScript compiler |
| `@types/react` | ~19.1.0 | React type definitions |
| `eslint` | ^9.25.0 | Linting |
| `eslint-config-expo` | ~10.0.0 | Expo ESLint config |
| `sharp` | ^0.34.5 | Image processing (asset generation) |

---

## Project Structure

```
DiscountyV2/
├── app/                          # Expo Router pages (file-based routing)
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Entry redirect
│   ├── modal.tsx                 # Modal component
│   ├── +not-found.tsx            # 404 page
│   ├── (auth)/                   # Auth flow
│   │   ├── index.tsx             # Login/Signup
│   │   ├── otp-verify.tsx        # OTP verification
│   │   ├── role-select.tsx       # Customer/Provider selection
│   │   ├── provider-signup.tsx   # Provider registration
│   │   ├── pending-approval.tsx  # Awaiting admin approval
│   │   └── account-suspended.tsx # Banned/suspended screen
│   ├── (customer)/               # Customer screens
│   │   ├── feed.tsx              # Deal feed
│   │   ├── deals/[id].tsx        # Deal detail
│   │   ├── dashboard.tsx         # Customer dashboard
│   │   ├── saved.tsx             # Saved deals
│   │   ├── history.tsx           # Redemption history
│   │   ├── profile.tsx           # Customer profile
│   │   ├── notifications.tsx     # Notifications
│   │   ├── provider/             # Provider profile view
│   │   ├── qr/                   # QR code display
│   │   └── rate/                 # Review submission
│   └── (provider)/               # Provider screens
│       ├── dashboard.tsx         # Provider dashboard
│       ├── deals.tsx             # Deal management
│       ├── create-deal.tsx       # Create new deal
│       ├── edit-deal/[id].tsx    # Edit existing deal
│       ├── scan.tsx              # QR scanner
│       ├── scan-result.tsx       # Scan result
│       ├── reviews.tsx           # Review management
│       ├── profile.tsx           # Provider profile editing
│       ├── business-information.tsx
│       ├── business-hours.tsx
│       ├── social-media-links.tsx
│       ├── settings.tsx
│       ├── subscription.tsx
│       ├── notifications.tsx
│       └── help-support.tsx
├── lib/                          # Core libraries
│   ├── supabase.ts               # Supabase client config
│   ├── api.ts                    # API service layer
│   ├── types.ts                  # TypeScript type definitions
│   ├── notifications.ts          # Push notification helpers
│   ├── stripe.ts                 # Stripe checkout helpers
│   └── iconMapping.ts            # Category icon mapping
├── contexts/                     # React Context providers
│   ├── auth.tsx                  # Authentication state
│   ├── notifications.tsx         # Notification state
│   └── savedDeals.tsx            # Saved deals state
├── hooks/                        # Custom React hooks
├── constants/                    # App constants
├── i18n/                         # Internationalization
│   ├── index.ts                  # i18n config
│   └── locales/
│       ├── en.json               # English translations
│       └── ar.json               # Arabic translations
├── components/                   # Shared UI components
│   └── ui/                       # UI primitives
├── supabase/
│   └── functions/                # Supabase Edge Functions
│       ├── send-push-notification/
│       ├── create-checkout-session/
│       ├── stripe-webhook/
│       └── stripe-settings/
├── admin-web/                    # Admin panel (Next.js)
├── assets/                       # Images, fonts, icons
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tsconfig.json                 # TypeScript config
├── babel.config.js               # Babel config
├── metro.config.cjs              # Metro bundler config
└── eslint.config.js              # ESLint config
```

---

## Internationalization

Discounty supports two languages:
- **English** (default)
- **Arabic** (with RTL layout support)

Translation files are in `i18n/locales/`. The app uses `i18next` with `react-i18next` and automatically detects device locale via `expo-localization`.

---

## Admin Panel

The admin web dashboard is a **Next.js 16** app located in `admin-web/`. It uses shadcn/ui, Tailwind CSS, and Recharts for data visualization.

See [admin-web/README.md](admin-web/README.md) for setup instructions.

---

## Stripe Integration

Discounty uses Stripe for provider subscription payments. All transactions are in **SAR (Saudi Riyal)**.

### Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Mobile App      │────▶│  create-checkout-    │────▶│  Stripe API  │
│  (Provider taps  │     │  session Edge Fn     │     │              │
│   "Upgrade")     │     └──────────────────────┘     └──────┬───────┘
└─────────────────┘                                          │
                                                             ▼
┌─────────────────┐     ┌──────────────────────┐     ┌──────────────┐
│  Supabase DB     │◀────│  stripe-webhook      │◀────│  Stripe      │
│  (subscriptions  │     │  Edge Function       │     │  Webhooks    │
│   updated)       │     └──────────────────────┘     └──────────────┘
└─────────────────┘
```

### Edge Functions

| Function | Purpose |
|----------|---------|
| `create-checkout-session` | Creates a Stripe Checkout Session for subscription purchases/upgrades |
| `stripe-webhook` | Handles Stripe webhook events (checkout completed, invoice paid/failed, subscription updated/deleted) |
| `stripe-settings` | Admin-only: syncs Stripe products/prices, maps plans to Stripe price IDs |

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Cancels old subscription, creates new `provider_subscriptions` row |
| `invoice.paid` | Updates `current_period_end`, resets `past_due` to `active` |
| `invoice.payment_failed` | Sets subscription status to `past_due`, sends notification |
| `customer.subscription.updated` | Syncs plan/pricing changes from Stripe |
| `customer.subscription.deleted` | Expires subscription, activates pending downgrade or reverts to Free plan |

### Upgrade vs Downgrade Flow

**Upgrades** go through Stripe Checkout immediately:
1. Provider taps "Upgrade Plan" → `create-checkout-session` Edge Function
2. Stripe Checkout hosted page → payment
3. Webhook `checkout.session.completed` → old sub cancelled, new sub created

**Downgrades** are scheduled (no Stripe checkout):
1. Provider taps "Downgrade" → sets `pending_plan_id` and `pending_cycle` on the subscription
2. "Pending Downgrade" banner appears with cancel option
3. At period end, `process_subscription_downgrades()` SQL function activates the new plan and pauses excess deals

### Stripe Setup Steps (for new environments)

1. **Create a Stripe account** at [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Get API keys** from Developers → API keys:
   - Copy the **Secret key** → set as `STRIPE_SECRET_KEY` in Supabase Edge Function secrets
   - Copy the **Publishable key** (not used directly in this app, but useful for reference)

3. **Create Products and Prices** in Stripe Dashboard or via API:
   - Create one product per subscription plan (e.g., "Free", "Basic")
   - For each product, create two prices: monthly and yearly (both in **SAR** currency)
   - Free plan: create a recurring price with `unit_amount: 0` in SAR
   - **Important:** All prices for a single customer must use the same currency

4. **Configure webhook endpoint:**
   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
   - Events to subscribe to:
     - `checkout.session.completed`
     - `invoice.paid`
     - `invoice.payment_failed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Copy the **Webhook signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets

5. **Set Supabase Edge Function secrets:**
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

6. **Deploy Edge Functions:**
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   supabase functions deploy stripe-settings
   ```

7. **Sync prices to database:**
   - Open Admin Panel → Stripe Settings
   - Click "Test Connection" to verify Stripe integration
   - Click "Sync Products & Prices" to pull Stripe products into `subscription_plans`
   - Map each plan to its monthly and yearly Stripe price IDs

8. **Verify:**
   - As a provider, tap "Upgrade Plan" on the subscription screen
   - Complete a test payment using Stripe test card `4242 4242 4242 4242`
   - Confirm the subscription is created in Supabase and the provider sees the new plan

---

## Building for Production

This project uses [EAS Build](https://expo.dev/eas).

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS (already done)
eas build:configure

# Build for Android
eas build --platform android --profile production

# Build for iOS
eas build --platform ios --profile production

# Build preview APK (internal distribution)
eas build --platform android --profile preview
```

Build profiles are defined in `eas.json`.

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

Private — All rights reserved.
