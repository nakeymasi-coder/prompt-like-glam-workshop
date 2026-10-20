# Isolated Inner Circle preview testing

This draft preserves the manual, admin-issued access-code flow. It is not a production launch.

## Runtime configuration

Set these through Netlify environment settings with **Functions** scope and **Deploy Previews** context only. Values in build-only configuration are insufficient. Redeploy after configuration changes.

- `INNER_CIRCLE_RUNTIME_MODE`: `preview`
- `INNER_CIRCLE_PREVIEW_ID`: the exact numeric PR number, currently `5`
- `INNER_CIRCLE_PREVIEW_SYNC_SECRET`: separately approved, independently generated signing secret of at least 24 characters
- `INNER_CIRCLE_PREVIEW_ADMIN_PASSWORD`: separately approved, independently generated test-admin password of at least 24 characters

Never reuse production credentials. Do not put credential values in source, logs, documentation, or messages. Missing or inconsistent configuration fails closed before opening storage. The preview's exact origin is checked against the configured PR number; another PR, branch alias, or production host is rejected. Runtime `CONTEXT`, when supplied, is cross-checked but is not assumed to exist.

Preview storage is the dedicated `inner-circle-preview-<PR number>` store. All Inner Circle records, including member events, profiles, gift catalogs, access codes, and claims, use this store. Production storage remains `inner-circle`; a future production deployment requires explicit `INNER_CIRCLE_RUNTIME_MODE=production` and existing production credentials. Do not configure or deploy production as part of this test.

App and HQ pages call their own origin's functions. Only the existing `nakeymasi-coder.github.io` site retains its established production API fallback. Production CORS no longer accepts preview origins.

## Authorized test sequence

1. Independently review the isolation tests and exact preview deployment/configuration before any record writes.
2. Confirm missing configuration and wrong-environment credentials fail before storage access.
3. Only after approval, create the synthetic owner test record in the isolated preview store. Do not copy real member records or alter real balances.
4. Issue a single-use test code through preview HQ, deliver it only to the approved owner's email, and redeem it only on the preview. Never include the code or session token in reports.
5. Confirm sign-in and sign-out without redeeming rewards, changing benefits, or touching production.

No test identities, records, access codes, email deliveries, credentials, or runtime settings have been created by this code change. Live verification and mobile/full browser tests remain pending. Automated tests are synthetic: `node --test tests/*.test.mjs` on Node 24.
