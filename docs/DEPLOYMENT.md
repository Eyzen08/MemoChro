# Deployment, operations and recovery

## Provisioned resources

- Supabase project: **MemoChro**, reference `lslugvluxmhnalulqowq`, Singapore (`ap-southeast-1`), in the organization explicitly selected by the user. Existing unrelated projects were left untouched.
- Vercel project: **memochro**, ID `prj_Z9pfNYt7U6ohFMMDcBGLAKntJJIM`, Node 24, Singapore functions. Default Vercel deployment protection is retained.
- Three reviewed migrations are checked in and applied: archive foundation, private previews and deletion guards/indexes.

Deployment status and the actual tested URL must be appended after the remote build completes. No production URL is claimed by this initial setup section.

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
