import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let _adminApp: App | null = null;
let _adminAuth: Auth | null = null;

export function adminApp() {
  if (_adminApp) return _adminApp;
  if (!getApps().length) {
    _adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  } else {
    _adminApp = getApps()[0]!;
  }
  return _adminApp!;
}

export function adminAuth() {
  if (_adminAuth) return _adminAuth;
  _adminAuth = getAuth(adminApp());
  return _adminAuth!;
}
