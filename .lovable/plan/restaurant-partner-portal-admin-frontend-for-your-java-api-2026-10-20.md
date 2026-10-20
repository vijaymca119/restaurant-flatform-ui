# Restaurant Partner Portal + Admin (frontend for your Java API)

## What we build
A premium, Apple-inspired web portal that talks to your Java/Spring `/api/v1` backend (hosted elsewhere). No backend logic is duplicated here; the server stays the source of truth. Until your API URL is set, screens show clear "API not connected" states — no fake approvals, uploads or sales.

## Site map
```text
/                      Partner landing page
/login /signup /verify-email /forgot-password /session-expired
/onboarding            5-step wizard (business, verification docs, locations, first experience, review)
/app                   Dashboard
/app/locations         List, add, edit, submit
/app/experiences       List, create/edit wizard, customer preview, publish/pause/archive
/app/team              Members, invites, roles
/admin                 Reviewer/admin area (separate layout)
/admin/applications    Queue, details, documents, approve/reject with reason
/admin/experiences     Moderation queue
/admin/audit           Audit history
```

## Design system
- White background, light grey surfaces, near-black text, muted grey secondary text, black primary buttons.
- System font stack (-apple-system, BlinkMacSystemFont, sans-serif), large headings, generous spacing.
- Rounded cards, subtle borders, minimal shadows, clean sidebar, restrained status colors (Draft, Submitted, Approved, Rejected, Published, Paused, Archived).
- Original brand name and generated restaurant photography for the landing page.

## Behaviour rules
- Application: DRAFT -> SUBMITTED -> APPROVED / REJECTED (terminal, reason shown).
- Experience: DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED <-> PAUSED; SUBMITTED -> REJECTED; archive from any non-archived state. Only valid actions are shown.
- Venue submit only when merchant is approved and active.
- Owner / manager / staff permissions control which actions appear; admin area only for reviewer/admin roles. Backend still enforces everything.
- Sign-up creates customer accounts only.
- Dashboard shows empty states for sales, payments and vouchers.
- Wizard saves drafts to the API and resumes where you left off.

## Technical details
- TanStack Router (fixed in this template; replaces React Router), TanStack Query, React Hook Form + Zod, shadcn/Tailwind tokens, Lucide icons.
- `VITE_API_BASE_URL` configures the backend; central typed API client (`src/lib/api/*`) with DTO interfaces per module, consistent error mapping, 401 -> session-expired redirect.
- Auth: cookie/session-based calls with `credentials: "include"` (assumed; adjustable to bearer/OIDC once your auth endpoints are confirmed). Current user + roles loaded from a `/me`-style endpoint — exact path to confirm against your OpenAPI spec.
- Protected layouts: `_portal` (merchant roles) and `_admin` (PLATFORM_REVIEWER/ADMIN) with `beforeLoad` guards.
- Shared state helper `allowedTransitions(status)` with unit tests for both lifecycles and role permissions.
- Uploads: file type/size validation, progress, retry via multipart POST.
- Per-route head() metadata; responsive and keyboard-accessible.

## Assumptions to confirm
- Your API is reachable from the browser with CORS allowing this site.
- Auth/login and admin endpoint DTOs follow the briefs; I'll match your OpenAPI file if you share it.

## Milestones (all in this build)
1. Design system, landing page, auth screens.
2. API client, guards, onboarding wizard.
3. Dashboard, locations, experiences, team.
4. Admin area and tests.
