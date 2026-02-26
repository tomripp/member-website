# Architecture Document — member-website

> Last updated: 2026-02-26
> Production: https://member-website-production.up.railway.app/
> Repository: https://github.com/tomripp/member-website

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Routing & Internationalization](#3-routing--internationalization)
4. [Authentication System](#4-authentication-system)
5. [Middleware](#5-middleware)
6. [Database Layer](#6-database-layer)
7. [API Routes](#7-api-routes)
8. [Frontend Components](#8-frontend-components)
9. [Email System](#9-email-system)
10. [Environment Variables](#10-environment-variables)
11. [Deployment (Railway + Nixpacks)](#11-deployment-railway--nixpacks)
12. [Testing Strategy](#12-testing-strategy)
13. [Key Architectural Decisions & Gotchas](#13-key-architectural-decisions--gotchas)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | 16.x |
| UI / Styling | Tailwind CSS v4 + shadcn/ui v3 | latest |
| Auth | Custom JWT — bcryptjs + jose | bcryptjs 3.x / jose 6.x |
| ORM | Prisma (prisma-client-js) | 5.x |
| Database | PostgreSQL | Railway-managed |
| Email | Resend API | 6.x |
| i18n | next-intl | 4.x |
| Validation | Zod | 4.x |
| Runtime | Node.js | 20.x |
| Deployment | Railway + Nixpacks (no Docker) | — |
| Unit Tests | Vitest | 4.x |
| E2E Tests | Playwright | 1.x |
| Test Data | SheetJS (xlsx) | 0.18.x |

---

## 2. Project Structure

```
website-registration/
├── middleware.ts               # Combined i18n + auth guard (Edge runtime)
├── next.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── railway.json                # Railway start command
├── nixpacks.toml               # Nixpacks install phase config
├── prisma/
│   ├── schema.prisma           # User + Session models
│   ├── seed.ts                 # Test user for E2E (test@example.com)
│   └── migrations/             # SQL migration history
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (returns children only — no html tag)
│   │   ├── page.tsx            # Root redirect → /en/
│   │   ├── globals.css
│   │   ├── [locale]/
│   │   │   ├── layout.tsx      # Locale layout — renders <html lang={locale}>
│   │   │   ├── page.tsx        # Homepage (public)
│   │   │   ├── members/
│   │   │   │   └── page.tsx    # Protected member area (Server Component, no DB call)
│   │   │   └── auth/
│   │   │       ├── login/page.tsx
│   │   │       ├── register/page.tsx
│   │   │       ├── verify-email/page.tsx
│   │   │       ├── forgot-password/page.tsx
│   │   │       └── reset-password/page.tsx
│   │   └── api/                # API routes — NOT under [locale]
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── verify-email/route.ts
│   │       │   ├── forgot-password/route.ts
│   │       │   ├── reset-password/route.ts
│   │       │   └── resend-verification/route.ts
│   │       └── me/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Nav bar (Server Component shell)
│   │   │   ├── Footer.tsx          # Footer with Impressum trigger
│   │   │   ├── UserNav.tsx         # Client Component — fetches /api/me on every route change
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   └── ResetPasswordForm.tsx
│   │   ├── members/
│   │   │   └── WelcomeBanner.tsx   # Client Component — fetches /api/me on mount
│   │   ├── ImpressumModal.tsx
│   │   └── ui/                     # shadcn/ui primitives
│   ├── i18n/
│   │   ├── routing.ts              # Locales config: ['en', 'de'], defaultLocale: 'en'
│   │   ├── request.ts              # Server-side getRequestConfig
│   │   ├── navigation.ts           # Locale-aware Link / useRouter / usePathname
│   │   └── messages/
│   │       ├── en.json
│   │       └── de.json
│   ├── lib/
│   │   ├── db.ts                   # Prisma 5 singleton
│   │   ├── auth.ts                 # JWT sign/verify, createSession, sessionCookieOptions
│   │   ├── email.ts                # Resend email helpers (verification + reset)
│   │   ├── tokens.ts               # crypto.randomBytes(32).toString('hex')
│   │   └── utils.ts                # cn() utility (tailwind-merge + clsx)
│   └── generated/prisma/           # Auto-generated Prisma client types
└── tests/
    ├── unit/
    │   ├── setup.ts                # Env vars + vi.clearAllMocks + console.error suppression
    │   ├── lib/
    │   │   ├── tokens.test.ts
    │   │   ├── auth.test.ts
    │   │   └── email.test.ts
    │   └── api/
    │       ├── register.test.ts
    │       ├── login.test.ts
    │       ├── logout.test.ts
    │       ├── verify-email.test.ts
    │       ├── forgot-password.test.ts
    │       ├── reset-password.test.ts
    │       └── me.test.ts
    ├── e2e/
    │   ├── global-setup.ts         # Seeds DB before any spec runs
    │   ├── auth.spec.ts
    │   ├── members.spec.ts
    │   └── navigation.spec.ts
    ├── generate-test-plan.ts       # Generates tests/test-plan.xlsx
    └── test-plan.xlsx              # 82-case test plan (auto-generated)
```

---

## 3. Routing & Internationalization

### Locale routing

All user-facing pages live under `src/app/[locale]/`. next-intl handles locale detection and prefix routing:

```
/           → redirects to /en/
/en/        → English homepage
/de/        → German homepage
/en/members → Protected members area (English)
/de/members → Protected members area (German)
/en/auth/*  → Auth pages (English)
/de/auth/*  → Auth pages (German)
```

API routes (`/api/*`) are **not** locale-prefixed and are excluded from the middleware matcher.

### next-intl config

```typescript
// src/i18n/routing.ts
export const routing = defineRouting({
  locales: ["en", "de"],
  defaultLocale: "en",
});
```

All translation strings live in `src/i18n/messages/en.json` and `de.json`. Pages and components use `useTranslations("namespace")` (client) or `getTranslations("namespace")` (server).

### Locale-aware navigation

`src/i18n/navigation.ts` re-exports Next.js navigation hooks wrapped by next-intl so that `<Link href="/members">` automatically resolves to `/{locale}/members`:

```typescript
import { useRouter, usePathname, Link } from "@/i18n/navigation";
```

---

## 4. Authentication System

Custom JWT-based auth — no NextAuth, no OAuth.

### Token & session design

| Concern | Implementation |
|---|---|
| Password hashing | bcryptjs, 12 rounds |
| Session identifier | `crypto.randomUUID()` stored in DB |
| JWT payload | `{ sub: userId, sessionToken }` signed with HS256 |
| JWT lifetime | 7 days (matching DB `Session.expiresAt`) |
| Cookie | `session=<jwt>; HttpOnly; SameSite=Lax; Secure (prod only); Path=/; Max-Age=604800` |

### Session lookup (API routes only)

`getCurrentUser()` in `src/lib/auth.ts`:
1. Reads `session` cookie
2. Verifies JWT signature + expiry
3. Looks up `Session` record in DB by `sessionToken`
4. Checks `session.expiresAt`
5. Returns `session.user` (id, email, name, emailVerified) — **never password**

> **Important**: `getCurrentUser()` uses `cookies()` from `next/headers` and Prisma — both require a real request context. It must only be called inside **API route handlers**, never in Server Components.

### Auth flows

#### Register
```
Client → POST /api/auth/register {email, password, name, locale}
  → Zod validate
  → Check duplicate email (400 if exists)
  → bcryptjs.hash(password, 12)
  → generateToken() → verificationToken
  → prisma.user.create(...)
  → sendVerificationEmail(email, token, locale)
  → 201 { message }
```

#### Verify email
```
User clicks link → GET /api/auth/verify-email?token=...
  → Find user by verificationToken
  → 400 if not found
  → 200 idempotent if already verified
  → prisma.user.update({ emailVerified:true, verificationToken:null })
  → 200 { message }
```

#### Login
```
Client → POST /api/auth/login {email, password}
  → Zod validate
  → prisma.user.findUnique(email)
  → 401 if not found (same message — no enumeration)
  → 403 if emailVerified = false
  → bcryptjs.compare(password, hash)
  → 401 if mismatch
  → createSession(userId) → DB Session record + signed JWT
  → Set-Cookie: session=<jwt>
  → 200 { user }
```

#### Logout
```
Client → POST /api/auth/logout
  → Read session cookie
  → verifyJwt → extract sessionToken
  → prisma.session.delete(token)  [ignores if already gone]
  → Set-Cookie: session=; Max-Age=0
  → 200 { message }
```

#### Forgot password
```
Client → POST /api/auth/forgot-password {email, locale}
  → Find user by email
  → If found: generateToken(), set resetToken + resetTokenExpiry (1h)
  → sendPasswordResetEmail(email, token, locale)
  → Always 200 (prevents email enumeration)
```

#### Reset password
```
Client → POST /api/auth/reset-password {token, password}
  → Find user by resetToken
  → 400 if not found or expiry < now
  → bcryptjs.hash(newPassword, 12)
  → prisma.user.update({ password, emailVerified:true, resetToken:null, resetTokenExpiry:null })
  → prisma.session.deleteMany({ userId })  ← invalidates all sessions
  → 200 { message }
```

> **Design note**: `reset-password` sets `emailVerified: true` — completing a password reset proves email ownership. `forgot-password` intentionally allows reset even if the email was never verified.

---

## 5. Middleware

`middleware.ts` at the project root runs on every non-asset, non-API request (Edge runtime).

**Execution order:**
1. Check if path matches `PROTECTED_PATHS` (`/en/members/**` or `/de/members/**`)
2. If protected:
   - No `session` cookie → redirect to `/{locale}/auth/login?callbackUrl={path}`
   - Invalid/expired JWT → clear cookie, redirect to login
3. Pass all other requests through `intlMiddleware` (next-intl locale routing)

```typescript
const PROTECTED_PATHS = /^\/(en|de)\/members(\/.*)?$/;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*))"],
};
```

The middleware performs **JWT verification only** (no DB call) — fast and suitable for Edge runtime. DB-backed session validation (`getCurrentUser()`) happens inside API routes when needed.

---

## 6. Database Layer

### Schema

```prisma
model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  password           String
  name               String?
  emailVerified      Boolean   @default(false)
  verificationToken  String?   @unique
  resetToken         String?   @unique
  resetTokenExpiry   DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  sessions           Session[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Prisma singleton

`src/lib/db.ts` exports a single `PrismaClient` instance, preventing connection pool exhaustion in development (Next.js hot-reload would create new instances on every module reload without this):

```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

### Migrations

```bash
# After schema changes:
npx prisma generate          # regenerates client types
npx prisma migrate dev --name <description>   # creates + applies migration locally

# Production (runs automatically on Railway start):
npx prisma migrate deploy
```

---

## 7. API Routes

All routes live under `src/app/api/` and are **not** locale-prefixed. All return JSON. All are marked `export const dynamic = "force-dynamic"` to prevent static caching.

| Method | Path | Auth required | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Create account, send verification email |
| POST | `/api/auth/login` | No | Validate credentials, set session cookie |
| POST | `/api/auth/logout` | No* | Delete session, clear cookie |
| GET | `/api/auth/verify-email?token=` | No | Verify email address |
| POST | `/api/auth/forgot-password` | No | Send password reset email |
| POST | `/api/auth/reset-password` | No | Set new password via token |
| POST | `/api/auth/resend-verification` | No | Resend verification email |
| GET | `/api/me` | Yes (401) | Return current user data |

*Logout degrades gracefully if no cookie is present.

### Validation

All routes use **Zod v4** for input validation. On `ZodError`, the first issue message is returned as `{ error: string }` with HTTP 400.

> **Zod v4 note**: Use `error.issues` (not `error.errors` which was Zod v3 API).

---

## 8. Frontend Components

### Rendering model

| Component type | Used for | Data source |
|---|---|---|
| Server Component | Static structure, layout, page shells | None / next-intl messages |
| Client Component | Auth state, dynamic data, interactivity | `/api/*` via `useEffect` + `fetch` |

### UserNav (client component)

The header lives inside the shared `[locale]/layout.tsx` and **persists across all page navigations** — it never remounts. To keep auth state fresh:

```typescript
// src/components/layout/UserNav.tsx
const pathname = usePathname();

useEffect(() => {
  fetch("/api/me")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => setUser(data?.user ?? null))
    .catch(() => setUser(null));
}, [pathname]); // re-fetches on every route change
```

`pathname` as dependency ensures UserNav re-checks auth status after login, logout, and any page navigation.

**Render logic:**

| State | Rendered |
|---|---|
| `user === null` (loading or logged out) | Login + Register buttons |
| `user !== null` | Dropdown with user name/email, Members link, Logout |

### WelcomeBanner (client component)

`src/components/members/WelcomeBanner.tsx` self-fetches `/api/me` on mount and renders a personalised welcome heading. It is used inside `members/page.tsx` instead of calling `getCurrentUser()` in the Server Component (which would crash — see §13).

### Auth forms

All auth forms (`LoginForm`, `RegisterForm`, etc.) are client components using:
- **react-hook-form** for form state
- **@hookform/resolvers/zod** for client-side validation
- **sonner** (`<Toaster />`) for toast notifications on success/error

---

## 9. Email System

`src/lib/email.ts` provides two exported functions:

```typescript
sendVerificationEmail(email, token, locale?)  // locale defaults to 'en'
sendPasswordResetEmail(email, token, locale?)
```

Both functions:
- Instantiate `new Resend(process.env.RESEND_API_KEY)` per call (safe — Resend SDK is stateless)
- Use `NEXT_PUBLIC_BASE_URL` (captured as module-level constant at import time) to build action URLs
- Build fully self-contained HTML emails with inline styles
- Support EN and DE subjects and body copy

**URL format:**
```
{BASE_URL}/{locale}/auth/verify-email?token={token}
{BASE_URL}/{locale}/auth/reset-password?token={token}
```

**Token lifetimes:**
- Verification token: no server-side expiry (link valid until used or overwritten)
- Reset token: 1 hour (`resetTokenExpiry = now + 3600s`)

---

## 10. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (provided by Railway) |
| `JWT_SECRET` | Yes | Min 32-char secret for HMAC-HS256 JWT signing |
| `RESEND_API_KEY` | Yes | Resend API key (`re_...`) |
| `RESEND_FROM_EMAIL` | Yes | Sender address (`noreply@yourdomain.com`) |
| `NEXT_PUBLIC_BASE_URL` | Yes | Full app URL, used in email links (`https://...`) |

Local development: stored in `.env.local` (gitignored).
Production: configured as Railway environment variables.

---

## 11. Deployment (Railway + Nixpacks)

### How it works

Railway auto-detects the project as a Node.js/Next.js app via Nixpacks. No Dockerfile is needed.

### nixpacks.toml

```toml
[phases.install]
cmds = ["npm install"]
```

`package-lock.json` is **gitignored** — the Windows-generated lock file is incompatible with the Linux build environment on Railway. `npm install` regenerates it fresh on each build.

### railway.json

```json
{
  "deploy": {
    "startCommand": "npx prisma migrate deploy && npx next start -p $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

On every deploy, `prisma migrate deploy` applies any pending migrations before the app starts. `$PORT` is injected by Railway.

### Build script

```json
"build": "prisma generate && next build"
```

`prisma generate` regenerates the client before `next build` so the compiled output includes fresh Prisma types.

### Infrastructure diagram

```
GitHub (main branch)
       │
       ▼ push triggers deploy
  Railway Build (Nixpacks)
  ┌─────────────────────────┐
  │  npm install            │
  │  prisma generate        │
  │  next build             │
  └────────────┬────────────┘
               │
       ▼ start
  Railway App Service          Railway PostgreSQL
  ┌──────────────────┐         ┌──────────────────┐
  │ prisma migrate   │────────▶│  migrations      │
  │ deploy           │         │  applied         │
  │                  │         └──────────────────┘
  │ next start       │◀────────  DATABASE_URL (env)
  └──────────────────┘
```

---

## 12. Testing Strategy

### Overview

| Layer | Tool | Count | Command |
|---|---|---|---|
| Unit tests | Vitest 4.x | 53 tests | `npm test` |
| E2E tests | Playwright | 22 specs | `npm run test:e2e` |
| Manual tests | — | 8 cases | See test-plan.xlsx |
| Coverage | Vitest + v8 | — | `npm run test:coverage` |
| Test plan | SheetJS | 82 total | `npm run test:plan` |

### Unit tests (Vitest)

**Config:** `vitest.config.ts`
- Environment: `node` (not jsdom — API routes run in Node)
- Globals enabled: `describe`, `it`, `expect`, `vi` available without imports
- `@/` alias resolves to `src/`
- Setup file: `tests/unit/setup.ts`

**Setup file** (`tests/unit/setup.ts`):
- Sets all required `process.env` variables before any test module loads
- Calls `vi.clearAllMocks()` in `beforeEach` — ensures no mock state leaks between tests
- Silences `console.error` globally (error-path tests log expected errors)

**Mocking patterns:**

```typescript
// Prisma — mock the entire module, control per-test with mockResolvedValue
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    session: { create: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
  },
}));

// Resend — must use vi.hoisted() + regular function (not arrow) for constructor
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null })
);
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

// Next.js server-only modules
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, NextResponse: actual.NextResponse };
});
```

**Coverage scope:** `src/lib/**` and `src/app/api/**` — the pure business logic and route handlers.

**Test files and coverage:**

| File | Tests | Covers |
|---|---|---|
| `lib/tokens.test.ts` | 2 | `generateToken()` |
| `lib/auth.test.ts` | 10 | `verifyJwt`, `sessionCookieOptions`, `createSession` |
| `lib/email.test.ts` | 8 | `sendVerificationEmail`, `sendPasswordResetEmail` |
| `api/register.test.ts` | 7 | Register route (validation, duplicate, success) |
| `api/login.test.ts` | 6 | Login route (credentials, unverified, success + cookie) |
| `api/logout.test.ts` | 4 | Logout route (session delete, cookie clear, graceful failure) |
| `api/verify-email.test.ts` | 4 | Verify email route (missing token, unknown, success, idempotent) |
| `api/forgot-password.test.ts` | 4 | Forgot password (existing user, non-existent, validation, token stored) |
| `api/reset-password.test.ts` | 5 | Reset password (valid, expired, unknown, sessions deleted) |
| `api/me.test.ts` | 3 | /api/me (authenticated, unauthenticated, no password in response) |

### E2E tests (Playwright)

**Config:** `playwright.config.ts`
- Base URL: `http://localhost:3000` (or `BASE_URL` env override for production)
- Browser: Chromium (Desktop Chrome)
- Serial execution (`fullyParallel: false`) — auth flows share state
- Retries: 2 on CI, 0 locally
- Reports: HTML report + list reporter; trace + screenshot on failure
- `globalSetup`: seeds the database before any spec runs

**Global setup** (`tests/e2e/global-setup.ts`):
- Runs `npx prisma db seed` before tests
- Seed creates/updates `test@example.com` / `TestPassword123!` (verified account)

**Test user:**
```
Email:    test@example.com
Password: TestPassword123!
Name:     Test User
Status:   emailVerified = true
```

**Spec files:**

| File | Specs | Covers |
|---|---|---|
| `navigation.spec.ts` | 4 | Homepage, nav links, language switcher, logo |
| `auth.spec.ts` | 10 | Register (form, validation, duplicate, success), Login (errors, success), Logout |
| `members.spec.ts` | 5 | Auth guard redirect, access, welcome banner, cards, German locale |

**Running E2E tests:**
```bash
# Against local dev server (auto-started)
npm run test:e2e

# Against production deployment
BASE_URL=https://member-website-production.up.railway.app npm run test:e2e

# With UI mode (interactive)
npm run test:e2e:ui
```

### Test plan (Excel)

`npm run test:plan` generates `tests/test-plan.xlsx` via SheetJS with three sheets:

| Sheet | Cases |
|---|---|
| Unit Tests | 52 |
| E2E Tests | 22 |
| Manual Tests | 8 |
| **Total** | **82** |

Each row: ID, Feature, Test Case, Expected Result, Priority, Type, Status.

### Manual tests

Scenarios that cannot be automated (require real email inbox):

| ID | Scenario |
|---|---|
| MT-01 | Registration email delivered to inbox |
| MT-02 | Email verification link opens success page |
| MT-03 | Forgot-password email delivered |
| MT-04 | Password reset link works end-to-end |
| MT-05 | Session expires after 7 days |
| MT-06 | Tampered cookie rejected |
| MT-07 | Registration email locale matches registration locale |
| MT-08 | Resend verification email button works |

---

## 13. Key Architectural Decisions & Gotchas

### Never call Prisma in async Server Components (React 19)

React 19's streaming SSR treats any `Promise`-like object that has a `.then()` method as a Suspense thenable. Prisma's `PrismaPromise` qualifies, so awaiting it inside an `async` Server Component crashes with:

```
Error: Expected a suspended thenable
```

**Rule**: All database access must go through `/api/*` route handlers. Server Components render static structure only. Client Components fetch dynamic data via `fetch("/api/...")` in `useEffect`.

### UserNav lives in a shared layout — it never remounts

The Header (containing UserNav) is rendered once in `[locale]/layout.tsx` and persists across all navigations. A `useEffect` with `[]` dependency would only run on the very first page load — if that's the login page, the cookie doesn't exist yet, so the user would appear logged out even after successful login.

**Fix**: `usePathname` as `useEffect` dependency → re-fetches `/api/me` on every route change.

### Middleware is JWT-only (no DB)

The middleware runs on the Edge runtime where Prisma cannot connect. Auth guard in middleware only verifies the JWT signature — it does not check the database Session record. Full session validation (including expiry check against DB) happens in `getCurrentUser()` inside API routes.

### Zod v4 API change

Zod v4 uses `error.issues` to access validation errors. The old Zod v3 `error.errors` property does not exist in v4. All routes use:

```typescript
return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
```

### Module-level constants in email.ts

`BASE_URL` in `src/lib/email.ts` is captured at module import time:

```typescript
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
```

Changing `process.env.NEXT_PUBLIC_BASE_URL` in a test body after import has no effect. Unit tests for URL content assert against **relative path substrings** rather than full URLs:

```typescript
expect(html).toContain("/en/auth/verify-email?token=mytoken");
```

### Vitest 4.x mock hoisting

`vi.mock()` calls are hoisted by Vitest before variable declarations. A `const mockFn = vi.fn()` defined before `vi.mock()` in source is `undefined` inside the mock factory. Use `vi.hoisted()`:

```typescript
const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue(...));
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {   // regular function, not arrow
    return { emails: { send: mockSend } };
  }),
}));
```

Arrow functions cannot be constructors — `new ArrowFn()` throws. Mock classes must use regular `function`.

### package-lock.json is gitignored

The lock file generated on Windows uses CRLF and Windows paths, which causes Nixpacks (Linux) to fail. The repo contains no lock file; `npm install` regenerates it on every Railway build.
