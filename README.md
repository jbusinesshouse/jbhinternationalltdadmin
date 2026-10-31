# JBH International Limited — Admin panel

Internal operations panel for the J Business House marketplace (the Expo app in `../j-business-house`).

All data goes through the Express BFF (`../backend`, `/api/v1/admin/*`). This app only uses Supabase for
sign-in; the database is locked down to the backend's service role.

## Setup

1. **Database** — run `j-business-house/supabase/migrations/20261012_admin_panel.sql` in the Supabase SQL editor.
   It adds the `admin_audit_logs` table, report review columns, and the `admin_set_store_type` RPC.
2. **Backend** — in `backend/.env`:
   - `ADMIN_USER_IDS=<uuid>,<uuid>` — Supabase auth user IDs allowed into the panel.
   - `CORS_ORIGINS` must include this app's origin (`http://localhost:3001` locally, the production admin URL when deployed).
3. **This app** — copy `.env.local.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:4000/api/v1`)

```bash
npm install
npm run dev   # http://localhost:3001
```

Sign in with the email/password of a Supabase user listed in `ADMIN_USER_IDS`.

## Sections

| Area | What it does |
| --- | --- |
| Overview | Pending queues, KPIs, 30-day signups/orders, latest activity |
| Users | Search/filter, activate new wholesale sellers, freeze/restrict, change store type, message, feature store |
| Products / Orders | Browse and inspect; deactivate, reactivate or delete products |
| Product ads / Featured stores | Approve requests, stop running ads, feature or unfeature stores |
| Referrals | Creator applications and referral codes with signup counts |
| Reports / Support | Moderate reported products and users; reply to support tickets (sent as notifications) |
| Catalog | Categories, subcategories and size options used by product upload |
| Notifications | Broadcast in-app + push notifications to user segments |
| Audit log | Every admin write action |
