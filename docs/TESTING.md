# Verification evidence

Verified locally on Windows, Node 24, Chromium, and the dedicated hosted Supabase project. Date: 2026-10-29 (Asia/Manila). Tests use disposable accounts with reserved example.com addresses and never send private user archives to external AI services.

## Automated results

- `npm test`: **6 passing**. Required fields and real calendar dates; UUIDs and safe redirects; file signature, MIME and size; password whitespace; TAR checksum/alignment and long photo paths.
- `npm run typecheck`: passing after final source changes.
- `npm run lint`: passing with ESLint 10.13.0.
- `npm run build`: **passing** from a clean temporary copy after `npm ci`, using the final source and lockfile. OneDrive locked the workspace's old generated `.next` output. No source files were removed; verification used `C:\Users\Ezian\AppData\Local\Temp\memochro-verify-4f28cc9b52814a2d9773c3e3bef0dcf6` outside sync.
- Full Playwright run: **7 passing, 1 intentionally skipped**, 3.2 minutes against the running application and hosted Supabase. The skipped test permanently deletes its fixture account and is opt-in.
- The opt-in account deletion test was run separately with `TEST_ACCOUNT_DELETION=1`: **1 passing**, 13.4 seconds. Incorrect password is rejected; correct password removes active user data and Storage objects; old credentials no longer validate.

The seven regular browser cases verify signed-out route protection and expired callback handling; memory CRUD with a photo larger than Vercel's form-body limit; refresh persistence, photo caption, full-size viewer, favorites, search, associations, story saving, original-photo export and safe deletion; direct two-account database/Storage isolation; six responsive widths and themes/reduced motion; preservation of a selected person beyond the first 500 options; duplicate uploads from two tabs; preservation of text after failed saves.

Hosted smoke evidence: owner browser signed in to the protected staging build, opened Home, created a real text memory, and reloaded its detail URL with the saved text intact. Anonymous requests to both the alias and immutable URL redirect to Vercel SSO. Hosted file-picker automation was blocked by the extension's local-file permission; that extra permission was left disabled. The source, UI and records were not replaced with a mock to bypass the test. Stale password AMR was separately rejected by the account-deletion function in a rolled-back SQL assertion. All 12 exposed user tables were confirmed RLS-enabled and the media bucket confirmed private.

## Regression evidence

Tests exposed a TAR path-length failure, a password-confirmed deletion SQL variable collision, and React action forms resetting on validation errors. Each was reproduced and fixed. The independent code review identified duplicate-photo finalization cleanup and incomplete lookup options; the final code retains failed upload paths safely and fetches selected records beyond bounded options. Export join pagination now uses a unique parent/child order.

## Reproduce browser tests

Provision two disposable, email-confirmed test accounts in a dedicated project. For deletion, provision a third account that can be destroyed. Save `.env.test.local` as an ignored JSON array:

```json
[
  {"id":"ACCOUNT_UUID","email":"YOUR_TEST_EMAIL","password":"YOUR_TEST_PASSWORD"},
  {"id":"SECOND_UUID","email":"YOUR_SECOND_TEST_EMAIL","password":"YOUR_SECOND_TEST_PASSWORD"},
  {"id":"DISPOSABLE_UUID","email":"YOUR_DISPOSABLE_EMAIL","password":"YOUR_DISPOSABLE_PASSWORD"}
]
```

```powershell
npx playwright install chromium
npm run dev -- --port 3001
# In another terminal:
$env:TEST_BASE_URL='http://127.0.0.1:3001'
npm run test:e2e
# Only with a fresh, disposable third account:
$env:TEST_ACCOUNT_DELETION='1'
npm run test:e2e -- --grep 'account deletion requires'
```

The tests create and remove their own fixture records. Keep QA accounts out of production archives. `.env.test.local`, screenshots, traces and downloaded archives are ignored and excluded from deployment. Traces can contain session data and must be treated as sensitive.

## Visual and motion evidence

Browser checks ran at **360, 390, 768, 1024, 1366 and 1440px**, visiting all six destinations and the memory editor, asserting no horizontal overflow. Mobile navigation opens and routes correctly. Dark/light mode persists across reload. Reduced motion removes the print-stack transform. Full-page Home screenshots were captured and inspected at desktop/mobile sizes.

## Boundaries of this evidence

Email-confirmation and password-recovery inbox delivery have not been verified with production SMTP. Registration form validation and callback error handling are tested; this is not proof that emails reach an inbox. Manual screen-reader sessions, Safari/Firefox, exhaustive large-archive load tests, deliberate network-failure injection and a penetration test were not performed. No numeric frame-rate or Core Web Vitals claim is made.

Exports stream original photos one at a time but assemble record metadata in memory. The export is not a transactionally consistent database snapshot if the archive is edited during export; avoid editing during a backup. Very large exports remain bounded by hosting execution time.
