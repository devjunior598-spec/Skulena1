# Skulena

Skulena is a school discovery platform with secure parent and school workspaces. Phase 2 adds Supabase authentication, normalized data, storage policies, role-aware dashboards and resumable school onboarding while preserving the Phase 1 public experience.

## Run locally on this external workspace drive

This workspace is on a FAT filesystem, which cannot reliably support npm dependency symlinks. Use the portable runner; it mirrors source into a temporary folder on the Mac’s internal drive and keeps the workspace itself unchanged.

```bash
cd "/Volumes/TECH WORK/SKULENA"
cp .env.example .env.local
# Add your Supabase URL and publishable key to .env.local
npm run dev:portable
```

Open [http://localhost:3000](http://localhost:3000). The first run needs registry access. Node.js 20.19+ and macOS `rsync` are required.

Public discovery returns published school records only. If the database is unavailable or no schools have been published yet, the site displays an empty state rather than invented listings.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`; add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and the deployed `NEXT_PUBLIC_SITE_URL`.
3. Install the Supabase CLI, then run `supabase login`, `supabase link --project-ref <project-ref>`, and `supabase db push` from this directory.
4. In Authentication → URL Configuration, set the Site URL and add local and production `/auth/callback` redirect URLs.
5. Keep email confirmation enabled in production. Do not add a service-role key to this application.
6. After creating the first account, use the Supabase SQL Editor once to promote it to `super_admin` (the application never permits self-assignment):

   ```sql
   begin;
   select set_config('app.allow_role_change', '1', true);
   update public.profiles
   set role = 'super_admin'
   where id = '<first-auth-user-uuid>';
   commit;
   ```

   This is an administrative setup action, not an application workflow. All future role changes must go through the guarded `assign_platform_role` RPC.
7. Run `supabase start` followed by `supabase test db` against a disposable local database to execute `supabase/tests/database/rls.sql`.

The migrations create private `school-media` and `school-documents` buckets. The application uses database metadata plus storage policies rather than raw media URLs. See [Phase 2 setup notes](docs/phase-2.md).

## Quality checks

```bash
npm test
npm run lint:portable
npm run typecheck:portable
npm run build:portable
```

On a regular APFS/Linux filesystem, use `npm install`, `npm run dev`, `npm run lint`, `npm run typecheck`, and `npm run build`.

## Implemented routes

Public:

- `/`, `/schools`, `/schools/[...location]`, `/school/[slug]`
- `/sign-up`, `/sign-in`, `/forgot-password`, `/reset-password`, `/auth/callback`
- `/for-schools`, `/for-schools/register`

Parent (authenticated parent role):

- `/parent`, `/parent/saved`, `/parent/children`, `/parent/profile`, `/parent/settings`

School (authenticated `school_owner` or `school_staff`):

- `/school/dashboard`, `/school/profile`, `/school/facilities`, `/school/fees`, `/school/media`, `/school/admissions`, `/school/verification`, `/school/team`, `/school/settings`

Phase 2 intentionally does not implement payments, subscriptions, promoted listings, admission applications, visit booking, messaging, AI search, WhatsApp, or an inspector mobile app.

## Structure

- `supabase/migrations` — PostgreSQL schema, role helpers, lifecycle functions, RLS and storage policies
- `supabase/tests/database/rls.sql` — local database RLS regression suite
- `src/lib/supabase` — browser, server and cookie-refresh Supabase clients
- `src/lib/schools` — public allowlisted queries and school-workspace data
- `src/app/parent`, `src/app/school/(portal)` — protected portals
- `src/components/auth`, `src/components/portal`, `src/components/school` — reusable application UI
- `src/data` — shared product types and display formatters
- `scripts/portable.mjs` — external-filesystem development/build support

## Security model

The database is the authorization boundary. New sign-ups can only become `parent` or `school_owner`; privileged roles require the guarded administrative RPC. Parents are scoped to their own children and saved schools. School access is derived from active `school_members` rows, not client-submitted school IDs. Published schools and approved public media are the only public catalog records. Documents are private and never yield public bucket URLs. Publishing and verification are separate workflows.
