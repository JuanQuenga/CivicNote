# @civicnote/mobile

Expo React Native app for the CivicNote monorepo.

## Run

From repo root:

```bash
pnpm dev:mobile
```

The app keeps a sourced local fallback so topic briefs remain usable without a
network connection. Live civic events and remote push delivery require the
configured CivicNote backend.

If you need a native development build, run:

```bash
cd apps/mobile
pnpm ios
```

or:

```bash
cd apps/mobile
pnpm android
```

This now forces `--lan` by default to avoid Expo's currently flaky tunnel path.
The mobile scripts now invoke Expo through pnpm-managed binaries, which keeps
the monorepo compatible with pnpm workspace installs.

If you explicitly need a tunnel, use:

```bash
pnpm dev:mobile:tunnel
```

If you explicitly want Expo Go instead of the development build, use:

```bash
pnpm dev:mobile:go
```

If you explicitly want Expo Go over a tunnel, use:

```bash
pnpm dev:mobile:go:tunnel
```

The TestFlight build profile pulls EAS environment variables from the
`development` environment while still producing a store-compatible iOS archive.
Use Expo public variables for values that must be embedded in the JavaScript
bundle:

```bash
cd apps/mobile
pnpm dlx eas-cli@latest env:create \
  --environment development \
  --name EXPO_PUBLIC_CONVEX_URL \
  --value "https://your-convex-deployment.convex.cloud" \
  --visibility plaintext
```

If you already have `VITE_CONVEX_URL` configured for the web app, copy the same
URL value into `EXPO_PUBLIC_CONVEX_URL` for mobile. Expo only exposes variables
prefixed with `EXPO_PUBLIC_` to app code.

## Native build prerequisites

- Android native builds require a JDK with `javac` available on `PATH`.
- iOS native builds require CocoaPods 1.15.2 or newer.
- `pnpm --dir apps/mobile exec expo install --check` should report aligned Expo SDK package versions before native builds.

## Push notifications

Set `EXPO_PUBLIC_PUSH_REGISTRATION_URL` to the HTTPS endpoint that registers an
Expo push token. The app sends a stable installation ID, platform, followed
topic slugs, cadence, and coarse area label. If the variable is missing, the UI
truthfully reports that device permission is on but server registration is not
configured.

Remote notifications require a development or release build on a physical
device; Android remote push is not available in Expo Go. Before release:

- apply the `expo-notifications` config plugin to committed native projects
  with `expo prebuild` or equivalent native changes;
- install iOS pods after syncing native modules;
- configure APNs credentials and the iOS push entitlement through EAS;
- configure FCM V1 credentials for Android;
- verify a notification containing `data.path` or `data.eventKey` opens the
  corresponding `/alerts/[id]` screen from foreground, background, and a cold
  start.

## Adaptive tab bar

The floating five-tab capsule mirrors Piggies' `union-tab-view` interaction and
spacing. That package is SwiftUI and cannot directly host Expo Router's React
Native screen tree, so CivicNote implements the compatible pattern in React
Native: native interactive Liquid Glass on iOS 26+, a polished opaque capsule
on iOS 18–25 and other platforms, haptics, safe-area spacing, and accessible tab
semantics.

## TestFlight

The app is configured for EAS iOS TestFlight builds in `eas.json`. The
`testflight` profile uses the `development` EAS environment for variables, but
it is not a development-client build.

From `apps/mobile`, sign in to Expo and build the iOS archive:

```bash
pnpm dlx eas-cli@latest login
pnpm build:ios:testflight
```

On the first build, EAS will ask for Apple Developer credentials so it can create
or reuse signing credentials for `org.civicnote.mobile`.

After the build finishes, upload the latest build to App Store Connect:

```bash
pnpm submit:ios:testflight
```

Once Apple finishes processing it in App Store Connect, add yourself as an
internal tester for the app and install it from the TestFlight app on your
iPhone.

## Stack

- Expo + Expo Router
- NativeWind v4
- Static topic data shared from `@civicnote/web`

## Core Screens

- `Today`: personalized civic alerts and sourced action briefs
- `Topics`: followed-issue discovery and research
- `Act`: scripts and next actions connected to decision-makers
- `Map`: place-first civic developments
- `Settings`: topics, coarse location, cadence, and push permission
- `Topic`: status brief, evidence stats, source links, findings, and public actions

## Dependency decisions

- Included `expo-image` (recommended baseline for image rendering).
- Included `react-native-reanimated` (required by many native animation/gesture libs and used by router ecosystem).
- Did not include `@shopify/flash-list` yet; add it when feed/list performance becomes a concrete bottleneck.
