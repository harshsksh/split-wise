## ExpenseSplitter — Production‑Ready Expense Sharing App

Modern split-expense platform built with Next.js 15, React 19, Prisma, and MongoDB. Designed for clarity, correctness, and real‑world usability: create groups, add expenses, split fairly (equal or custom), and settle optimally.

### Why this project matters
- Proven end‑to‑end delivery: database schema, secure auth, API, and UI in one repo
- Production concerns addressed: data modeling, security, performance, and DX
- Code you can ship: consistent types, clear boundaries, and maintainable modules

### Demo & Screens
- Live demo: add your deployment URL here
- Test user: add a seeded user or quick registration
- Screenshots: add 2–3 PNGs (Dashboard, Add Expense, Settlements)

---

## Highlights
- Authentication with JWT (httpOnly cookie), bcrypt password hashing
- Group ledger with expense splits and optimized settlement suggestions
- Clean API routes under `app/api/*` with input validation and error handling
- Prisma data layer targeting MongoDB with clear, normalized relations
- Responsive UI with Tailwind; accessible forms and keyboard‑friendly flows

---

## Architecture at a glance
- UI: Next.js App Router, server components for data fetching, client components for interactivity
- API: Route handlers in `app/api/*` (auth, groups, expenses, settlements, users)
- Data: Prisma `schema.prisma` models (`User`, `Group`, `Expense`, `ExpenseSplit`, `Settlement`, `Friend`)
- Auth: `app/lib/auth.ts` for JWT sign/verify, secure cookie options, guards on routes
- State: Lightweight React context for user session where needed

Key files to review:
- `app/lib/auth.ts` — JWT secrets, signing, cookie settings
- `app/api/auth/*` — login, register, me, logout
- `app/api/groups/[id]/*` — debts, net balances, optimal settlements
- `app/lib/settlementUtils.ts` — calculation helpers
- `prisma/schema.prisma` — database schema and relations

---

## Run locally (5 minutes)
Prereqs: Node 18+, MongoDB (local or Atlas)

1) Install
```bash
npm install
```

2) Environment
Create `.env` in the project root:
```env
DATABASE_URL="mongodb://127.0.0.1:27017/expensesplitter"
JWT_SECRET="<generate a long random string>"
```

3) Prisma
```bash
npx prisma generate
npx prisma db push
```

4) Start
```bash
npm run dev
```
Open http://localhost:3000

---

## Implementation notes recruiters care about
- Security: httpOnly cookies, strict JWT secret checks, bcrypt hashing, minimal error leakage
- Data integrity: unique constraints (e.g., user-group membership), cascading deletes where safe
- Performance: server‑side data fetching for critical screens, lean payloads, early returns for errors
- Maintainability: typed helpers, separation of concerns, predictable folder layout

---

## Selected endpoints
- `POST /api/auth/register` — create user (hashed password)
- `POST /api/auth/login` — issue JWT, set cookie
- `GET /api/auth/me` — resolve current user
- `GET/POST /api/groups` — list/create groups
- `GET/POST /api/expenses` — list/create expenses with splits
- `GET/POST /api/settlements` — list/create settlements; PATCH to update

---

## Roadmap (next iterations)
- Multi‑currency support and FX normalization
- Attach receipts and run OCR for amounts
- Notifications for due settlements
- Role‑based access for group admins

---

## About the author
I build pragmatic, production‑ready web apps with a focus on DX, security, and maintainability. If you want someone who ships reliable features fast and keeps the codebase clean, this is how I work.

Contact: add your email • add your LinkedIn
