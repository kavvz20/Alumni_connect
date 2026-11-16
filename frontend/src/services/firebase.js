import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let auth = null;
let googleProvider = null;

if (firebaseConfig.apiKey) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
  } catch (err) {
    console.warn("Firebase client init warning:", err.message);
  }
}

export const isGoogleSignInAvailable = () => Boolean(auth && googleProvider);

/**
 * Opens the Google account picker and returns a Google ID token for the backend.
 * Firebase is only used to obtain this token; the backend verifies it and issues
 * its own session, so we sign out of Firebase straight away.
 */
export const getGoogleIdToken = async () => {
  if (!isGoogleSignInAvailable()) {
    throw new Error("Google sign-in is not configured. Add the VITE_FIREBASE_* variables to frontend/.env.");
  }
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  signOut(auth).catch(() => {});
  return idToken;
};

export { auth };
