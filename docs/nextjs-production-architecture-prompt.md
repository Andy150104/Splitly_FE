# Production-Ready Next.js Frontend Architecture Prompt

Create and configure a **production-ready Next.js frontend** for a bill-splitting/payment application.

The project must prioritize:

- Clean architecture
- Strong TypeScript typing
- Server-Side Rendering
- Server Components
- Security
- Excellent UI/UX
- Reasonable component decomposition
- Generated API contracts from Swagger/OpenAPI
- Centralized API access
- JWE authentication
- HttpOnly cookies
- Backend-for-Frontend architecture
- Maintainability as the project grows

The backend is an **ASP.NET Core Web API** exposing Swagger/OpenAPI.

---

# 1. Core Technology Stack

Use:

- Next.js with App Router
- React
- TypeScript with strict mode
- Tailwind CSS
- shadcn/ui
- Radix UI primitives
- Lucide React
- TanStack Query
- React Hook Form
- Zod
- `@hookform/resolvers`
- Axios
- Orval
- jose
- Zustand only when necessary
- Sonner
- TanStack Table for sufficiently complex tables
- next-themes
- ESLint
- Prettier
- pnpm

Use the latest stable mutually compatible versions.

---

# 2. Main Architecture

Use Next.js as a **Backend For Frontend (BFF)**.

Preferred architecture:

```text
Browser
  ↓
Next.js
  ↓
ASP.NET Core API
  ↓
Database / external services
```

The browser should NOT directly communicate with the ASP.NET Core API unless there is a strong technical reason.

For Server Components:

```text
Server Component
  ↓
Server API Facade
  ↓
Generated Swagger Client
  ↓
ASP.NET Core API
```

For interactive Client Components:

```text
Client Component
  ↓
Feature Hook / TanStack Query
  ↓
Next.js Route Handler / Server Action
  ↓
Server API Facade
  ↓
Generated Swagger Client
  ↓
ASP.NET Core API
```

Goals:

- Hide backend infrastructure from the browser
- Avoid exposing backend URLs unnecessarily
- Avoid exposing access/refresh tokens to browser JavaScript
- Support SSR authentication
- Perform authentication checks before protected UI is rendered
- Avoid leaking server-only environment variables
- Reduce sensitive DTO fields before sending data to Client Components

---

# 3. UI Library and Design System

Use:

- shadcn/ui
- Radix UI primitives
- Lucide React
- Tailwind CSS
- class-variance-authority
- clsx
- tailwind-merge

Initialize shadcn/ui correctly.

Structure:

```text
src/
  components/
    ui/
    common/
    layout/
```

Rules:

- `components/ui` contains reusable design-system primitives.
- `components/common` contains application-wide reusable components.
- `components/layout` contains application layout components.
- Do not duplicate UI components when an equivalent reusable component already exists.
- Do not modify shadcn primitives unnecessarily if composition can solve the problem.

---

# 4. UI/UX Quality Requirements

The application must look and feel like a **real modern SaaS/fintech application**, not a developer demo or generic admin template.

Use products such as Linear, Stripe Dashboard, Vercel Dashboard, Notion, and modern fintech products only as quality references.

Prioritize:

1. Clarity
2. Ease of use
3. Visual hierarchy
4. Consistency
5. Accessibility
6. Responsive behavior
7. Minimal cognitive load
8. Fast feedback
9. Clean information density

Avoid:

- cluttered layouts
- excessive borders
- excessive shadows
- too many colors
- oversized cards
- oversized typography
- inconsistent spacing
- unnecessary dialogs
- unnecessary animation
- decorative UI without useful information

Use semantic design tokens:

```text
background
foreground
primary
secondary
muted
accent
destructive
border
input
ring
```

Prefer semantic Tailwind classes such as:

```text
bg-background
bg-muted
text-foreground
text-muted-foreground
border-border
```

Do not scatter arbitrary hex colors throughout components.

---

# 5. Typography

Use a clean modern font through `next/font`.

Prefer:

```text
Geist
```

Create a consistent hierarchy:

