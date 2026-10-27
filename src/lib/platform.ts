// One codebase, two builds. Which one this is gets baked in at build time:
//   web — the website on Vercel (the default): /api is proxied, the session lives in cookies.
//   app — the Capacitor build bundled into the iOS/Android apps: a static export that calls
//         the backend directly and keeps the session in the phone's secure storage.
// See README → "Mobile apps".

export const IS_APP = process.env.NEXT_PUBLIC_BUILD_TARGET === "app";

/** Absolute backend origin for the app build ("" on the web, where /api is same-origin). */
export const API_ORIGIN = IS_APP ? (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "") : "";

/** "ios" | "android" inside the native shell, "web" in a browser. */
export async function nativePlatform(): Promise<"ios" | "android" | "web"> {
  if (!IS_APP) return "web";
  const { Capacitor } = await import("@capacitor/core");
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : "web";
}
