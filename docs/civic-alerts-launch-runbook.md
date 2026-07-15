# Civic alerts launch runbook

CivicNote ships as a native SwiftUI iOS app (`apps/mobile/ios`) plus an
installable TanStack PWA (`apps/web`), both backed by the same Convex
deployment. RSS ingestion is discovery only: imported items remain drafts
until an editor verifies and publishes them.

## 1. Configure and deploy Convex

Create or select the production Convex deployment and configure the web
client:

```text
VITE_CONVEX_URL=https://<deployment>.convex.cloud
```

The native iOS app reads its API base URL from
`apps/mobile/ios/Config/Shared.xcconfig` (`CIVICNOTE_API_BASE_URL`) — set it
to `https://<deployment>.convex.site`.

Backend environment variables (Convex dashboard):

- `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_PRIVATE_KEY` (PEM contents), and
  optionally `APNS_TOPIC` (defaults to `org.civicnote.mobile`) for direct
  APNs delivery.
- `CIVICNOTE_ALLOWED_ORIGINS` — comma-separated production origins for the
  public HTTP API CORS policy.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` once Web Push is
  enabled (the web client also needs `VITE_VAPID_PUBLIC_KEY`).

With `CONVEX_DEPLOYMENT` configured, generate types and seed content:

```bash
pnpm --filter @civicnote/web convex:codegen
pnpm --filter @civicnote/web convex:seed
```

Then run `migrations:backfillPushDeviceProviders` from the dashboard function
runner repeatedly (passing the returned cursor) until `isDone` is true, so
legacy push devices carry an explicit provider. Confirm the scheduled
functions in `apps/web/convex/crons.ts` are active.

## 2. HTTP API surface

The native app and PWA consume the versioned API on
`https://<deployment>.convex.site`:

- `GET /api/v1/topics`
- `GET /api/v1/events?topic=&jurisdiction=&limit=`
- `GET /api/v1/events/<key>`
- `POST /api/v1/installations/reconcile` — idempotent full-state
  registration (profile, subscriptions, push target)
- `POST /api/v1/installations/pause`

## 3. Editorial publishing

Review drafts through the Convex dashboard's function runner. A publish must
have at least one resolved source. Meeting times and deadlines also require an
official primary source, and meeting alerts require a structured meeting
record. Use the internal functions in `editorial.ts` to list drafts, attach or
update sources, publish, or suppress an item.

Before publishing, verify:

- the headline and summary distinguish documented facts from general risks;
- topic and jurisdiction keys are correct;
- the official agenda is still current before advertising a meeting time;
- the action names the actual decision-maker and links to a primary source;
- urgency and instant-versus-digest delivery are proportionate.

## 4. iOS build and release (Fastlane)

From `apps/mobile/ios` (requires `bundle install` once):

```bash
bundle exec fastlane ios verify       # simulator build + unit/UI tests
bundle exec fastlane ios screenshots  # deterministic fixture screenshots
bundle exec fastlane ios frame        # Frameit marketing artwork
bundle exec fastlane ios beta         # archive + TestFlight upload
bundle exec fastlane ios release      # upload binary/metadata (no auto-release)
```

Upload lanes need: `CIVICNOTE_APPLE_ID`, `CIVICNOTE_TEAM_ID` (and
`CIVICNOTE_ITC_TEAM_ID` if different), plus an App Store Connect API key via
`APP_STORE_CONNECT_API_KEY_KEY_ID` / `_ISSUER_ID` / `_KEY_FILEPATH`. Set
`DEVELOPMENT_TEAM` in a local xcconfig override or through Xcode signing.
Before submitting, confirm the Release archive's `aps-environment` is
`production` (`codesign -d --entitlements :- <app>`).

## 5. PWA deploy

`pnpm --filter @civicnote/web build` produces the service-worker-enabled
build. Verify after deploy: installability (manifest + icons), offline
fallback page, feed status pill (Live / Stale / Offline), update banner, and
the `/alerts/<key>`, `/privacy`, `/support`, `/about` routes. Publish the
Apple app-site-association file on the production domain for universal links.

## 6. Release smoke test

On one physical iPhone (TestFlight build):

1. Complete onboarding with one topic, a state, a position, and instant alerts.
2. Enable notifications and confirm one active `pushDevices` record with
   `provider: "apns"` plus the expected active `subscriptions` rows.
3. Publish a sourced test event matching that topic and jurisdiction.
4. Confirm the matching cron creates one candidate and the APNs dispatch
   records an accepted delivery.
5. Open the alert from foreground, background, and a cold start; each should
   resolve `/alerts/<event-key>` to the live event detail.
6. Change cadence and followed topics, then confirm subscriptions reconcile.
7. Pause alerts and confirm the device becomes inactive server-side.
8. Check Today, Topics, Act, Near You, and Settings at large text sizes and
   with VoiceOver enabled; verify offline/stale labels by toggling airplane
   mode.

The bundled starter brief is labeled offline content; treat the live Convex
feed and delivery records as the production source of truth.
