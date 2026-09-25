# Skulena architecture

## Phase 2 implemented boundary

Next.js App Router renders public pages and metadata on the server. Supabase SSR provides email/password authentication, cookie refresh, server-authorized role routing and RLS-backed repositories. Public discovery reads published database records only. If configuration is missing or the catalog is empty, the site shows no school listings rather than fallback fixtures.

Replace the data modules with server-only repositories in the next backend milestone. Public repositories must return an explicit allowlist of approved school fields and published media. Keep child profiles and application data out of all public models and caches.

## Portal separation for the next milestone

| Area | Layout and data boundary | Authorization |
| --- | --- | --- |
| Public | Shared public navigation, search, school profiles and location routes | Approved, published school data only |
| Parent | Separate parent route group and authenticated layout | Current parent owns child profiles, saved schools, applications and documents |
| School | Separate school route group and authenticated layout | Current user has active staff membership for the selected school/branch |
| Admin | Separate admin route group and authenticated layout | Server-authorized moderation, inspection or administration permissions |

Role names and application status vocabulary are in `src/types/domain.ts`. Layout checks improve navigation but never replace server authorization. The public `/profile` and `/applications` routes direct users to their account or school contact paths; protected parent and school workspace routes remain separately authorized.

## Supabase and privacy boundary

- Enable RLS before any application table becomes accessible. Use `auth.uid()` and school membership relationships, not frontend role flags or user-editable metadata. No service-role key in a browser.
- Parents access only their own parent/child records and applications. School staff access submissions for schools they are actively authorized to manage. Limit child data returned to the fields needed for admissions.
- Only approved and published school information, approved school media, and moderated reviews have public read access. Document and inspection checks are scoped to the exact field and source record.
- Private application and child documents live in non-public buckets. Authorize access server-side before issuing short-lived signed URLs; enforce ownership and staff membership in storage policies too.
- Record consent/authorization, access-relevant actions and status transitions. Update application status and append history atomically. Reject illegal transitions server-side.
- Moderators, inspectors, admins and super-admins receive explicitly scoped permissions. Test negative cross-parent, cross-school and anonymous access cases before deployment.

Planned data groups include identity (`users`, `parent_profiles`, `children`, `school_staff`); school catalog (`schools`, `school_branches`, `school_levels`, `school_classes`, `school_curricula`, `school_facilities`, `school_media`, `school_fees`, `school_documents`); trust (`verification_records`, `inspections`, `inspection_items`, `reviews`, `review_responses`); parent activity (`saved_schools`, `comparisons`, `inquiries`, `conversations`, `messages`, `visits`); admissions (`applications`, `application_documents`, `application_status_history`, `admission_offers`); operations (`subscriptions`, `payments`, `notifications`, `audit_logs`). Add report, promotion and consent models when those workflows are implemented.

Index published school locations and slugs, membership user/school IDs, child owner IDs, application parent/school/status keys, media school/category/status keys, message conversation/time keys and verification subject keys. Use bounded result pages and avoid loading private documents into discovery queries.

## Providers and SEO

Maps, Paystack, communications, media processing, analytics and monitoring adapters belong under `src/lib/integrations`; no paid integration is initialized. A map view should only be added after confirmed school coordinates and a configured provider are available.

Routes have descriptive server metadata and human-readable school/location URLs. Structured School, Review, Place and BreadcrumbList data must be built only from verified, publishable records.

## Deployment and local development

Production is a standard Next.js deployment with a lockfile. Bundled application assets use Next Image optimization, and the Inter variable font is self-hosted. The Next.js webpack pipeline is selected because Turbopack's worker-port binding is blocked in this managed environment.

This workspace's FAT filesystem cannot host normal npm symlinks reliably. The optional portable runner keeps source here and mirrors it into a dedicated, workspace-specific folder on the OS temporary drive. Dependencies, build caches and runtime writes stay there. Development synchronizes source every two seconds. Temporary runtime data may be cleared by the OS and is recreated on the next run. Use a normal APFS/Linux filesystem for production builds and long-term development when possible.
