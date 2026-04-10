# AGENTS.md

## Repository structure

Two independent apps sharing a Supabase backend — **not** a monorepo with shared packages.

```
/                    Expo SDK 54 mobile app (React Native 0.81)
/admin-web/          Next.js 16 admin dashboard (separate package.json, .env.local)
/supabase/           Edge Functions only (no local DB config)
/scripts/            SQL migrations, seed scripts, setup.js — manual, run in Supabase SQL Editor
```

Each app has its own `node_modules`, env file, and lint commands. Always work inside the correct directory.

## Commands

### Mobile app (run from repo root `D:\AppDev\DiscountyV2`)

All scripts internally invoke `npx -y -p node@22` — do not skip this prefix.

```bash
npm start              # Expo dev server
npm run android        # Dev server + Android
npm run lint           # ESLint via expo (the only verification command — no typecheck script)
npm run setup          # Generates google-services.json from .env
```

There is **no typecheck script**. The lint output has pre-existing warnings you can ignore (e.g. `react-hooks/set-state-in-effect`, unescaped entities in review/terms text). Watch for errors introduced by your changes only.

### Admin web (run from `admin-web/`)

```bash
npm run dev            # Next.js dev server (localhost:3000)
npm run lint           # ESLint (bare `eslint`, not `next lint` — has pre-existing set-state-in-effect warnings)
npm run build          # Production build
npx tsc --noEmit       # Typecheck (no npm script for this — run directly)
```

**Always run `npx tsc --noEmit` after changes.**

## Admin web — framework quirks

- **Next.js 16** with breaking changes. Components use `@base-ui/react` primitives (Input, Button, Dialog, Select), NOT standard HTML elements or Radix. The existing `radix-ui` packages are unused legacy deps — check `@base-ui/react` imports before writing code.
- **shadcn/ui** installed but wraps base-ui, not Radix. Style is `base-nova` (see `components.json`). Check existing components in `src/components/ui/` before assuming APIs. Uses `cva` variants + `cn()` utility from `@/lib/utils`.
- **SVGs must use `<img>` not `next/image`** — `next/image` does not render SVGs reliably. Use `/logo.svg` (light) or `/logo-white.svg` (dark backgrounds).
- **Font:** Cairo via `next/font/google`. CSS variable is `--font-cairo`, aliased as `--font-sans` in `globals.css`.
- **i18n:** `i18next` + `react-i18next`. Keys in `src/i18n/locales/{en,ar}.json`. All under `admin.*` namespace. Access with `t("admin.keyName")`.
- **RTL:** Arabic sets `document.documentElement.dir = "rtl"`. Use logical CSS properties (`start`/`end`, `ps`/`pe` not `pl`/`pr`).
- **Auth:** `AuthProvider` in `src/components/auth-provider.tsx`. On `PASSWORD_RECOVERY` event, auto-redirects to `/reset-password`. Tracks `adminRole` (super_admin | admin | moderator) from `admin_profiles` + `admin_roles`.
- **Supabase client:** `src/lib/supabase.ts`. `detectSessionInUrl: true` (must stay true for password reset flow).
- **No middleware** — auth guards are client-side in `AuthProvider` + page effects.
- **All pages are `"use client"`**. Every protected page wraps with `AdminPageWrapper` (ProtectedRoute + AdminLayout + ErrorBoundary).
- **Forms:** Zod schemas in `src/lib/validations.ts`. 8 schemas: `dealSchema`, `categorySchema`, `notificationSchema`, `loginSchema`, `customerEditSchema`, `providerEditSchema`, `adminUserSchema`, `adminGroupSchema`.
- **Types:** Shared types in `src/lib/types.ts` including admin management types (`AdminRole`, `AdminProfile`, `AdminPermission`, etc.).

## Mobile app — key patterns

