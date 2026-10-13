import * as SecureStore from "expo-secure-store";
import type { AuthSession } from "./types";

// Same key names as the web app's localStorage session.
const TOKEN_KEY = "tf_token";
const USER_KEY = "tf_user";

/** Reads the JWT `exp` claim without verifying the signature (the server does that). */
export function isExpired(token: string) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(part.padEnd(part.length + ((4 - (part.length % 4)) % 4), "=")));
    return typeof payload.exp === "number" && payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** The stored session, or null when there is none or it has expired / is corrupt. */
export async function readSession(): Promise<AuthSession | null> {
  try {
    const [token, rawUser] = await Promise.all([SecureStore.getItemAsync(TOKEN_KEY), SecureStore.getItemAsync(USER_KEY)]);
    if (!token || !rawUser) return null;
    if (isExpired(token)) {
      await clearSession();
      return null;
    }
    return { token, user: JSON.parse(rawUser) };
  } catch {
    return null;
  }
}

export async function writeSession(session: AuthSession) {
  await Promise.all([
    SecureStore.setItemAsync(TOKEN_KEY, session.token),
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user)),
  ]);
}

export async function clearSession() {
  await Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(USER_KEY)]).catch(() => undefined);
}