```text
Page Title
Section Title
Card Title
Body
Secondary Text
Caption
```

Prefer typography, spacing, grouping, and weight before introducing extra colors.

---

# 6. Responsive Application Layout

Authenticated pages should use a professional dashboard layout.

Desktop:

```text
┌──────────────┬──────────────────────────────────────┐
│ Sidebar      │ Header                               │
│              ├──────────────────────────────────────┤
│              │ Main Content                         │
│              │                                      │
└──────────────┴──────────────────────────────────────┘
```

Support:

- collapsible sidebar
- mobile drawer/sidebar
- top header
- profile menu
- breadcrumbs only when useful
- responsive content width
- no accidental horizontal overflow

Navigation example:

```text
Dashboard
Bills
Groups
Payments
Members
Settings
```

Use icons consistently but only when they improve recognition.

---

# 7. Component Decomposition Rules

Component decomposition must be **intentional and reasonable**.

Do NOT create:

- one giant page component containing the entire feature
- hundreds of tiny one-line components
- components purely because JSX has more than a few lines
- abstractions before there is a reuse or complexity reason

Use **feature-based component ownership**.

Example:

```text
src/features/bills/
  components/
    bill-list.tsx
    bill-card.tsx
    bill-table.tsx
    bill-status-badge.tsx
    bill-progress.tsx
    bill-summary.tsx
    bill-form.tsx
    bill-member-list.tsx
    create-bill/
      create-bill-flow.tsx
      bill-details-step.tsx
      select-members-step.tsx
      split-amount-step.tsx
      review-bill-step.tsx
  hooks/
  schemas/
  actions/
  utils/
```

A component should normally have **one clear UI responsibility**.

Examples:

```text
BillsPage
  ├─ PageHeader
  ├─ BillFilters
  ├─ BillList
  │   └─ BillCard
  └─ Pagination
```

```text
BillDetailsPage
  ├─ BillHeader
  ├─ BillSummary
  ├─ BillProgress
  ├─ BillMemberList
  │   └─ BillMemberRow
  └─ BillActivity
```

```text
CreateBillPage
  └─ CreateBillFlow
      ├─ BillDetailsStep
      ├─ SelectMembersStep
      ├─ SplitAmountStep
      └─ ReviewBillStep
```

---

# 8. When to Extract a Component

Extract a component when one or more conditions apply:

- It has a distinct visual responsibility
- It contains meaningful interaction logic
- It is reused in multiple places
- It significantly improves readability of the parent component
- It owns its own loading/empty/error behavior
- It represents a recognizable domain concept
- It has meaningful props that form a stable interface

Examples of good reusable components:

```text
PageHeader
StatusBadge
Money
DateText
EmptyState
ErrorState
LoadingSkeleton
ConfirmDialog
SearchInput
FilterBar
Pagination
UserAvatar
MemberPicker
BillProgress
PaymentStatus
```

Do NOT extract trivial markup such as:

```tsx
function Label() {
  return <span>Bill</span>;
}
```

unless the abstraction genuinely represents a shared design-system primitive.

---

# 9. Component Size Guidelines

Do not enforce arbitrary line limits mechanically.

However, if a component becomes difficult to understand because it mixes:

- data fetching
- transformation
- form logic
- event handling
- layout
- dialogs
- tables
- business rules

split those responsibilities.

A page component should generally behave as an **orchestrator/composer** rather than containing all implementation details.

Good:

```tsx
export default async function BillDetailsPage({ params }) {
  const bill = await api.bills.getById(params.id);

  return (
    <>
      <BillHeader bill={bill} />
      <BillSummary bill={bill} />
      <BillMembers members={bill.members} />
      <BillActivity billId={bill.id} />
    </>
  );
}
```

Avoid pages with hundreds of lines of unrelated JSX and logic.

---

# 10. Server Component vs Client Component Boundaries

Use **Server Components by default**.

Add `"use client"` only when required for:

- event handlers
- local interactive state
- browser APIs
- React Hook Form
- interactive dialogs
- client-side mutation state
- TanStack Query client hooks
- drag/drop or similar browser interactions

