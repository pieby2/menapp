"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { IS_APP } from "@/lib/platform";

// Screens where Android's back button leaves the app instead of going back.
const ROOT_PATHS = new Set(["/", "/login", "/patient", "/pro", "/pro/onboarding"]);

/**
 * App build only (rendered from the root layout): makes the Capacitor shell behave like a
 * native app rather than a website in a frame. Status bar, splash hand-off, Android back
 * button, and a `keyboard-open` class so fixed bars can step aside while typing.
 */
export function NativeBootstrap() {
  const router = useRouter();

  useEffect(() => {
    if (!IS_APP) return;
    let cancelled = false;
    const cleanups: (() => void)[] = [];

    (async () => {
      const { Capacitor, SystemBars, SystemBarsStyle } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || cancelled) return;
      document.documentElement.classList.add("is-native");

      // The splash stays up (launchAutoHide: false) until the first frame is painted, so the
      // app never flashes an empty WebView. Done first, on its own, so nothing below can
      // leave it stuck — plus a timer in case even this frame never comes.
      const { SplashScreen } = await import("@capacitor/splash-screen");
      const hideSplash = () => void SplashScreen.hide().catch(() => {});
      requestAnimationFrame(hideSplash);
      const safety = setTimeout(hideSplash, 3000);
      cleanups.push(() => clearTimeout(safety));

      const [{ App }, { Keyboard }] = await Promise.all([
        import("@capacitor/app"),
        import("@capacitor/keyboard"),
      ]);
      if (cancelled) return;

      // Light app background, so the system bars' icons must be dark (also set in
      // capacitor.config.ts; repeated here in case the OS reset it).
      SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(() => {});

      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (ROOT_PATHS.has(window.location.pathname.replace(/\/$/, "") || "/") || !canGoBack) {
          App.minimizeApp().catch(() => {});
        } else {
          // Next's router, not history.back(), so its client cache stays in step with the URL.
          router.back();
        }
      });
      const shown = await Keyboard.addListener("keyboardWillShow", () =>
        document.documentElement.classList.add("keyboard-open"),
      );
      const hidden = await Keyboard.addListener("keyboardWillHide", () =>
        document.documentElement.classList.remove("keyboard-open"),
      );
      cleanups.push(() => void back.remove(), () => void shown.remove(), () => void hidden.remove());
      if (cancelled) cleanups.forEach((cleanup) => cleanup());
    })();

    return () => {
      cancelled = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [router]);

  return null;
}
