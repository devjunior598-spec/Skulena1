# Phase 2 backend and portal foundation

## Supabase setup

1. Create a Supabase project or run the Supabase CLI locally.
2. Copy `.env.example` to `.env.local` and add the project URL and publishable key. Never put a service-role key in the web app.
3. Link the project and apply migrations with `supabase link --project-ref <ref>` then `supabase db push`.
4. In Authentication URL Configuration, set the site URL and allow `/auth/callback` for local and production origins.
5. After the first account exists, bootstrap the first platform administrator once in the Supabase SQL Editor. This uses an administrative database session; it is not exposed through the app:

   ```sql
   begin;
   select set_config('app.allow_role_change', '1', true);
   update public.profiles
   set role = 'super_admin'
   where id = '<first-auth-user-uuid>';
   commit;
   ```

6. Start a disposable local database with `supabase start`, then run `supabase test db` to execute `supabase/tests/database/rls.sql`.

Migrations create the normalized application schema, restrictive grants and RLS, auth profile trigger, school workflow RPCs, safe public views, audit events, and two private storage buckets. `supabase/seed.sql` is development-only and deliberately creates a draft, unverified fictional school only when its documented local owner exists.

## Trust boundaries

- Account metadata can create only `parent` or `school_owner` profiles. Privileged roles require the guarded administrative RPC.
- A school owner gains ownership only for a school they explicitly create. All subsequent school access resolves through active `school_members` rows.
- School status is not client-updatable. Owners submit through an RPC; admins control review and publication. Verification is a separate trust-staff record.
- Public discovery reads the allowlisted `public_school_profiles` view and published related rows. Child data, membership, private contacts, document metadata and verification notes are excluded.
- Storage object paths use `{school_id}/{uploader_id}/{random-name}` and remain private. RLS checks the matching membership/metadata record before allowing reads or writes.
- The public profile views deliberately expose a narrow allowlist and are the only client-readable path to `schools`; direct table grants to `anon` remain revoked. This prevents private contact and ownership fields from bypassing the catalog boundary.

## Commands

```bash
npm run dev:portable
npm test
npm run lint:portable
npm run typecheck:portable
npm run build:portable
supabase test db
```

The portable scripts are required on this external FAT workspace because normal npm symlinks are unreliable there.