Keep client boundaries as small as possible.

Bad:

```text
Entire dashboard page = Client Component
```

Better:

```text
DashboardPage                 Server Component
├─ DashboardSummary           Server Component
├─ RecentBills                Server Component
└─ DashboardFilters           Client Component
```

Do not convert a parent component to a Client Component merely because one child needs interaction.

---

# 11. Presentation vs Data Components

Separate business/data orchestration from presentational components where it improves maintainability.

Example:

```text
BillListSection
  ↓ fetch / prepare data
BillList
  ↓ render list
BillCard
```

Presentational components should ideally receive already prepared props.

Do not call Axios directly inside presentation components.

Avoid deeply coupling reusable UI to transport-layer DTOs if a smaller view model is more appropriate.

---

# 12. Props Design

Keep component props intentional.

Prefer:

```ts
type BillCardProps = {
  id: string;
  name: string;
  totalAmount: number;
  paidCount: number;
  memberCount: number;
  status: BillStatus;
};
```

instead of passing a huge object when only a few fields are needed.

However, do not manually duplicate every backend DTO purely to create unnecessary mapping layers.

Create view models only when they meaningfully:

- reduce exposed information
- simplify rendering
- combine multiple API sources
- decouple UI from unstable transport details

---

# 13. Avoid Prop Drilling

Do not introduce React Context globally just to avoid passing two or three props.

Prefer:

1. Component composition
2. Server-side data loading
3. Local state
4. TanStack Query
5. Zustand for real client-global state
6. React Context only when there is a true shared subtree concern

Do not create a giant application context.

---

# 14. Feature Folder Architecture

Use a feature-oriented structure:

```text
src/
  app/
    (public)/
    (auth)/
    (protected)/
    api/
    layout.tsx

  components/
    ui/
    common/
    layout/

  features/
    auth/
      components/
      hooks/
      schemas/
      actions/
      utils/

    bills/
      components/
      hooks/
      schemas/
      actions/
      utils/

    groups/
      components/
      hooks/
      schemas/
      actions/
      utils/

    payments/
      components/
      hooks/
      schemas/
      actions/
      utils/

    members/
      components/
      hooks/
      schemas/
      actions/
      utils/

  generated/
    api/

  lib/
    api/
    auth/
    env/
    errors/
    http/
    formatters/

  providers/
  stores/
```

Rules:

- Generic reusable UI belongs in `components`.
- Domain-specific UI belongs inside its feature.
- Do not move domain components into global `components/common` unless they are truly cross-feature.
- Do not place all hooks from the entire application in one giant root `hooks` directory.

---

# 15. Swagger / OpenAPI Code Generation

Use **Orval**.

Swagger/OpenAPI is the source of truth for:

- request DTOs
- response DTOs
- enums
- endpoint definitions

Do NOT manually duplicate backend DTOs.

Example backend Swagger:

```text
http://localhost:7001/swagger/v1/swagger.json
```

Create:

```text
orval.config.ts
```

Generate into:

```text
src/generated/api/
```

Generate:

- TypeScript request/response models
- endpoint functions
- query keys when appropriate
- TanStack Query hooks when useful

Generated files must NEVER be manually edited.

Package script:

```json
"api": "orval --config ./orval.config.ts"
```

---

# 16. API Facade

Generated Swagger code is a low-level internal implementation.

Create a stable application API facade.

Desired server-side usage:

```ts
await api.auth.login(...);
await api.auth.logout();
await api.auth.me();

await api.bills.getAll(...);
await api.bills.getById(id);
await api.bills.create(...);

await api.groups.getAll(...);
await api.groups.create(...);
```

Structure:

```text
src/lib/api/
  api.ts

  modules/
    auth.api.ts
    bills.api.ts
    groups.api.ts
    payments.api.ts
    members.api.ts
```

Example:

```ts
export const api = {
  auth: authApi,
  bills: billsApi,
  groups: groupsApi,
  payments: paymentsApi,
  members: membersApi,
};
```

Application code should not need to know awkward generated Swagger function names.

---

# 17. Server API vs Browser API

