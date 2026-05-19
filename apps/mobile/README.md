# @civic-research-hub/mobile

Expo React Native app for the Civic Research Hub monorepo.

## Run

From repo root:

```bash
pnpm dev:mobile
```

This now targets the development build by default so WorkOS auth can return to
`civicresearchhub://auth/callback`.

Before that will work on a device or simulator, install a native development
build once:

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

If you need Expo Go over a tunnel so WorkOS can return through the Expo URL, use:

```bash
pnpm dev:mobile:go:tunnel
```

Or from this folder:

```bash
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud pnpm dev
```

## Required env

- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_WORKOS_CLIENT_ID`

Optional:

- `EXPO_PUBLIC_WORKOS_API_HOSTNAME` (defaults to `api.workos.com`)
- `EXPO_PUBLIC_WORKOS_REDIRECT_URI` (defaults to `civicresearchhub://auth/callback`)
- `EXPO_PUBLIC_GIPHY_API_KEY` (enables GIF search in messages)

## Native build prerequisites

- Android native builds require a JDK with `javac` available on `PATH`.
- iOS native builds require CocoaPods 1.15.2 or newer.
- `pnpm --dir apps/mobile exec expo install --check` should report aligned Expo SDK package versions before native builds.

## Stack

- Expo + Expo Router
- NativeWind v4
- Convex React client using `@civic-research-hub/web` generated API
- WorkOS AuthKit via OAuth PKCE (`/user_management/authorize`)

## Core Screens

- `Spots`: native nearby map for community spots and member discovery with quick filters
- `Onboarding`: required profile setup, age confirmation, and location permission
- `Spot`: spot creation, detail, favorite, directions, and check-in/check-out
- `Meetups`: upcoming/active meetup list, detail, join requests, chat links, and host controls
- `The Barn`: community feed with posting and Looking Now
- `News`: LGBTQ+ news, health resources, safety resources, and crisis support
- `Health`: editable HIV/PrEP profile status and nearby testing clinics
- `Members`: recommended profiles and search by name
- `Messages`: conversation list
- `New Group`: create Pro/Ultra group conversations from recent chat partners
- `Conversation`: message thread with text, image, GIF, voice, location, spot/member/album sharing, reactions, edits, smart replies, and paid send options
- `Calls`: call minutes, incoming/outgoing call state, and web live-room handoff
- `Appeal`: submit moderation appeals and review appeal history
- `Moderation Updates`: account warnings, restrictions, and appeal decisions
- `Photos`: received albums, uploads, album management, and photo upload
- `Profile`: view/edit profile basics and sign out
- `Settings`: privacy, status, notification, subscription, and account controls
- `Controls`: location privacy radius, NSFW media blur, and explore-area controls
- `Subscription`: current plan, Pro/Ultra comparison, referral Ultra state, and web billing links
- `Subscription Success`: post-checkout billing sync and premium activation confirmation
- `Referrals`: code sharing, reward progress, and referral history
- `Join`: native referral invite link capture and signup/signin handoff
- `Blocked Users`: unblock people previously blocked from member profiles

## WorkOS setup

In WorkOS Redirects, add the mobile callback URI:

`civicresearchhub://auth/callback`

## Dependency decisions

- Included `expo-image` (recommended baseline for image rendering).
- Included `react-native-reanimated` (required by many native animation/gesture libs and used by router ecosystem).
- Did not include `@shopify/flash-list` yet; add it when feed/list performance becomes a concrete bottleneck.
