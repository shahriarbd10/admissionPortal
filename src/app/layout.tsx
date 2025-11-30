import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admission Portal",
  description: "welcome to the smart admission portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Responsive & light-only */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light" />

        {/* FIX: Load correct reCAPTCHA v2 script */}
        <script 
          src="https://www.google.com/recaptcha/api.js"
          async 
          defer
        ></script>
      </head>

      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased">
        {/* Decorative background */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(40%_35%_at_10%_10%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(45%_35%_at_90%_8%,rgba(244,114,182,0.12),transparent_60%)]" />
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_60%)] bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
        </div>

        <div className="min-h-screen flex flex-col">{children}</div>

        {/* reCAPTCHA container */}
        <div id="recaptcha-container" />
      </body>
    </html>
  );
}
