// The app build's session: the backend's access + refresh tokens, kept in the phone's
// secure storage (iOS Keychain / Android Keystore) so a restart doesn't log you out.
// The web build never uses this — its session is the backend's httponly cookies.

import { IS_APP } from "@/lib/platform";

export interface Tokens {
  access: string;
  refresh: string;
}

const KEY = "session";
// undefined = not read from storage yet; null = signed out.
let cached: Tokens | null | undefined;

// Resolve to the module, never to the plugin itself: Capacitor plugins are proxies that treat
// every property as a native call, so returning one from an async function makes the Promise
// probe `.then` on it — which throws "SecureStorage.then() is not implemented".
function storageModule() {
  return import("@aparajita/capacitor-secure-storage");
}

// iOS keeps Keychain items after the app is uninstalled, so a reinstall would wake up signed
// in with old tokens. WebView storage *is* wiped on uninstall: no marker there = fresh install.
const INSTALL_MARKER = "mendyr-installed";

function isFreshInstall(): boolean {
  try {
    if (localStorage.getItem(INSTALL_MARKER)) return false;
    localStorage.setItem(INSTALL_MARKER, "1");
    return true;
  } catch {
    return false;
  }
}

export async function getTokens(): Promise<Tokens | null> {
  if (!IS_APP) return null;
  if (cached !== undefined) return cached;
  if (isFreshInstall()) {
    await setTokens(null);
    return cached ?? null;
  }
  try {
    const { SecureStorage } = await storageModule();
    const stored = await SecureStorage.get(KEY);
    const value = stored as Partial<Tokens> | null;
    cached = value?.access && value.refresh ? { access: value.access, refresh: value.refresh } : null;
  } catch {
    cached = null; // unreadable (e.g. keystore reset after a device restore) — sign in again
  }
  return cached;
}

export async function setTokens(tokens: Tokens | null): Promise<void> {
  if (!IS_APP) return;
  cached = tokens;
  try {
    const { SecureStorage } = await storageModule();
    if (tokens) await SecureStorage.set(KEY, { access: tokens.access, refresh: tokens.refresh });
    else await SecureStorage.remove(KEY);
  } catch {
    // Keep the in-memory session for this launch even if persisting failed.
  }
}