- **Expo Router** file-based routing under `app/`. Route groups: `(auth)`, `(customer)`, `(provider)`.
- **Supabase client:** `lib/supabase.ts`. `detectSessionInUrl: false`. Uses `expo-secure-store` on native, `localStorage` on web.
- **Auth flow:** `contexts/auth.tsx` manages session, role, provider approval status, ban state. The `useProtectedRoute` hook redirects based on these states. On auth state change, `isLoading` is set `true` while `fetchUserRole` runs — do not bypass this or role-select will flash.
- **Deep link scheme:** `discounty://`.
- **Push notifications:** Edge Function `send-push-notification` + `expo-notifications`. Tokens in `push_tokens` table.
- **Font:** Cairo loaded via `@expo-google-fonts/cairo` (6 weights: 400–900). Use `fontFamily: 'Cairo_700Bold'` etc. in style objects.
- **RTL:** `i18n/index.ts` calls `I18nManager.forceRTL()` + triggers app reload via `expo-updates`.

### Theming

- Colors come from `useThemeColors()` hook (`hooks/use-theme-colors.ts`), backed by `constants/theme.ts`.
- Always use `colors.surfaceBg`, `colors.onSurface`, `colors.primary`, etc. — never hardcode hex values (except legacy screens not yet migrated).
- Design tokens for radius/shadows: import `Radius` and `Shadows` from `hooks/use-theme-colors.ts`.

### UI components

Reusable components live in `components/ui/`:
- `AnimatedButton` — wraps `Pressable` + `react-native-reanimated` scale animation. Accepts `variant="solid"|"gradient"|"outline"|"navy"`.
- `AnimatedEntrance` — fade/slide entrance animation with `index` and `delay` props.
- `DealCard` — standard deal card used in feed/saved/provider lists.
- `CircularProgress`, `EmptyState`, `GlassView`, `Logo`.

### i18n

- Keys are **flat** (no namespaced prefix like `provider.`). Access with `t("provider.dealTitle")` — the dot is part of the key name, not a namespace.
- Translation files: `i18n/locales/en.json` and `i18n/locales/ar.json`.

## Supabase

Both apps connect to project `yzwwzxffexjwxynnwngw.supabase.co`.

### Tables

`user_roles`, `customer_profiles`, `provider_profiles` (has `latitude`/`longitude` + generated `location` geography column), `discounts`, `redemptions`, `reviews`, `categories`, `notifications`, `push_tokens`, `admin_roles`, `admin_profiles`, `admin_permissions`, `admin_groups`, `admin_group_members`.

### Key RPCs

- `claim_deal(p_deal_id UUID)` — customer claims a deal
- `redeem_deal(p_qr_code_hash TEXT)` — provider scans QR
- `submit_review(p_redemption_id UUID, p_rating SMALLINT, p_comment TEXT)` — customer review
- `get_admin_users()` — returns admin profiles joined with auth.users emails + role names (SECURITY DEFINER)

### Edge Functions

- `send-push-notification` — Expo push via service role key. Requires auth JWT.
- `manage-admin` — admin user CRUD (create/delete/toggle-active) using `supabase.auth.admin` APIs. Requires auth JWT + admin role. Actions: `create`, `delete`, `toggle-active`.
- `generate-qr` — QR code generation.

### Admin management system

Admin users are managed through `admin_profiles` (not just `user_roles`). The `manage-admin` Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` for auth admin operations (create user, delete user, ban/unban). Client-side `signUp` must NOT be used for admin creation — it switches the caller's session.

`admin_roles` has 3 seeded roles: `super_admin`, `admin`, `moderator`. `admin_permissions` has a pre-seeded resource×action matrix (77 rows). All admins must have a row in `admin_profiles` — backfill existing admins with:
```sql
INSERT INTO admin_profiles (user_id, full_name, role_id, is_active)
SELECT ur.user_id, u.email, (SELECT id FROM admin_roles WHERE name = 'admin'), true
FROM user_roles ur JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin' ON CONFLICT (user_id) DO NOTHING;
```

### Migrations & scripts

No migrations directory. All schema changes are SQL scripts in `scripts/`, run manually in the Supabase SQL Editor. Key scripts: `admin-management-schema.sql`, `notifications-schema.sql`, `fix-rls-policies.sql`, `fix-claim-deal.sql`, `fix-submit-review.sql`.

## Environment files

| App | File | Key vars |
|-----|------|----------|
| Mobile | `.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `FIREBASE_*` |
| Admin | `admin-web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Do not commit `.env` or `.env.local`. Root has `.env.example`; admin-web has no `.env.example`.
