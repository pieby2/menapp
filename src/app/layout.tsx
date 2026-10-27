import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";

import { NativeBootstrap } from "@/components/native-bootstrap";
import { ToastProvider } from "@/components/toast";
import { AuthProvider } from "@/lib/auth";
import { IS_APP } from "@/lib/platform";

import "./globals.css";

// Same pairing as the original Mendyr app: Inter for text, Outfit for headings.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Mendyr — Healthcare at home", template: "%s · Mendyr" },
  description:
    "Book nurses, physiotherapists and caregivers for visits at home. Healthcare professionals: earn on your own schedule.",
};

export const viewport: Viewport = {
  themeColor: "#F7F9FC",
  viewportFit: "cover",
  ...(IS_APP ? { maximumScale: 1, userScalable: false, interactiveWidget: "resizes-content" } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full antialiased${IS_APP ? " is-app" : ""}`}
    >
      <body className="min-h-full font-sans">
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
        {IS_APP && <NativeBootstrap />}
      </body>
    </html>
  );
}
