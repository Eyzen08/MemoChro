# Security and privacy

## Enforcement

All 12 user-owned tables enable RLS. Owner policies use both USING and WITH CHECK. Composite `(id,user_id)` foreign keys reject cross-owner places, media, albums, people, tags and story connections. Exposed tables explicitly revoke anonymous grants. Server actions independently validate authentication and input. Raw user metadata is used only for display, never authorization. React renders stories as plain text, not injected HTML.

`requireUser()` verifies the account with Supabase `getUser()`, cached only within a server render. Proxy refreshes session cookies and marks responses private/no-store. Callback paths allow only known local archive destinations. Server Action origin protection is supplied by Next.js. Security headers deny framing, disable MIME sniffing and unnecessary device permissions, and use same-origin referrers.

The client has only a publishable key. There is no browser or server service-role credential in this implementation. Environment and test files are ignored by Git and excluded from deployment uploads.

## Media

The `memory-media` bucket is private. Storage requires an owner-prefixed path and an owned memory. Browser uploads use authenticated Storage requests, so they are not constrained by Vercel's form-body limit. The server downloads the uploaded object, validates actual signature, size and content hash, and decodes it with Sharp under a 40-million-pixel limit. Previews are resized to at most 1200 pixels and strip metadata; originals are unchanged. Private originals and previews use five-minute signed read links. A recipient with a signed link can read it until expiry; a downloaded copy cannot be revoked.

Content-addressed paths and conflict-ignore inserts make retries idempotent. Failure retains uploaded files so a concurrent successful finalizer is never damaged. Incomplete files remain private inside their memory folder; deleting that memory or the account removes them. Memory deletion marks the record as deleting, denies subsequent uploads and sweeps the entire folder, including files without metadata. Interrupted deletions can be retried.

There is no scheduled stale-upload collector. An abandoned upload to an otherwise retained memory consumes storage until that memory/account is deleted. Do not advertise perfect background cleanup or end-to-end encryption.

## Account deletion

The action verifies the current password and removes every Storage folder for the authenticated owner, including unregistered uploads. It then calls `delete_own_account()`. The database function checks a verified password AMR timestamp within five minutes, checks that no owned storage objects remain, and deletes only `auth.uid()` from `auth.users`. Cascading foreign keys remove active account data. No caller-supplied account ID is accepted.

This is the one intentionally elevated SECURITY DEFINER function; its search path is empty, all object references are qualified and anonymous/public execute grants are revoked. Supabase's authenticated-definer advisor warning is therefore expected and reviewed. The other function calls use SECURITY INVOKER.

Failure leaves the account available for retry, although already confirmed media deletion is irreversible. Existing access tokens are not magically erased from other devices; `getUser()` rejects a deleted account, remaining records are gone, and Storage inserts require an existing owned memory. Previously downloaded content remains outside the service's control. Backup retention must be finalized with the operator before launch.

## Verified and outstanding

Live tests verified separate users cannot read/update another user's memory, reassign ownership, attach another user's memory to an album, obtain another user's signed photo URL, or download it. Anonymous database access was rejected. Password-confirmed account deletion and media removal were exercised with a disposable account.

Production must configure and test SMTP, verification/recovery delivery, password policy, leaked-password protection if supported by the account plan, abuse controls, monitoring and recovery. There is no measured application-level per-user rate limiter or penetration-test claim. Privacy and terms pages are explicitly initial drafts awaiting operator information and retention policy.

Advisor references: [intentional elevated-function warning](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