Strictly separate server-only and browser-safe APIs.

Example:

```text
src/lib/api/
  server/
    api.ts
    auth.ts
    bills.ts
    groups.ts
    payments.ts

  client/
    api.ts

  shared/
    errors.ts
```

Every server-only module must use:

```ts
import "server-only";
```

Server code may access:

- HttpOnly cookies
- private environment variables
- backend private URLs
- access token
- refresh token
- JWE processing when required

Client code must NEVER access:

- backend encryption keys
- database connection strings
- SMTP credentials
- refresh tokens
- private backend configuration

---

# 18. React Hooks API

For Client Components, expose feature hooks.

Desired usage:

```ts
const { data: bills, isLoading } = useBills();

const { mutateAsync: createBill } = useCreateBill();

const { data: currentUser } = useCurrentUser();
```

Optionally expose namespaced hooks if implementation remains ergonomic:

```ts
hooks.auth.useCurrentUser();
hooks.bills.useBills();
hooks.bills.useCreateBill();
```

Expected client flow:

```text
Component
  ↓
Feature Hook
  ↓
BFF endpoint / Server Action
  ↓
Server API Facade
  ↓
Generated Swagger Client
  ↓
ASP.NET Core API
```

Do NOT call Axios directly from UI components.

---

# 19. HTTP Client

Use Axios for the low-level HTTP transport when appropriate.

Create:

```text
src/lib/http/
  server-http-client.ts
  browser-http-client.ts
```

`server-http-client.ts` must include:

```ts
import "server-only";
```

Responsibilities:

- use configurable backend URL
- attach bearer token server-side
- normalize errors
- handle 401
- support token refresh
- support AbortSignal where possible
- retry the original request at most once after successful refresh

Do not scatter token logic across feature code.

---

# 20. Environment Configuration

Create:

```text
.env.example
```

Private server variables:

```env
BACKEND_API_URL=https://localhost:7001
AUTH_JWE_ENCRYPTION_KEY=
```

Only genuinely public variables may use:

```env
NEXT_PUBLIC_*
```

Never put server secrets in `NEXT_PUBLIC_*`.

Create:

```text
src/lib/env/server.ts
src/lib/env/client.ts
```

Validate environment variables with Zod.

`server.ts` must include:

```ts
import "server-only";
```

Never expose `process.env` wholesale.

---

# 21. Backend Configuration Security

Backend configuration may conceptually include:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "..."
  },
  "Database": {
    "ApplyMigrationsOnStartup": true
  },
  "Email": {
    "From": "",
    "Smtp": {
      "Host": "",
      "Port": 587,
      "EnableSsl": true,
      "Username": "",
      "Password": ""
    }
  },
  "Authentication": {
    "AccessToken": {
      "Issuer": "BillSplitService",
      "Audience": "BillSplitService.Api",
      "EncryptionKey": ""
    },
    "Google": {
      "ClientId": ""
    }
  },
  "Authorization": {
    "BootstrapAdministratorEmails": ""
  }
}
```

Never expose to frontend/browser:

- PostgreSQL connection strings
- database username/password
- SMTP username/password
- JWE encryption key
- server secrets
- bootstrap administrator configuration
- internal infrastructure configuration

These belong to server environments only.

---

# 22. JWE Access Token

The backend access token is a **JWE encrypted token**.

Do NOT treat it as a normal readable JWT.

Do NOT assume this works:

```ts
jwtDecode(accessToken);
```

Prefer treating the access token as an **opaque bearer token**.

Preferred architecture:

```text
Next.js Server
  ↓ access token
GET /auth/me
  ↓
ASP.NET Core validates/decrypts JWE
  ↓
CurrentUserDto
```

ASP.NET Core should remain the authority for token validation/decryption where possible.

This avoids unnecessarily sharing the backend JWE encryption key with Next.js.

Only if Next.js genuinely needs to decrypt JWE locally:

- use `jose`
- decrypt only in server-only code
- store the encryption key only in a private server environment variable
- never send decrypted token payload or encryption key to the browser

Example:

```text
src/lib/auth/
  session.ts
  cookies.ts
  jwe.ts
