# Civic alerts launch runbook

This release adds continuously refreshed, source-backed civic events and
installation-scoped push subscriptions for topic, position, cadence, and state.
RSS ingestion is discovery only: imported items remain drafts until an editor
verifies and publishes them.

## 1. Configure and deploy Convex

Create or select the production Convex deployment, then configure the web and
mobile clients with the same deployment URL:

```text
VITE_CONVEX_URL=https://<deployment>.convex.cloud
EXPO_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
```

The mobile registration endpoint is derived automatically as
`https://<deployment>.convex.site/api/push/register`. Set
`EXPO_PUBLIC_PUSH_REGISTRATION_URL` only when overriding that endpoint.

With `CONVEX_DEPLOYMENT` configured, generate the deployment-specific types and
seed the initial topics, jurisdictions, sources, actions, and verified event:

```bash
pnpm --filter @civicnote/web convex:codegen
pnpm --filter @civicnote/web convex:seed
```

Set `EXPO_ACCESS_TOKEN` in Convex when Expo enhanced push security is enabled.
Confirm the scheduled functions shown in `apps/web/convex/crons.ts` are active.

## 2. Editorial publishing

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

## 3. Configure native push credentials

- Configure APNs for `org.civicnote.mobile` in EAS/Apple Developer.
- Configure FCM V1 for `org.civicnote.mobile` in EAS/Google Cloud.
- Confirm the production archive has the production push entitlement.
- Put `EXPO_PUBLIC_CONVEX_URL` in the EAS environment used by the archive.

Remote push must be tested in a development or release build on physical
devices. It is not a complete test in Expo Go or an iOS simulator.

## 4. Release smoke test

On one physical iPhone and one physical Android device:

1. Complete onboarding with one topic, a state, a position, and instant alerts.
2. Enable notifications and confirm one active `pushDevices` record plus the
   expected active `subscriptions` rows.
3. Publish a sourced test event matching that topic and jurisdiction.
4. Confirm the matching cron creates one candidate and push dispatch receives
   an Expo ticket and delivery receipt.
5. Open the alert from foreground, background, and a cold start; each should
   resolve `/alerts/<event-key>` to the live event detail.
6. Change cadence and followed topics, then confirm subscriptions reconcile.
7. Pause alerts and confirm the device becomes inactive server-side.
8. Check Today, Updates, Act, Map, and Settings at large text sizes and with
   VoiceOver/TalkBack enabled.

Keep the local fallback briefs in the app for offline use, but treat the live
Convex feed and delivery receipts as the production source of truth.
