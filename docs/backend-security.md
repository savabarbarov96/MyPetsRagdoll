# Backend security and additive deployment

The public production bundle currently points to `https://wandering-bobcat-37.convex.cloud`. A published URL identifies a source of public content; independently verify account ownership and the intended deployment before changing it. The frontend sitemap proxy points to the corresponding `.convex.site` HTTP endpoint.

## Required configuration

Set frontend `VITE_CONVEX_URL` to the verified Convex deployment URL. Set backend `ADMIN_PASSWORD_HASH` through Convex's server environment; never use a `VITE_` variable for this secret. The password is not in the repository or browser bundle. Missing configuration fails closed.

After authenticating the Convex CLI and verifying the deployment name, run:

```bash
node scripts/configure-admin-secret.mjs VERIFIED_DEPLOYMENT_NAME
```

The helper accepts a new password twice with terminal echo disabled, derives a salted scrypt hash, and pipes it directly to `convex env set`. It does not display or save the password or hash. Use a unique password. Its format is `scrypt:<32 hexadecimal salt characters>:<128 hexadecimal derived-key characters>`; derive the key with Node `scryptSync(password, salt, 64)`. Never paste passwords, deployment keys or hashes into chat, Git, screenshots or review documents.

## Backend-before-frontend rollout

1. Confirm project/deployment identity and access. Verify its public content matches this cattery. Obtain a protected backup through approved account tooling if available; do not put personal data in the repository.
2. Configure `ADMIN_PASSWORD_HASH` on the confirmed backend. Deploy the reviewed Convex schema/functions to the confirmed production deployment. This adds `waitingListSubmissions`, `submissionLimits` and optional session `authVersion`; existing customer/content tables and data remain intact. No reset, seed, imports or automatic content migrations are required.
3. Previously issued sessions are rejected because they were weak and exposed by a public API. Log in again. All existing admin mutations, private reads, upload URLs and file deletion now validate a live server session; admin sessions last 24 hours. Account-wide login throttling permits 20 attempts per 15 minutes.
4. Verify login, existing cat/pedigree/news/gallery/video/settings flows, file uploads and waiting-list management. Roll out the matching frontend only after backend readiness. The previous frontend relied on an insecure local login and will not support the newly guarded admin APIs.
5. Verify the public waiting-list form and `/sitemap.xml`, then record backend deployment and frontend deployment separately. The repository's build configuration deploys only the Vite frontend unless hosting is explicitly configured to deploy Convex too.

## Waiting-list handling

Submissions require email or phone and explicit permission for a personal follow-up. Marketing is not automatically requested or enabled. International phones require their country prefix; Bulgarian ten-digit numbers beginning with `0` are normalized to `+359`. Email is trimmed and case-normalized. Duplicate email or phone contacts receive generic acceptance without exposing or overwriting existing records, including closed records. Administrators can delete a closed record after appropriate retention handling if the person needs to submit anew.

The backend records the consent notice version and server timestamp, optional name/preferences, and optional cat/page context. Cat labels are confirmed against the displayed cat record. Internal notes never appear in a public query. Statuses are New, Contacted and Closed; management uses cursor pagination and confirmed deletion in the UI.

Spam controls include bounded values, a honeypot, a minimum elapsed form time and a transactional shared budget of 100 attempts/hour and 3 attempts per normalized contact per 10 minutes. Per-contact throttle keys use SHA-256 digests salted with the server-only admin hash when configured. Raw contacts are not stored in the rate-limit table; expired counters are removed by an hourly internal job. Timing/honeypot are supplemental controls, not proof of human identity. Consider an explicitly configured challenge provider if real abuse exceeds these safeguards; update privacy disclosures when adding a service. No automatic email/SMS/WhatsApp messages are sent.

Customer-data retention remains an operational responsibility; agree and apply the published privacy-policy schedule. Never run `seed:clearDatabase`, `seed:reseedDatabase` or sample-data scripts on a customer database. Image migration/reset/seed maintenance endpoints are internal only. New certificate/gallery uploads preserve original bytes; optimized public derivatives must link to the originals.

## Local evidence

`convex-test` checks validation, deduplication, permissions, admin guards, pagination, notes/deletion, throttling, context and sitemap publication with isolated in-memory data. These checks do not prove that a hosted deployment has received the schema/functions, that secrets are configured, or that production administration is working.
