// src/lib/firebaseClient.ts

let _configPromise: Promise<{
  apiKey: string;
  authDomain: string;
  projectId: string;
}> | null = null;

// Extend window type for TypeScript
declare global {
  interface Window {
    _recaptchaVerifier?: any;
  }
}

/** Fetch Firebase web config from server */
async function fetchWebConfig() {
  if (!_configPromise) {
    _configPromise = fetch("/api/config/firebase").then((r) => r.json());
  }
  const cfg = await _configPromise;
  if (!cfg?.apiKey) throw new Error("Firebase config unavailable");
  return cfg;
}

/** Initialize Firebase client (idempotent) */
export async function initFirebaseClient() {
  const [{ initializeApp, getApps, getApp }, { getAuth }] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
  ]);

  const cfg = await fetchWebConfig();
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const auth = getAuth(app);

  return { app, auth };
}

/**
 * Ensure reCAPTCHA v2 Invisible (NOT Enterprise)
 * FIXES:
 * - "Unrecognized feature: 'private-token'"
 * - Enterprise reCAPTCHA auto-loading
 * - PAT (Privacy Sandbox) mode
 */
export async function ensureInvisibleRecaptcha(
  auth: import("firebase/auth").Auth
) {
  if (typeof window === "undefined") return null;

  // Reuse if exists
  if (window._recaptchaVerifier) return window._recaptchaVerifier;

  const { RecaptchaVerifier } = await import("firebase/auth");

  // 🔥 IMPORTANT: Firebase v9 constructor order: (auth, containerId, params)
  window._recaptchaVerifier = new RecaptchaVerifier(
    auth,                       // auth must be FIRST for v9
    "recaptcha-container",      // container id in DOM
    {
      size: "invisible",

      // prevents Enterprise recaptcha
      appCheck: undefined,
      appCheckToken: false,

      callback: () => {},
      "expired-callback": () => {},
    }
  );

  return window._recaptchaVerifier;
}

/** Start OTP flow */
export async function startPhoneOtp(
  auth: import("firebase/auth").Auth,
  phoneE164: string
) {
  const { signInWithPhoneNumber } = await import("firebase/auth");

  const verifier = await ensureInvisibleRecaptcha(auth);
  if (!verifier) throw new Error("reCAPTCHA init failed");

  return signInWithPhoneNumber(auth, phoneE164, verifier);
}
