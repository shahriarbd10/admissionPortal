let _configPromise: Promise<{ apiKey: string; authDomain: string; projectId: string }> | null = null;

async function fetchWebConfig() {
  if (!_configPromise) _configPromise = fetch("/api/config/firebase").then(r => r.json());
  const cfg = await _configPromise;
  if (!cfg?.apiKey) throw new Error("Firebase config unavailable");
  return cfg;
}

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

export async function ensureInvisibleRecaptcha(auth: import("firebase/auth").Auth) {
  if (typeof window === "undefined") return null;
  // @ts-ignore
  if (window._recaptchaVerifier) return window._recaptchaVerifier;
  const { RecaptchaVerifier } = await import("firebase/auth");
  // @ts-ignore
  window._recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
  // @ts-ignore
  return window._recaptchaVerifier;
}

export async function startPhoneOtp(auth: import("firebase/auth").Auth, phoneE164: string) {
  const { signInWithPhoneNumber } = await import("firebase/auth");
  const verifier = await ensureInvisibleRecaptcha(auth);
  if (!verifier) throw new Error("reCAPTCHA init failed");
  return signInWithPhoneNumber(auth, phoneE164, verifier);
}
