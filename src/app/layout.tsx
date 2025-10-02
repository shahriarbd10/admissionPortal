import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admission Portal",
  description: "Phase 1 — Phone OTP",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        {children}
        <div id="recaptcha-container" />
      </body>
    </html>
  );
}
