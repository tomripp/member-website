# member-website

A full-stack membership website with authentication, bilingual content (EN/DE), and a protected members area — built with Next.js and deployed on Railway.

**Production:** https://member-website-production.up.railway.app/

> For a deep dive into the system design, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Features

- **Registration & email verification** — new accounts require email confirmation before login
- **Login / logout** — session-based auth via signed JWTs in httpOnly cookies
- **Password reset** — secure token-based flow with 1-hour expiry
- **Protected members area** — middleware enforces auth; unauthenticated requests redirect to login
- **Bilingual (EN / DE)** — full i18n via next-intl; registration and password reset emails respect the user's locale
- **Resend verification** — users can request a new verification email after registration

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui v3 |
| Auth | Custom JWT — bcryptjs + jose (no NextAuth) |
| ORM | Prisma 5 |
| Database | PostgreSQL (Railway) |
| Email | Resend API |
| i18n | next-intl (EN + DE) |
| Deployment | Railway + Nixpacks |

---

## Getting Started

### Prerequisites

- Node.js 20+
- A running PostgreSQL instance
- A [Resend](https://resend.com) account and API key

### 1. Clone and install

```bash
git clone https://github.com/tomripp/member-website.git
cd member-website
npm install
```

### 2. Configure environment

Copy the example and fill in your values:

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="your-secret-min-32-characters-long"
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="noreply@yourdomain.com"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app redirects to `/en/` by default.

---

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # All user-facing pages (en + de)
│   │   ├── page.tsx        # Homepage
│   │   ├── members/        # Protected member area
│   │   └── auth/           # Login, register, verify, forgot/reset password
│   └── api/                # REST API routes (not locale-prefixed)
│       ├── auth/           # register, login, logout, verify-email, forgot/reset-password
│       └── me/             # GET current user
├── components/
│   ├── layout/             # Header, Footer, UserNav, LanguageSwitcher
│   ├── auth/               # Form components (react-hook-form + zod)
│   └── members/            # WelcomeBanner (client, fetches /api/me)
├── lib/
│   ├── auth.ts             # JWT helpers, createSession, getCurrentUser
│   ├── db.ts               # Prisma singleton
│   ├── email.ts            # Resend email helpers
│   └── tokens.ts           # crypto token generator
└── i18n/
    ├── routing.ts          # Locales: ['en', 'de'], default: 'en'
    └── messages/           # en.json + de.json
```

---

## Authentication

Custom JWT auth — no NextAuth.

- Passwords hashed with **bcryptjs** (12 rounds)
- Sessions stored in the database; JWT carries `{ userId, sessionToken }`
- Cookie: `HttpOnly; SameSite=Lax; Secure (prod); Max-Age=7d`
- Middleware verifies JWT on every request to `/*/members` — no DB call needed at the edge
- Full session validation (DB lookup + expiry) happens inside API routes via `getCurrentUser()`

---

## API Reference

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account, send verification email |
| POST | `/api/auth/login` | Validate credentials, set session cookie |
| POST | `/api/auth/logout` | Delete session, clear cookie |
| GET | `/api/auth/verify-email?token=` | Verify email address |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Set new password via token |
| POST | `/api/auth/resend-verification` | Resend verification email |
| GET | `/api/me` | Return current user (401 if not authenticated) |

---

## Testing

### Unit tests

```bash
npm test                  # run all 53 unit tests
npm run test:watch        # watch mode
npm run test:coverage     # coverage report
```

Powered by **Vitest**. Tests cover all lib utilities and API route handlers with mocked Prisma and Resend.

### E2E tests

```bash
npm run test:e2e          # headless Chromium (auto-starts dev server)
npm run test:e2e:ui       # Playwright UI mode

# Against the production deployment:
BASE_URL=https://member-website-production.up.railway.app npm run test:e2e
```

Powered by **Playwright**. 22 specs covering navigation, i18n, full auth flows, and the members area. The global setup seeds a test user (`test@example.com` / `TestPassword123!`) before any spec runs.

### Test plan

```bash
npm run test:plan         # generates tests/test-plan.xlsx
```

Generates an Excel workbook with 82 test cases across Unit (52), E2E (22), and Manual (8) sheets.

---

## Deployment

The app deploys to **Railway** using Nixpacks (no Dockerfile required).

On every deploy:
1. Nixpacks runs `npm install` + `next build`
2. Railway starts the app with `npx prisma migrate deploy && npx next start -p $PORT`

Set the following environment variables in Railway:

```
DATABASE_URL        (auto-provided by Railway PostgreSQL service)
JWT_SECRET
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_BASE_URL
```

---

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation covering:

- Routing & i18n design
- Full auth flow sequences (register → verify → login → logout → reset)
- Middleware design (Edge-runtime JWT-only guard)
- Database schema and Prisma singleton pattern
- React 19 / Server Component constraints and how they're handled
- Testing strategy and mocking patterns
- Railway + Nixpacks deployment pipeline

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build (prisma generate + next build) |
| `npm run start` | Start production server |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |
| `npm run test:coverage` | Unit test coverage report |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run test:plan` | Generate tests/test-plan.xlsx |
| `npx prisma studio` | Open Prisma DB browser |
| `npx prisma db seed` | Seed test user |
