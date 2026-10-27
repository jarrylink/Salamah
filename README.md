# Salamah

School administration built with Next.js 16, React 19, TypeScript, Tailwind, Drizzle and Neon Postgres.

## Run locally

Use Node.js 24 or later for the TypeScript-based test scripts. Install dependencies with `npm ci`, configure `.env.local` with `DATABASE_URL` and `AUTH_SECRET`, then run `npm run dev`.

Keep environment files and account credentials private. Existing seed scripts contain demonstration accounts and data; do not run them against a live school database.

## Administration workflow

1. Open **Sessions & terms** and create the academic year. Three terms are created atomically. Configure their dates under **Academic terms**, then select the current session and term.
2. Under **Academic structure**, create sections, grades and classes. Link each grade to one section.
3. Create subjects and link them to school sections. Create a subject combination, add its members, then assign the combination to a class for a session. This copies its subjects into **Class subjects**. Manage class offerings there independently afterwards.
4. Under **People & accounts**, create a person, then their staff, teacher, student or guardian profile. Use **Student–guardian links** to connect families.
5. A Super Admin can create sign-in accounts, link them to profiles, reset passwords and suspend access. Teacher, student and guardian accounts require a matching active profile.
6. Create a student enrolment for each academic session. Previous placements are preserved; use statuses for withdrawal or completion. In-session class transfers are not yet a separate workflow.
7. Create teaching assignments for a class, subject, session and term. Teachers see their current assignments and can enter scores only within that scope.
8. Define assessment types, create assessments and open them for score entry. Enter individual scores from **Results & scores**, then close assessments to stop editing.
9. Record attendance against active enrolments. Use **Reports** for per-class activity counts.

## Other working modules

- Student invoices and payments, with outstanding balances derived from payments. Payment records are append-only and cannot exceed invoice balances.
- Inventory categories, locations, suppliers and items, with append-only stock receipts/issues. Stock issues cannot exceed available quantities.
- Scheduled notices, with audience and expiry controls. Student and guardian workspaces show only their linked enrolment records and relevant notices.

These are foundational workflows. Printed report cards, results approval/publication, refunds/voids, in-session transfer history, bulk imports and a full permissions-management system are not implemented.

## Access and data safeguards

The existing signed, HTTP-only, eight-hour session cookie remains in use. Every request checks the account's current status and role. Password changes invalidate earlier sessions; users must sign in again after the credential-signature update.

Account management is restricted to Super Admins. Other management modules are restricted to Admins and Super Admins. Teachers have assignment-scoped score entry. Existing Super Admin accounts cannot be demoted or suspended through these forms.

Forms validate on the server, show errors, and reject stale edits. Historical relationship fields are immutable. Assigned subject combinations are preserved; make a new combination when revising an assigned curriculum. Unassigned combination members can be removed.

Database access retains the existing Neon HTTP configuration. Multi-statement writes use the driver's HTTP transaction API rather than unsupported interactive Drizzle transactions. No schema migration is required for these screens when the existing migrations are already applied.

## Verification

- `npm run lint`
- `npm test` — validation, historical placement, amounts and calculation tests.
- `npm run build`
- `node --env-file=.env.local scripts/check-db.mjs` — read-only schema compatibility check.
- With the dev server running: `node scripts/smoke-http.mjs` — localhost-only, read-only route and rejected-action checks. It uses the same environment loading as Next.js and signs local test sessions without displaying credentials. Requires an existing active Super Admin. Roles without existing accounts are reported as skipped.

Test successful write workflows on an isolated Neon branch before production use. Do not repoint the project's database or run seed/reset scripts merely to test the interface.