```

Every JWE module must include:

```ts
import "server-only";
```

---

# 23. Authentication Storage

Use secure **HttpOnly cookies**.

Do NOT store access or refresh tokens in:

```text
localStorage
sessionStorage
persisted Zustand storage
React Context
```

Recommended cookie behavior:

```ts
{
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/"
}
```

Use token expiration returned by the backend to configure cookie expiry.

---

# 24. Login Flow

Expected login flow:

```text
Login Form
  ↓
Next.js Server Action / Route Handler
  ↓
ASP.NET Core login endpoint
  ↓
accessToken + refreshToken + expirations
  ↓
Next.js stores tokens in HttpOnly cookies
  ↓
redirect
```

Do NOT return raw tokens to Client Components.

---

# 25. Current User Flow

Preferred:

```text
Protected Server Component/Layout
  ↓
read access-token cookie
  ↓
api.auth.me()
  ↓
ASP.NET Core validates JWE
  ↓
safe current-user DTO
```

Only pass required fields to Client Components.

---

# 26. Token Refresh

Centralize refresh logic.

Expected behavior:

```text
API request
  ↓
401
  ↓
server refresh flow
  ↓
use refresh_token HttpOnly cookie
  ↓
receive new tokens
  ↓
replace cookies
  ↓
retry original request once
```

Requirements:

- retry only once
- prevent infinite refresh loops
- clear auth cookies if refresh fails
- redirect to login where appropriate

---

# 27. Route Protection

Protect authenticated pages on the server.

Example:

```text
src/app/(protected)/layout.tsx
```

Verify current session/user before rendering protected content.

Do NOT rely only on:

```ts
useEffect(() => redirect(...));
```

Frontend checks improve UX only.

ASP.NET Core remains the final authorization authority.

---

# 28. SSR First

Use SSR and Server Components as much as reasonably possible.

Preferred:

```tsx
export default async function BillsPage() {
  const bills = await api.bills.getAll();

  return <BillList bills={bills} />;
}
```

Avoid unnecessary client fetching:

```tsx
"use client";

export default function BillsPage() {
  const { data } = useQuery(...);
}
```

when the data can naturally be rendered on the server.

---

# 29. TanStack Query + SSR

Use TanStack Query when client caching/refetching/mutations add value.

Support:

```text
Server Component
  ↓
QueryClient.prefetchQuery()
  ↓
dehydrate()
  ↓
HydrationBoundary
  ↓
Client Component
```

Avoid fetching the same resource on the server and immediately refetching it again on the client without a reason.

---

# 30. Forms

Use:

- React Hook Form
- Zod
- `@hookform/resolvers`
- shadcn/ui form components

Flow:

```text
Form Component
  ↓
Server Action / mutation hook
  ↓
API Facade
  ↓
Backend
```

Requirements:

- explicit labels
- inline validation errors
- disabled/loading submit state
- map backend validation errors into form fields where possible
- preserve entered data when validation fails

---

# 31. Dashboard UX

Dashboard information should be meaningful.

Useful metrics for a bill-splitting application:

```text
Total outstanding
Amount collected
Pending payments
Overdue payments
Active groups
Recent bills
Recent transactions
```

Do not create meaningless KPI cards purely to fill space.

---

# 32. Bills UX

Make bill information easy to scan.

Important fields:

- bill name
- total amount
- number of participants
- amount collected
- remaining amount
- due date
- payment progress
- status

Example:

```text
YouTube Premium

149,000 ₫

3 / 5 paid

████████████░░░░ 60%

89,400 ₫ collected
59,600 ₫ remaining

Due Aug 20
```

Statuses:

```text
Draft
Pending
Partially Paid
Paid
Overdue
Cancelled
```

Use consistent status badges.

---

# 33. Bill Details UX

Recommended hierarchy:

```text
Bill Header

Payment Summary

Payment Progress

Members

Activity
```

Example:

```text
YouTube Premium
149,000 ₫

Partially Paid

3 / 5 members paid

