import { router, type Href } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { colors } from "@/theme";

/** Web paths that exist as screens in the app (the mobile routes mirror the web routes). */
const APP_PREFIXES = ["/discover", "/drape", "/wardrobe", "/saved", "/messages", "/events", "/profile", "/trending", "/stylist", "/post", "/look", "/notifications", "/credits", "/contact", "/legal"];

const ALIASES: Record<string, string> = {
  "/pricing": "/credits",
  "/terms": "/legal/terms",
  "/disclaimer": "/legal/disclaimer",
  "/privacy": "/legal/privacy",
};

/** Opens an in-app link from a notification or the API (e.g. "/events/abc?plan=1"); returns false if unknown. */
export function openAppLink(link: string | null | undefined) {
  if (!link) return false;
  const path = link.replace(/^https?:\/\/[^/]+/i, "");
  const [pathname] = path.split(/[?#]/);
  const alias = ALIASES[pathname];
  if (alias) {
    router.push(alias as Href);
    return true;
  }
  if (APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    router.push(path as Href);
    return true;
  }
  return false;
}

/** Opens an external page (store links, product pages) in the in-app browser. */
export function openExternal(url: string) {
  return WebBrowser.openBrowserAsync(url, {
    toolbarColor: colors.canvas,
    controlsColor: colors.accentBright,
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  }).catch(() => undefined);
}
