<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- This app is a frontend only; all data comes from an external Java/Spring REST API at `${VITE_API_BASE_URL}/api/v1` — never duplicate backend business logic or fabricate success.
- All HTTP calls go through `src/lib/api/client.ts` + `endpoints.ts` (cookie session via `credentials: "include"`); 401s dispatch an event the root route turns into `/session-expired`.
- DTOs live in `src/lib/api/types.ts`; keep them in sync with the backend OpenAPI spec.
- UI state-transition and permission rules live in `src/lib/lifecycle.ts` (tested in `src/test/lifecycle.test.ts`); they only hide actions — the backend stays authoritative.
- `/app` (merchant portal) and `/admin` (platform staff) are separate layout routes with `ssr: false` guards using `requireUser`, because the session cookie belongs to the API domain.
- Colors/fonts come only from tokens in `src/styles.css`.