Andy        29,800 ₫      Paid
John        29,800 ₫      Paid
Anna        29,800 ₫      Pending
David       29,800 ₫      Pending
Sarah       29,800 ₫      Paid
```

Important actions must be easy to discover.

---

# 34. Create Bill UX

For longer workflows, use a guided flow:

```text
1. Bill details
2. Select people
3. Split amount
4. Review
```

Requirements:

- clearly show current step
- allow moving backward without losing values
- avoid showing too many fields at once
- show a final summary before submission
- provide obvious success feedback

---

# 35. Groups UX

Group cards should show useful information:

```text
Group name
Member count
Active bills
Outstanding amount
```

Group detail may use:

```text
Overview
Members
Bills
Activity
```

Use tabs only if they improve information organization.

---

# 36. Payment / QR UX

Payment screens should clearly display:

```text
Bill
Amount
Recipient
QR Code
Instructions
Payment status
```

Example:

```text
Pay your share

YouTube Premium

29,800 ₫

[ QR CODE ]

Scan using your banking app

Waiting for payment...
```

After success:

```text
✓ Payment successful

29,800 ₫ paid
Paid at 10:42 AM
```

Payment status should update without requiring a disruptive full-page reload when possible.

---

# 37. Tables

Use TanStack Table only for datasets that benefit from table behavior.

Support when appropriate:

- search
- sorting
- filtering
- pagination
- column visibility
- loading state
- empty state
- row actions

For large datasets prefer backend/server-side pagination.

Mobile tables should gracefully switch to a more readable card/list presentation when needed.

---

# 38. Loading / Empty / Error States

Create reusable components:

```text
LoadingSkeleton
EmptyState
ErrorState
ConfirmDialog
```

Prefer skeletons and localized loading indicators over full-screen spinners.

Every API-driven feature must handle:

```text
loading
success
empty
error
```

Empty states must guide the user toward the next useful action.

---

# 39. Toast and Interaction Feedback

Use Sonner.

Examples:

```text
✓ Bill created successfully
✓ Payment received
✓ Member invited
✕ Could not create bill
```

Every meaningful mutation should visibly communicate:

```text
pending
success
failure
```

Do not show toasts for every trivial interaction.

---

# 40. Accessibility

Use WCAG-friendly patterns.

Requirements:

- keyboard navigation
- visible focus states
- sufficient contrast
- semantic HTML
- correct button/link semantics
- proper labels
- accessible dialogs
- accessible dropdown menus
- ARIA only where necessary

Do not disable focus outlines without an accessible replacement.

---

# 41. Dark Mode

Support:

```text
Light
Dark
System
```

Use `next-themes`.

All components must remain readable and visually consistent in both themes.

---

# 42. Formatters

Create centralized formatters:

```text
src/lib/formatters/
  currency.ts
  date.ts
  datetime.ts
```

Provide helpers such as:

```ts
formatCurrency();
formatDate();
formatDateTime();
```

Do not concatenate currency or manually format dates throughout components.

---

# 43. Error Handling

Create a standardized frontend API error model.

Example:

```ts
export interface ApiError {
  status: number;
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
}
```

Handle:

- 400
- 401
- 403
- 404
- 409
- 422
- 500

Do not repeat Axios error parsing inside every feature.

Display user-friendly messages.

Avoid showing raw errors such as:

```text
Request failed with status code 500
```

unless in development/debug tooling.

---

# 44. State Management

Use:

- Server Components for server-rendered state
- TanStack Query for client-side server state
- React local state for local component state
- Zustand only for real global client/UI state

Good Zustand examples:

- collapsed sidebar state
- theme-related client preference
- temporary multi-step draft that genuinely spans unrelated component trees

Do not introduce Redux without a clear requirement.

Do not use Zustand as a replacement for TanStack Query.

---

# 45. Code Quality Rules

Strict rules:

- TypeScript strict mode
- avoid `any`
- prefer generated Swagger types
- no duplicated transport DTOs without a reason
- no hardcoded backend URLs
- no Axios inside presentation components
- no access token in localStorage
- no refresh token available to browser JavaScript
- no server secrets in `NEXT_PUBLIC_*`
- no JWE key in the client bundle
- no backend connection strings on frontend
- centralized API facade
- centralized authentication
- centralized refresh behavior
- centralized error handling
- use Server Components by default
- keep Client Component boundaries small
- do not put all logic inside `page.tsx`
- prefer composition over oversized components
- avoid premature abstractions

---

# 46. Desired Request Architecture

SSR:

```text
Next.js Server Component
  ↓
