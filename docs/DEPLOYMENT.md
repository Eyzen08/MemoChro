# Deployment, operations and recovery

## Provisioned resources

- Supabase project: **MemoChro**, reference `lslugvluxmhnalulqowq`, Singapore (`ap-southeast-1`), in the organization explicitly selected by the user. Existing unrelated projects were left untouched.
- Vercel project: **memochro**, ID `prj_Z9pfNYt7U6ohFMMDcBGLAKntJJIM`, Node 24, Singapore functions. Default Vercel deployment protection is retained.
- Three reviewed migrations are checked in and applied: archive foundation, private previews and deletion guards/indexes.

## Protected preview delivered

- Preview: https://memochro-preview-eyzen08.vercel.app
- Immutable deployment: https://memochro-avcr9xkux-eyzen08s-projects.vercel.app
- Deployment ID: `dpl_5G9JXgXGZPPW2MwvW5DL1A7txquh`, target `staging`, state **READY**.
- Source commit: `9166680811a9e34273cb42a23610c847deff2428`.
- Private repository: https://github.com/Eyzen08/MemoChro, branch `codex/frontend-refinement`.

On 2026-10-29 the user explicitly selected **keep it as a protected preview**. No public production release or SMTP provisioning is required for this handover. The first Vercel request defaulted to production and was canceled before completion; the delivered build explicitly targets staging.

Anonymous HTTP requests to both preview URLs redirect to Vercel SSO, verifying deployment protection remains active. The owner's existing browser session opens the actual app. The connector's share-link fetch endpoint returned 403, so access was verified through the owner's existing browser session instead of weakening protection.

Supabase Site URL is the preview alias. Six exact confirmation/recovery callback URLs are allowlisted for that alias, localhost:3000 and 127.0.0.1:3000. There is no broad domain wildcard. SMTP remains a later public-launch prerequisite.

Hosted owner-browser smoke checks verified sign-in, authenticated Home, real memory creation and full reload persistence, then sign-out. The hosted photo chooser test was blocked by Chrome extension file-access permissions; no broader permission was enabled. The full local-browser upload workflow against hosted Supabase, including a 5+ MiB original and private preview generation, passed. Do not conflate that local browser check with a completed hosted photo smoke test.

The Vercel build reached READY. Detailed build-log API access returned a team-scope 403; no expanded permissions or protection bypass was requested. Logs can be reviewed through the owner's Vercel dashboard. The private repository contains the verified source and all migrations; deployment was from explicit source files, so automatic Git push deployment is not configured.

## Build and release

```powershell
npm ci
npm test
npm run lint
npm run typecheck
npm run build
```

Deploy the repository as a Next.js project on Vercel. Source uploads exclude `.env*`, test credentials, browser artifacts, local build output and user media. Production requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL`. A publishable key is intentionally usable by the client; never substitute a service-role or secret key.

Apply migrations to the dedicated Supabase project before deploying code that depends on new columns. Keep the bucket private. Set Auth Site URL to the intended app origin and allow exact callback URLs for the hosted app and local development. Never use a broad arbitrary-domain wildcard.

Configure a verified SMTP sender, email confirmation and recovery. Built-in development delivery is not a production email service. Test a full registration, confirmation, sign-out, recovery and password-change cycle in the hosted environment. Vercel preview access can require the owner's Vercel sign-in; this is separate from MemoChro account authentication.

## Smoke checks

Verify signed-out redirects, login/logout, create+upload+refresh, edit, timeline ordering, search/filter, album/story associations, places/people, themes, export, and deletion using dedicated disposable accounts. Verify separate accounts cannot read each other's rows or files. Inspect deployment and Supabase logs without printing credentials or personal memory text.

## Recovery

Keep an independently downloaded TAR export: `archive.json` holds owned records, and `photos/<memory-id>/<content-hash>.<extension>` holds unchanged originals. The JSON storage paths include the owner prefix; the TAR photo paths omit that prefix because exports contain only one owner. Derivative previews can be regenerated. There is no automatic import UI in V1.

An export is unencrypted. Protect it like the original archive. Do not edit the archive during an export. A failed/incomplete browser download is not a valid backup; verify it extracts and contains expected photographs.

Use Supabase backup/restore facilities appropriate to the selected plan, and test restoration in an isolated project. Backup retention and recovery objectives are operator decisions still pending. Do not delete or reset production tables to solve a migration error.

For a bad application release, restore the previous verified Vercel deployment. A code rollback does not roll back database changes: migrations are forward-only additions, and destructive changes require a backup and explicit migration plan.

## Frontend refinement preview — October 29

Source-only staging deployment `dpl_5G9JXgXGZPPW2MwvW5DL1A7txquh` reached READY. The existing preview alias now serves the refined interface and `/demo`. Anonymous `/demo` requests return a 302 to Vercel SSO. In the owner browser, demo navigation/search (one matching Sunday memory), memory detail, photograph modal/Escape, and private authentication/sign-out passed smoke checks. Screenshot proof is retained locally under ignored `test-results/hosted-refined-preview.png`. Hosted photo uploading remains unverified because of the existing extension file-access limitation; local browser upload/finalizer/isolation/partial-retry checks against hosted Supabase passed.

The public `memochro.vercel.app` and `memochro-git-main-eyzen08s-projects.vercel.app` aliases retain production deployment `dpl_3APAcnLFMHNhETxTJesYovzJFFfK`. Vercel automatically assigned its generic team alias to the staging build; that alias was restored to the same prior production deployment. Deployment protection, public site configuration, Supabase configuration and SMTP were not changed. No migrations were needed.

Previous protected preview for rollback: `dpl_FGjRGR2jvEGQuzMT9wCXEgu37KKx` (`memochro-82bp7l11q-eyzen08s-projects.vercel.app`). Roll back this revision by assigning only `memochro-preview-eyzen08.vercel.app` to that deployment.
