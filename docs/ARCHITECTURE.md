# MemoChro architecture and Phase 0 audit

Audit date: 2026-10-28 (Asia/Manila).

## Existing state
The workspace was empty, without Git, application files, dependencies, environment files, migrations, tests, or deployment configuration. Node 24.18.1 and npm 11.16.0 are available. PostgreSQL client exists; Docker and Supabase CLI are not installed. Connected Supabase accounts expose the same two unrelated projects; neither is MemoChro. Vercel has no project matching MemoChro. No existing behavior can be tested or declared broken.

## Decision and scope
Build the specified private life archive using Next.js App Router, strict TypeScript, React, Supabase Auth/Postgres/private Storage, native CSS, and Lucide icons. Use server actions for mutations and a server-only data layer. Supabase SSR cookies maintain sessions; protected pages validate users on the server. No service key enters the client. No sample memories stand in for persistence.

Alternatives considered: a browser-only local archive cannot meet real authentication or ownership requirements; custom authentication duplicates established security machinery. The requested Supabase stack is appropriate. A dedicated project was selected by the user; organization selection and provisioning remain external dependencies.

## Boundaries
- `src/app`: routes, layouts, server actions, auth callbacks, export.
- `src/lib`: validation, server auth/client, owned database queries.
- `src/components`: navigation, archive presentation, editors, dialogs and motion.
- `supabase/migrations`: reviewable database and storage setup.
- `tests`: validation, browser workflows and ownership checks.

## Design
Charcoal #070606, surface #1A1A1A, paper #F4EFE8, text #FAF9FA, copper #9D7961. Warm paper light mode. Readable sans UI with editorial serif headings. A left navigation rail preserves exactly Home, Timeline, Memories, Albums, Stories, Places; account settings stay secondary. Photography belongs to actual saved memories. Empty states invite a first entry. Public brand artwork is decorative and never represented as a user memory.

## Motion
CSS perspective for a composed print stack and pointer tilt on suitable devices. 180ms controls, 320ms panels, 600ms introduction. No WebGL dependency. Fine-pointer capability and reduced-motion preferences gate decorative movement. All content and actions remain accessible without movement.

## Privacy risks
RLS omissions, cross-owner relationship IDs, ownership reassignment, public media buckets, overlong signed URLs, stale sessions, upload/metadata partial failure, unsafe redirects, export leakage, and incomplete account deletion. Require database policies, composite owner FKs, private storage paths, server validation, origin checks and explicit destructive confirmations. Do not claim end-to-end encryption. Production needs verified SMTP, rate limits, recovery and backups.

## Acceptance sequence
0. Record requirements, audit, decisions and schema.
1. Foundation: reproducible install, strict typecheck, lint, tests, build.
2. Responsive shell/design: six routes, themes, keyboard, empty states and reduced motion.
3. Auth/privacy: registration/login/recovery; two independent accounts; direct database and media isolation.
4. Memories/media: create/edit/delete/favorite, validated private upload and persistence after refresh.
5. Discovery: database search, filters, date order and bounded pages.
6. Albums/stories: owned associations, drafts, editing and safe deletion.
7. Places/people: owned CRUD, lookup and safe unlinking.
8. Account: profile, export and deletion with reauthentication and media cleanup.
9. QA: browser, responsive widths, security and performance review.
10. Deployment: production config, smoke tests, logs and handover.

Track authored, tested and deployed separately. A blocked external gate is not a passing phase.

## Read-only sample archive

`src/lib/sample-archive.ts` contains six memories, two albums, one story, two places and three fictional people. `/demo` redirects to `/demo/home`; its section and detail pages use this module alone. The proxy skips Supabase session work for demo routes. Shared `ArchiveShell`, `Navigation`, `MemoryGrid`/`MemoryCard` and `PhotoGallery` accept explicit demo presentation options. No sample record is seeded or mixed into private queries, exports, counts or search. Private authentication still runs in `(archive)/layout.tsx`, and server mutations still authenticate independently.

The memory editor owns a `File[]`; native file input state is cleared after selection. Click/drop append validated selections, thumbnails revoke object URLs on removal/unmount, and uploads remove a selection only after its finalizer succeeds (or the content hash already exists). A stable editing-session UUID survives server revalidation, preserving retry deduplication after partial saves. Dirty checks compare current form values with the initial snapshot and warn on ordinary links and browser unload; native history is untouched. No device content storage, autosave or drafts were added.
