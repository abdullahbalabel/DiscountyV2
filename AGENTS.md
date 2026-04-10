# AGENTS.md

## Repository structure

Two independent apps sharing a Supabase backend — **not** a monorepo with shared packages.

```
/                    Expo SDK 54 mobile app (React Native 0.81)
/admin-web/          Next.js 16 admin dashboard (separate package.json, .env.local)
/supabase/           Edge Functions only (no local DB config)
/scripts/            SQL fixes, seed scripts, setup.js — manual, not run by any tooling
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

There is **no typecheck script**. The lint output has pre-existing warnings you can ignore (e.g. `react-hooks/set-state-in-effect` in `scan.tsx`, unescaped entities in review/terms text). Watch for errors introduced by your changes only.

### Admin web (run from `admin-web/`)

```bash
npm run dev            # Next.js dev server (localhost:3000)
npm run lint           # ESLint (has pre-existing set-state-in-effect warnings)
npm run build          # Production build
npx tsc --noEmit       # Typecheck (no npm script for this — run directly)
```

**Always run `npx tsc --noEmit` after changes.**

## Admin web — framework quirks

- **Next.js 16** with breaking changes. Components use `@base-ui/react` primitives (Input, Button, Dialog), NOT standard HTML elements or Radix directly. The existing `radix-ui` packages are unused legacy deps — check `@base-ui/react` imports before writing code.
- **shadcn/ui** installed but wraps base-ui, not Radix. Check existing components in `src/components/ui/` before assuming APIs. Uses `cva` variants + `cn()` utility from `@/lib/utils`.
- **SVGs must use `<img>` not `next/image`** — `next/image` does not render SVGs reliably. Use `/logo.svg` (light) or `/logo-white.svg` (dark backgrounds).
- **Font:** Cairo via `next/font/google`. CSS variable is `--font-cairo`, aliased as `--font-sans` in `globals.css`.
- **i18n:** `i18next` + `react-i18next`. Keys in `src/i18n/locales/{en,ar}.json`. All `admin.*` namespace. Access with `t("admin.keyName")`.
- **RTL:** Arabic sets `document.documentElement.dir = "rtl"`. Use logical CSS properties (`start`/`end`, `ps`/`pe` not `pl`/`pr`).
- **Auth:** `AuthProvider` in `src/components/auth-provider.tsx`. On `PASSWORD_RECOVERY` event, auto-redirects to `/reset-password`.
- **Supabase client:** `src/lib/supabase.ts`. `detectSessionInUrl: true` (must stay true for password reset flow).
- **No middleware** — auth guards are client-side in `AuthProvider` + page effects.
- **`admin-web/CLAUDE.md`** just references this AGENTS.md.

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

Both apps connect to project `yzwwzxffexjwxynnwngw.supabase.co`. Key RPCs: `claim_deal`, `redeem_deal`, `submit_review`.

Tables: `user_roles`, `customer_profiles`, `provider_profiles` (has `latitude`/`longitude` + generated `location` geography column), `discounts`, `redemptions`, `reviews`, `categories`, `notifications`, `push_tokens`.

Edge Functions in `supabase/functions/`. SQL scripts in `scripts/` are **manual** — run them in the Supabase SQL editor, not via any CLI tool.

## Environment files

| App | File | Key vars |
|-----|------|----------|
| Mobile | `.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `FIREBASE_*` |
| Admin | `admin-web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

Do not commit `.env` or `.env.local`. Copy `.env.example` for setup.
