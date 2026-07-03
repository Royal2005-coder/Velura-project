# Velura — Modern Fashion E-Commerce Platform

Velura is a modern fashion e-commerce platform built as a workspace monorepo. It features a responsive customer-facing storefront, a comprehensive admin back-office, a secure Node.js HTTP backend API, and a Supabase/PostgreSQL database with transactional integrity and strict row-level security.

---

## 📂 Monorepo Architecture

```text
Velura-project/
├── apps/
│   ├── api/             # Secure Node.js HTTP API (User and Admin endpoints)
│   └── user-web/        # Customer-facing storefront (Vite + HTML inject + ESM Modules)
├── database/
│   ├── database_user/   # User backend schemas, seed data & permissions
│   └── fix_rls_for_api.sql
├── docs/
│   └── user/            # User-flow business rules & process flows
├── scripts/             # Verification and database maintenance scripts
├── tests/               # E2E Playwright test suite
├── package.json
└── vite.config.js       # Admin panel dev config
```

---

## 🛠️ Tech Stack & Services

- **Frontend Customer Web:** HTML5, CSS Grid/Flexbox, ES Modules, Vite (running on port `3000`)
- **Backend Service:** Node.js HTTP REST API server with custom JWT Auth, OTP verification, and CORS integration (running on port `8787`)
- **Database Layer:** Supabase PostgreSQL with custom functions and RLS policies
- **End-to-End Testing:** Playwright test framework for automated browser flows
- **CI/CD Integration:** GitHub Actions for builds, syntax checks, and deployments

---

## 🚀 Local Development Setup

### 1. Prerequisites & Dependencies
Install the package dependencies from the monorepo root:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root workspace and populate your credentials (e.g. Supabase credentials, API URLs, VNPAY/MOMO callback setups):
```bash
copy .env.example .env
```

### 3. Run the Development Servers
Start both the customer storefront and the backend API server concurrently:
* **Customer Storefront:**
  ```bash
  npm run dev
  # URL: http://localhost:3000
  ```
* **Backend API Server:**
  ```bash
  npm run api:dev
  # URL: http://localhost:8787
  # Healthcheck: http://localhost:8787/health
  ```

---

## 🔬 E2E & Integration Verification

We have implemented an automated integration suite to verify checkout, stock allocation, and order cancel lifecycles.

### Run Checkout & Cancellation Lifecycle Test
This script automatically generates a new member account, completes an OTP handshake, places a COD order, verifies variant stock decrement, fetches order history, cancels the order, and verifies that the stock is restored.
```bash
node scripts/verify-lifecycle.js
```

### Run Playwright E2E Tests
To run automated E2E browser tests:
```bash
npx playwright test
```

---

## 🔑 Core Features & API Endpoints

### User & Authentication Flow
- **Registration & Recovery:** OTP verification on signup/reset passwords.
  - `POST /api/user/auth/signup` -> Requests OTP
  - `POST /api/user/auth/otp-verify` -> Authenticates and returns JWT
  - `POST /api/user/auth/otp-send` -> Triggers OTP (dev console printed)
  - `POST /api/user/auth/reset-password` -> Sets new password

### Order & Inventory Lifecycle
- **Stock Decrements:** Performed atomically during order checkout (`POST /api/user/orders`).
- **Stock Restoration:** Automatically triggered on cancellation (`PATCH /api/user/orders` status set to `"cancelled"`).
- **Guest Order Tracking:** Allowed via tracking code/UUID validation (`GET /api/user/orders/:id`).

### Personalized Styling & Wishlists
- **Wishlist:** Managed as a JSONB column (`wishlist`) inside the user table with full addition/removal API endpoints.
- **Style Quiz:** Collects metrics (weight, height, shape) and returns fashion suggestions based on style tagging.

---

## 📝 Team Guidelines
1. **Secrets Security:** Never commit `.env` or service keys to git.
2. **Migrations:** Keep database changes organized under `database/`.
3. **Verify Before Push:** Always run the lifecycle test script (`node scripts/verify-lifecycle.js`) before pushing to target branches.
4. **Git Workflow:** PRs go to `develop` for testing and staging verification before merging to `main`.