api.bills.getAll()
  ↓
Server API Facade
  ↓
Generated Orval Client
  ↓
Server HTTP Client
  ↓
Authorization: Bearer <JWE>
  ↓
ASP.NET Core
```

Interactive browser flow:

```text
Client Component
  ↓
Feature Hook
  ↓
Next.js /api/* or Server Action
  ↓
Server API Facade
  ↓
Generated Orval Client
  ↓
ASP.NET Core
```

Authentication:

```text
Browser
  ↓
Next.js
  ↓
HttpOnly Cookie
  ↓
Opaque JWE access token
  ↓
ASP.NET Core validates/decrypts token
```

---

# 47. Desired Developer Experience

Server code:

```ts
const user = await api.auth.me();

const bills = await api.bills.getAll();

const bill = await api.bills.getById(id);

await api.bills.create({
  name: "YouTube Premium",
  amount: 149000,
});
```

Client code:

```ts
const { data: bills } = useBills();

const createBill = useCreateBill();

await createBill.mutateAsync({
  name: "YouTube Premium",
  amount: 149000,
});
```

Developers should not need to understand the generated Swagger implementation details for normal application work.

---

# 48. Package Scripts

Configure:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "api": "orval --config ./orval.config.ts"
  }
}
```

Optionally provide API generation watch mode if it is stable and useful.

---

# 49. Visual Quality Checklist

Before considering a screen complete, verify:

1. Is the primary action obvious?
2. Can users understand the page within a few seconds?
3. Is information hierarchy clear?
4. Is spacing consistent?
5. Is the component decomposition reasonable?
6. Are Server/Client boundaries appropriate?
7. Are loading states handled?
8. Are empty states handled?
9. Are error states handled?
10. Are mutations visibly acknowledged?
11. Does the screen work on mobile?
12. Does dark mode work?
13. Is keyboard navigation usable?
14. Are unnecessary UI elements present?
15. Can the workflow be simplified?

Functionality alone is NOT considered complete.

Every screen should include:

```text
functional correctness
+
responsive design
+
loading state
+
empty state
+
error state
+
feedback
+
accessibility
+
visual polish
+
reasonable component decomposition
```

---

# 50. Deliverables

After implementation:

1. Show the complete folder structure.
2. Explain the major architecture decisions.
3. Show installed dependencies.
4. Provide `orval.config.ts`.
5. Configure Swagger/OpenAPI generation.
6. Provide the server API facade.
7. Show `api.auth.*`.
8. Show `api.bills.*`.
9. Show `api.groups.*`.
10. Provide example feature hooks.
11. Provide server-side HTTP client.
12. Configure HttpOnly authentication cookies.
13. Implement login flow.
14. Implement logout flow.
15. Implement refresh-token flow.
16. Implement `api.auth.me()`.
17. Provide protected layout.
18. Provide SSR page example.
19. Provide TanStack Query hydration example.
20. Provide client mutation example.
21. Configure environment validation.
22. Create `.env.example`.
23. Configure shadcn/ui.
24. Configure theme support.
25. Configure standardized errors.
26. Create core reusable UI components.
27. Create one well-decomposed bill feature.
28. Explain why the chosen component boundaries are appropriate.
29. Run Swagger generation.
30. Run typecheck.
31. Run lint.
32. Run production build.
33. Fix all errors before considering implementation complete.

Do not create fake/mock DTOs when equivalent Swagger types exist.

Do not expose sensitive backend configuration.

Prioritize:

```text
Security
SSR
Server Components
Type safety
Clean API boundaries
Excellent UX
Reasonable component decomposition
Maintainability
```
