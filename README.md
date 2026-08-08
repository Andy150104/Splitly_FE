# Splitly frontend

Production-oriented Next.js BFF for the bill sharing API at
`https://localhost:7288`.

## What is implemented

- Google Identity login and development login through Next.js route handlers.
- Opaque JWE access tokens and rotating refresh tokens in secure HttpOnly cookies.
- Signed, display-only profile cookie; authorization remains in ASP.NET Core.
- SSR dashboard, bill list/details and group list/details.
- Four-step bill workflow: details, direct/group members, equal/custom split, review and publish.
- Payment tracking, payment history, reminders, cancellation and manual payment recording.
- Group creation, member invitation/removal and closing.
- Orval contracts generated from the live Swagger document.
- TanStack Query hydration and browser retry-after-refresh flow.
- Responsive dashboard shell, dark mode, loading/empty/error states and toast feedback.

## Setup

Copy `.env.example` to `.env.local` and fill at least:

```env
BACKEND_API_URL=https://localhost:7288
BACKEND_TLS_REJECT_UNAUTHORIZED=false # local dev certificate only
SESSION_COOKIE_SECRET=use-at-least-32-random-characters
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_ENABLE_DEV_LOGIN=true
```

Never set `BACKEND_TLS_REJECT_UNAUTHORIZED=false` in production. Install and
trust the backend CA/certificate instead.

```powershell
npx --yes pnpm@10.15.0 install
npx --yes pnpm@10.15.0 dev
```

The installed Corepack on this workstation has an outdated pnpm signing key,
so the commands above pin pnpm explicitly. A current Corepack installation can
use normal `pnpm` commands.

## Swagger generation

The ASP.NET schema currently emits CLR generic component names containing
characters that OpenAPI does not allow. `src/generated/openapi-transformer.ts`
normalizes only those component keys before Orval validation. Generated files
under `src/generated/api` are never manually edited.

For the self-signed local backend certificate:

```powershell
$env:NODE_TLS_REJECT_UNAUTHORIZED='0'
.\node_modules\.bin\orval.cmd --config .\orval.config.ts
Remove-Item Env:NODE_TLS_REJECT_UNAUTHORIZED
```

Use a trusted certificate or `NODE_EXTRA_CA_CERTS` instead when possible.

## Verification

```powershell
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\eslint.cmd . --max-warnings 0
.\node_modules\.bin\next.cmd build
```

All three checks pass.

## Backend contract gaps

The current Swagger has no endpoint for `/auth/me`, online payment initiation,
payment webhook/history, notification feeds, percentage splits, admin bills,
email logs or audit logs. The frontend does not invent mock DTOs or fake these
features. The API facade is ready to extend after those contracts are added.

