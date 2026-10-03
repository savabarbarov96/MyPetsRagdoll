# Convex CLI rollout

Run from the repository root. Frontend Git deployment and Convex deployment are separate operations.

```bash
npx convex login
npx convex login status
```

Confirm in the authenticated dashboard that `wandering-bobcat-37` is the production deployment for this cattery, at `https://wandering-bobcat-37.convex.cloud`. Stop if the account cannot access it or the identity differs. The public URL alone does not prove ownership.

After verification, the owner enters a new administrator password privately in their terminal:

```bash
node scripts/configure-admin-secret.mjs wandering-bobcat-37
```

The helper hides input, requires matching passwords of at least 12 characters, and sends only a salted hash to the backend. No email or automatic messages are configured.

The website currently uses a deployment classified as `dev` by Convex. The project's default `prod` is `doting-orca-824`, which is a different backend. Plain `convex deploy` would target that other backend. The helper below instead creates a temporary key scoped to the verified live deployment, keeps it in process memory, and revokes it after use. Review the planned additive schema/function changes before deployment:

```bash
node scripts/deploy-active-backend.mjs --dry-run
node scripts/deploy-active-backend.mjs
```

Deploy adds the waiting-list tables and indexes and secures existing administrator APIs. Do not run seed, reset, import or sample-data commands. Existing admin sessions are intentionally invalidated; the owner signs in again with the new password. Coordinate the backend and frontend rollout because the old frontend cannot use the newly protected admin APIs.

Only after backend deployment succeeds, push the reviewed commit to `main` without force-pushing. The existing hosting integration then publishes the frontend. Its `VITE_CONVEX_URL` must point to the same verified production backend. Check the public pages, cookie controls, sitemap, and real administrator access after the hosting deployment completes.

Local tests use isolated database/browser fixtures and never submit customer test records to production. Record local checks, secret configuration, Convex deployment, Git push and frontend acceptance separately; none implies the others succeeded.

For recovery when the frontend is already live and public functions are missing, `node scripts/deploy-active-backend.mjs --allow-unconfigured-admin` publishes the backend while leaving administrator login disabled until the owner configures `ADMIN_PASSWORD_HASH`. This does not restore the insecure legacy login.

## Recorded live rollout: 2026-10-03

Schema and functions were deployed to `wandering-bobcat-37`, explicitly scoped to the backend used by the website. Convex completed schema validation, added the five waiting-list/rate-limit indexes and deleted no indexes. The temporary deployment key was revoked.

Read-only verification confirmed `siteSettings:getPublicTrackingSettings` succeeds, the backend sitemap returns HTTP 200, and unauthenticated `cats:getAllCats` access is rejected. Public content counts remained 18 displayed cats and 7 published announcements. The public site rendered on desktop, tablet and mobile with optional marketing consent enabled, analytics disabled and no external embeds; the missing-function error did not recur. No customer test submissions, reset or seed commands were used.

Administrator password configuration and genuine authenticated production administration remain pending the owner's hidden terminal password entry. Isolated browser tests cover administration, but they do not establish production login acceptance.
