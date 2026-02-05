# Authentication System Redefinition - E2E Execution Guide

This document provides instructions for the Operator to verify the newly implemented authentication system using Playwright E2E tests.

## 1. Environment Variable Setup

The authentication system requires several environment variables for both local development and E2E testing. Create or update your `.dev.vars` file in the root directory with the following settings:

```bash
# Cloudflare Workers KV & D1 (for local dev)
SESSION_KV=local-dev-kv
DB=local-dev-db

# Session Secret (used by remix-auth)
SESSION_SECRET="your-local-secret-key"

# Google OAuth (Optional for E2E FormStrategy tests, but required for Google Strategy)
# GOOGLE_CLIENT_ID="your-client-id"
# GOOGLE_CLIENT_SECRET="your-client-secret"

# Stripe (Required for subscription features)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Legal Info (Used for Special Commercial Laws display)
LEGAL_PRIVATE_INFO="山田太郎|東京都渋谷区1-2-3|03-1234-5678"
```

## 2. Pre-requisites

Ensure you have the local environment built and the database initialized:

```bash
# Install dependencies
npm install

# Initialize local D1 database
npm run setup:db

# Build the application
npm run build
```

## 3. Running E2E Tests

The authentication tests are isolated in `tests/e2e/auth.spec.ts` to avoid noise from existing blog errors.

### Step 3.1: Start the Local Server
In one terminal, start the Wrangler development server:

```bash
# Start server on port 8791 (as configured in playwright.config.ts)
npx wrangler pages dev ./build/client --compatibility-date=2024-11-18 --compatibility-flags=nodejs_compat --d1 DB --kv SESSION_KV --port=8791 --persist-to .wrangler/state
```

### Step 3.2: Run Authentication Tests
In another terminal, execute the targeted E2E tests:

```bash
# Run only authentication and legal tests
npx playwright test tests/e2e/auth.spec.ts -c tests/e2e/playwright.config.ts --reporter=list
```

## 4. Test Scenarios Covered

The `tests/e2e/auth.spec.ts` file validates the following critical paths:

1.  **User Registration**: Success path and dashboard redirection.
2.  **User Login**: Success path with session persistence and failure path with error messaging.
3.  **Auth Guard**: Verification that protected routes (`/account`) redirect unauthenticated users.
4.  **User Logout**: Session destruction and cookie clearing.
5.  **Legal Compliance**: Accessibility of "特定商取引法" (via landing page modal), "利用規約", and "プライバシーポリシー".

## 5. Architectural Alignment Verification

The implementation strictly follows the "Library-Agnostic Principle":
- `remix-auth` is confined to the Side Effect layer (`data-io`).
- All external data is transformed via `authMapper.server.ts` before entering the Pure Logic layer or UI.
- KV is used for session lifecycle management, while D1 maintains user entities.
