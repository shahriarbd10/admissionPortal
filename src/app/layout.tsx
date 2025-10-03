import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admission Portal",
  description: "Phase 1 — Phone OTP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Ensure responsive layout on all devices */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Prevent automatic color scheme switching */}
        <meta name="color-scheme" content="light" />
      </head>
      {/* Light-only palette via classes; no system dark mode */}
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {/* Page content */}
        <div className="min-h-screen flex flex-col">{children}</div>
        {/* Global container for Firebase reCAPTCHA */}
        <div id="recaptcha-container" />
      </body>
    </html>
  );
}
