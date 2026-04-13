# AGENTS.md

## Repository structure

Two independent apps sharing a Supabase backend — **not** a monorepo with shared packages.

```
/                    Expo SDK 54 mobile app (React Native 0.81)
/admin-web/          Next.js 16 admin dashboard (separate package.json, .env.local)
/supabase/           Edge Functions only (no local DB config)
/scripts/            SQL migrations, seed scripts — manual, run in Supabase SQL Editor
/Docs/               Specs and implementation plans
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

- **Next.js 16** with breaking changes — read `admin-web/AGENTS.md` and `node_modules/next/dist/docs/` before writing code.
- Components use `@base-ui/react` primitives (Input, Button, Dialog, Select), NOT standard HTML elements or Radix. The existing `radix-ui` packages are installed but the active UI layer is base-ui. Check `@base-ui/react` imports in existing components before writing new ones.
- **shadcn/ui** installed wrapping base-ui. Style is `base-nova` (see `components.json`). Uses `cva` variants + `cn()` from `@/lib/utils`. Check existing components in `src/components/ui/` before assuming APIs.
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

- **Expo Router** file-based routing under `app/`. Route groups: `(auth)`, `(customer)`, `(provider)`. Hidden tabs use `options={{ href: null }}`.
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

**Detailed reference:** `Docs/REFERENCE.md` — tables, RPCs, subscription system, Stripe integration, edge functions, admin management, migrations.

Key points to remember:
- **Edge Function deployment:** Always use `verify_jwt: false` — the runtime's JWT check conflicts with function-level auth and returns 401.
- **Admin creation:** Use `manage-admin` Edge Function, never client-side `signUp` (it switches the caller's session).
- **No migrations directory.** Schema changes are SQL scripts in `scripts/`, run manually in Supabase SQL Editor.

## Environment files

| App | File | Key vars |
|-----|------|----------|
| Mobile | `.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `FIREBASE_*` |
| Admin | `admin-web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Do not commit `.env` or `.env.local`. Root has `.env.example`; admin-web has no `.env.example`.
