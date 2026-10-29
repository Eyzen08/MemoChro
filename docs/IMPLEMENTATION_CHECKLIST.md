# Implementation and release status

Status as of 2026-10-29. This is an initial working implementation; **not a declaration of 100% production readiness**.

| Phase | Implemented | Verification / remaining gate |
|---|---|---|
| 0 Audit | Empty workspace, tools, service accounts and risks inspected | Audit and supplied requirements saved |
| 1 Foundation | Next/React/TypeScript, Git, package lock, checks, schema | Local checks and hosted migrations verified |
| 2 Visual foundation | Six routes, dark/light themes, responsive shell, empty states, CSS 3D | Six-width browser checks, screenshots and reduced motion verified |
| 3 Auth/privacy | Signup/login/logout/recovery callback, protected routes, owner RLS and private bucket | Login and isolation verified; production verification/recovery mail remains unverified |
| 4 Memories/media | CRUD, favorites, captions, direct private uploads, validated previews, originals | Real 5+ MiB photo and refresh persistence verified |
| 5 Discovery | Database search, filters, ordering and 18-item pages | Search/favorites exercised; exhaustive every-filter permutations remain |
| 6 Albums/stories | Owned associations, safe deletion, draft/saved states, reading view, covers | Browser creation, story text, links and safe album deletion verified |
| 7 Places/people | CRUD, optional coordinates, memory filters and associations | Live creation/associations and 501-person regression verified |
| 8 Account | Profile, password change code, originals+records export and confirmed deletion | Export and account deletion verified; recovery-delivered password change requires SMTP |
| 9 QA/refinement | Unit/integration/browser checks, review fixes, security headers and previews | No full assistive-tech audit, broad device matrix or production load test |
| 10 Deployment | Dedicated Supabase and Vercel projects provisioned; deployment being verified | Record actual URL/build state in DEPLOYMENT.md; public launch gated below |

## Launch prerequisites

1. Configure a verified SMTP sender and test signup confirmation and password recovery end to end.
2. Set exact production origin and redirect allowlist. Retain deployment protection on preview environments.
3. Finalize operator contact information, jurisdiction, backup retention and privacy/terms drafts.
4. Review Supabase password policy, leaked-password protection availability, abuse controls, logging and backup/recovery procedures.
5. Execute hosted browser smoke tests and record deployment logs. Do not call an untested URL production-ready.

## Known limits

- Abandoned upload files remain private until their memory or account is deleted; no scheduled orphan collector is installed. Failure cleanup deliberately never deletes files another finalizer might still need.
- The editor offers 500 recent memories and 500 options per lookup, while preserving all existing selections. A searchable association picker is the next upgrade for larger archives.
- Signed image links expire after five minutes; refresh the page to obtain new links during long viewing sessions.
- Very large exports can hit hosting time limits and are not snapshot-consistent during simultaneous edits.
- No video, sharing, map provider, AI, contact import or facial recognition is implemented; these are later-version scope.
- Motion uses selected CSS perspective effects, not a heavy 3D renderer. More elaborate detail morphs and continuous frame-rate profiling were not completed.

An external provisioning dependency does not count as a passing phase gate. Auth email delivery, complete production hardening and public launch remain explicitly open until verified.
