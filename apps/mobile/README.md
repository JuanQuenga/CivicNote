# @civicnote/mobile

Expo React Native app for the CivicNote monorepo.

## Run

From repo root:

```bash
pnpm dev:mobile
```

This app reads the same seeded civic research topics used by the web app and
does not require a backend or authentication provider for local browsing.

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

No mobile-specific environment variables are required.

## Native build prerequisites

- Android native builds require a JDK with `javac` available on `PATH`.
- iOS native builds require CocoaPods 1.15.2 or newer.
- `pnpm --dir apps/mobile exec expo install --check` should report aligned Expo SDK package versions before native builds.

## TestFlight

The app is configured for EAS iOS production builds in `eas.json`.

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

- `Home`: research hub overview, signal stats, and active topic cards
- `Topic`: status brief, evidence stats, source links, findings, and public actions

## Dependency decisions

- Included `expo-image` (recommended baseline for image rendering).
- Included `react-native-reanimated` (required by many native animation/gesture libs and used by router ecosystem).
- Did not include `@shopify/flash-list` yet; add it when feed/list performance becomes a concrete bottleneck.
