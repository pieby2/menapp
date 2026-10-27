import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize } from "@capacitor/keyboard";

// The Mendyr phone app: the same Next.js code as the website, built as a static export
// (`npm run build:app` → out/) and bundled into native Android and iOS shells.
const config: CapacitorConfig = {
  appId: "com.mendyr.patient", // the original Mendyr app's id, kept for store continuity
  appName: "Mendyr",
  webDir: "out",
  backgroundColor: "#F7F9FC", // behind the WebView before the first paint
  ios: {
    // The WebView spans the whole screen; the UI pads itself with env(safe-area-inset-*)
    // (viewport-fit=cover, see src/app/layout.tsx + globals.css) instead of iOS insetting it.
    contentInset: "never",
  },
  plugins: {
    SystemBars: {
      // Android 15+ draws apps edge to edge. "native" keeps the WebView honest about it: on
      // current WebViews env(safe-area-inset-*) carries the real insets (our CSS pads with
      // them); on old ones (< Chromium 140) Capacitor pads the WebView itself and reports 0.
      insetsHandling: "native",
      initialViewportFitValueHint: "cover", // we always use cover — avoids a layout jump
      style: "LIGHT", // dark status-bar icons on our light UI, even in system dark mode
    },
    SplashScreen: {
      // Hidden by NativeBootstrap after the first frame, so the app never flashes white.
      launchAutoHide: false,
      launchFadeOutDuration: 200,
      backgroundColor: "#F7F9FC",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    Keyboard: {
      // iOS: shrink the page above the keyboard so the focused field stays visible. (Android
      // needs nothing here: SystemBars pads the app by the keyboard's height.)
      resize: KeyboardResize.Body,
    },
  },
};

export default config;
