// src/lib/firebaseClient.ts

let _configPromise: Promise<{
  apiKey: string;
  authDomain: string;
  projectId: string;
}> | null = null;

// Extend window type
declare global {
  interface Window {
    _recaptchaVerifier?: any;
  }
}

/** Fetch Firebase web config */
async function fetchWebConfig() {
  if (!_configPromise) {
    _configPromise = fetch("/api/config/firebase").then((r) => r.json());
  }
  const cfg = await _configPromise;
  if (!cfg?.apiKey) throw new Error("Firebase config unavailable");
  return cfg;
}

/** Init Firebase */
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

/** Correct reCAPTCHA for Firebase v10+ */
export async function ensureInvisibleRecaptcha(
  auth: import("firebase/auth").Auth
) {
  if (typeof window === "undefined") return null;

  if (window._recaptchaVerifier) return window._recaptchaVerifier;

  const { RecaptchaVerifier } = await import("firebase/auth");

  // 🔥 Firebase v10+ signature:
  // new RecaptchaVerifier(auth, containerId, options)
  window._recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container", // container
    {
      size: "invisible",
      callback: () => {},
      "expired-callback": () => {},

      // prevent PAT / Enterprise reCAPTCHA
      appCheck: undefined,
      appCheckToken: false,
    }
  );

  return window._recaptchaVerifier;
}

/** Start OTP */
export async function startPhoneOtp(
  auth: import("firebase/auth").Auth,
  phoneE164: string
) {
  const { signInWithPhoneNumber } = await import("firebase/auth");

  const verifier = await ensureInvisibleRecaptcha(auth);
  if (!verifier) throw new Error("reCAPTCHA init failed");

  return signInWithPhoneNumber(auth, phoneE164, verifier);
}
