# MemoChro

**Your life, through time.** A private personal archive built from the supplied master plan. This repository contains a functioning initial application, not sample data or a static mockup. Production release is gated on the remaining checks in [the implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md).

## Run locally

Node 24 and npm are recommended.

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill the three variables below from your dedicated Supabase project.
npm run dev
```

Open http://127.0.0.1:3000. Never commit `.env.local` or test credentials.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable client key, secured by RLS; never a service key |
| `NEXT_PUBLIC_SITE_URL` | Exact application origin for email callbacks; localhost during development |

Apply the checked-in migrations in order to a fresh Supabase project. Configure email confirmation, a production SMTP sender, Site URL and allowed callback URLs. Keep `memory-media` private. Existing environments must apply new migrations rather than rebuilding tables.

## What works

- Home, Timeline, Memories, Albums, Stories and Places, with server-backed results and honest empty states.
- Email/password authentication, confirmation and recovery callback code, sign-out and password settings. Actual mail delivery needs configured SMTP.
- Memory creation, editing, viewing, favorites, tags, people, places, albums and photo captions.
- Direct authenticated private photo uploads, up to four at a time and 10 MiB each; server format/hash/size checks and decoded previews. Originals are preserved. Extremely large decoded images above 40 million pixels are rejected.
- Database search, practical filters, date ordering and 18-item result pages.
- Albums and stories with owned associations; drafts and reading views; deletion keeps underlying memories.
- Place/people management, profile editing, complete records-and-original-photo TAR export and password-confirmed account deletion.
- Dark/light themes, a composed CSS 3D print stack, pointer tilt, full-size photo viewer, keyboard controls and reduced-motion fallback.

## Checks

```powershell
npm test
npm run typecheck
npm run lint
npm run build
```

Browser tests require explicitly provisioned disposable test accounts; see [TESTING](docs/TESTING.md). Never run destructive QA against a real archive.

## Architecture and handover

Next.js App Router and strict TypeScript; React; Supabase Auth, PostgreSQL and private Storage; native CSS and Lucide; Sharp for private previews. Sensitive operations stay on the server, with owner RLS and composite foreign keys as database enforcement. No service-role key is needed by this application.

- [Requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Audit and architecture](docs/ARCHITECTURE.md)
- [Schema and ERD](docs/DATABASE_SCHEMA.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Motion and 3D](docs/MOTION_AND_3D.md)
- [Testing and evidence](docs/TESTING.md)
- [Deployment and recovery](docs/DEPLOYMENT.md)
- [Implementation status and known limitations](docs/IMPLEMENTATION_CHECKLIST.md)

No AI analysis, public sharing, facial recognition, contact importing, video pipeline or map service is included in Version 1.
