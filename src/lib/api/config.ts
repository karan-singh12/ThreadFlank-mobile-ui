import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * The dev machine's LAN address as seen by Expo Go (e.g. "192.168.1.20"), so a phone on the
 * same Wi-Fi reaches the backend without editing any config. `null` in production builds.
 */
function devMachineHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? null;
  if (!hostUri) return null;
  const host = hostUri.split(":")[0];
  // Tunnels (*.exp.direct) don't forward the backend's port; set EXPO_PUBLIC_API_URL instead.
  return host && !host.endsWith(".exp.direct") ? host : null;
}

function localOrigin(port: number) {
  const host = devMachineHost() ?? (Platform.OS === "android" ? "10.0.2.2" : "localhost");
  return `http://${host}:${port}`;
}

const trim = (url: string) => url.replace(/\/+$/, "");

/** NestJS backend including its global /api prefix. */
export const API_BASE_URL = trim(process.env.EXPO_PUBLIC_API_URL || `${localOrigin(3003)}/api`);

export const API_TIMEOUT_MS = 15_000;

/** Backend origin without the /api prefix; uploads are served from `${ASSET_ORIGIN}/public/…`. */
export const ASSET_ORIGIN = API_BASE_URL.replace(/\/api$/, "");

/** Socket.IO origin (chat, notifications, GRWM). */
export const WS_BASE_URL = trim(process.env.EXPO_PUBLIC_WS_URL || ASSET_ORIGIN);

/** The Next.js web app: product-link scraping and the web's own static images live there. */
export const WEB_ORIGIN = trim(process.env.EXPO_PUBLIC_WEB_URL || localOrigin(3000));

/** `<account>.r2.cloudflarestorage.com` (bucket in the path) or `<bucket>.<account>.r2.cloudflarestorage.com`. */
const R2_API_HOST = /^(?:([a-z0-9][a-z0-9-]*)\.)?[0-9a-f]{32}\.r2\.cloudflarestorage\.com$/i;

/** Private R2 S3-API URLs only answer signed requests, so they're read through the backend's /api/media route. */
function viaMediaRoute(url: string) {
  const match = /^https?:\/\/([^/]+)(\/[^?#]*)?/i.exec(url);
  if (!match) return url;
  const host = R2_API_HOST.exec(match[1]);
  if (!host) return url;
  const segments = (match[2] ?? "").replace(/^\/+/, "").split("/");
  const key = (host[1] ? segments : segments.slice(1)).join("/");
  return key ? `${ASSET_ORIGIN}/api/media/${key}` : url;
}

/**
 * Turns a stored image path into a URL the app can load: backend uploads (`/public/…`) resolve
 * against the API origin, the web app's own static files (`/images/…`) against the web origin,
 * private R2 URLs go through the media route, and other absolute/data/file URIs pass through.
 */
export function assetUrl(path: string | null | undefined) {
  if (!path) return "";
  if (/^https?:/i.test(path)) return viaMediaRoute(path);
  if (/^(data:|blob:|file:|content:|ph:|assets-library:)/i.test(path)) return path;
  if (path.startsWith("/") && !path.startsWith("/public/")) return `${WEB_ORIGIN}${path}`;
  return `${ASSET_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}
