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

Review the production target and planned additive schema/function changes before deployment:

```bash
CONVEX_DEPLOYMENT=prod:wandering-bobcat-37 npx convex deploy --dry-run --typecheck enable
CONVEX_DEPLOYMENT=prod:wandering-bobcat-37 npx convex deploy --typecheck enable
```

Deploy adds the waiting-list tables and indexes and secures existing administrator APIs. Do not run seed, reset, import or sample-data commands. Existing admin sessions are intentionally invalidated; the owner signs in again with the new password. Coordinate the backend and frontend rollout because the old frontend cannot use the newly protected admin APIs.

Only after backend deployment succeeds, push the reviewed commit to `main` without force-pushing. The existing hosting integration then publishes the frontend. Its `VITE_CONVEX_URL` must point to the same verified production backend. Check the public pages, cookie controls, sitemap, and real administrator access after the hosting deployment completes.

Local tests use isolated database/browser fixtures and never submit customer test records to production. Record local checks, secret configuration, Convex deployment, Git push and frontend acceptance separately; none implies the others succeeded.
