# Threadflank Mobile

The Threadflank mobile app, built with Expo and React Native. It is the mobile client for the Threadflank backend. Features include a wardrobe, virtual try-on ("Drape"), an AI stylist, a social feed, events, chat, notifications and credits.

## Tech stack

- Expo SDK 57, React Native 0.86, React 19
- Expo Router (file-based routing, typed routes)
- TanStack Query for server state
- React Hook Form and Zod for forms and validation
- Socket.IO client for realtime chat and notifications
- Expo SecureStore, Image Picker, Image Manipulator, Video, Sharing and Haptics
- TypeScript

## Prerequisites

- Node.js 20 or later and npm
- The Threadflank backend running (default port `3003`)
- [Expo Go](https://expo.dev/go) on a device, or an Android emulator or iOS simulator

## Getting started

```bash
cd mobile
npm install
npm start
```

Then press `a` for Android, `i` for iOS, or `w` for web, or scan the QR code with Expo Go.

## Environment variables

By default the app derives the API host from the Expo dev server, using port `3003` for the API and `3000` for the web app. Set these in a `.env` file in `mobile/` to override that. This is required when using a tunnel, since tunnels don't forward the backend port.

| Variable | Purpose | Default |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | REST API base URL, including `/api` | `http://<dev-host>:3003/api` |
| `EXPO_PUBLIC_WS_URL` | Socket.IO server origin | API origin |
| `EXPO_PUBLIC_WEB_URL` | Web app origin, used for share links | `http://<dev-host>:3000` |

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:3003/api
EXPO_PUBLIC_WS_URL=http://192.168.1.20:3003
EXPO_PUBLIC_WEB_URL=http://192.168.1.20:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Start and open on Android |
| `npm run ios` | Start and open on iOS |
| `npm run web` | Start and open in the browser |
| `npm run typecheck` | Type-check with `tsc --noEmit` |
| `npm run lint` | Lint with `expo lint` |
| `npm run doctor` | Diagnose dependency and config issues |

Use `npx expo install <package>` rather than `npm install <package>` when adding dependencies, so the SDK-compatible version is chosen.

## Project structure

```
src/
├── app/            Expo Router routes
│   ├── (auth)/     Login, signup, password reset
│   ├── (app)/      Authenticated screens (tabs, look, post, chat, events, profile, credits, ...)
│   └── legal/      Legal pages
├── components/     Shared layout, navigation and UI components
├── data/           Static content and configuration
├── features/       Feature modules (auth, wardrobe, drape, social, events, messages, billing, ...)
├── lib/            API client, query client, sockets, formatting and media helpers
└── theme/          Colors and typography
```

## App configuration

- Name: Threadflank, URL scheme `threadflank`
- Bundle ID and package: `com.threadflank.app`
- Portrait only, dark UI
- Permissions: camera and photo library, used for selfies and wardrobe photos. The microphone is not used.

## Troubleshooting

- **App can't reach the API:** make sure the device and the backend are on the same network, and set `EXPO_PUBLIC_API_URL` to your machine's LAN IP. `localhost` won't work on a physical device.
- **Stale env values:** restart with `npx expo start -c` after changing `.env`.
- **Dependency mismatches:** run `npx expo install --fix`, then `npm run doctor`.

## License

See [LICENSE](LICENSE).
