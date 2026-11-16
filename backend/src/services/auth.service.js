import crypto from "node:crypto";
import jwt from "jsonwebtoken";

/**
 * Central place for authentication + authorization rules.
 *
 * - Authentication: who is calling (Google ID token verified via Firebase Admin,
 *   or email + password), after which the backend issues its own session JWT.
 * - Authorization: the role stored in MongoDB. Admin rights additionally require
 *   the account email to equal ADMIN_EMAIL from the backend environment.
 */

const SESSION_TTL = process.env.SESSION_TTL || "7d";

let devSecret = null;
export const getJwtSecret = () => {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production.");
  }
  if (!devSecret) {
    devSecret = crypto.randomBytes(32).toString("hex");
    console.warn("JWT_SECRET not set: using a temporary secret. Sessions will reset when the server restarts.");
  }
  return devSecret;
};

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

export const getAdminEmail = () => normalizeEmail(process.env.ADMIN_EMAIL || "");

export const isAdminEmail = (email) => {
  const adminEmail = getAdminEmail();
  return Boolean(adminEmail) && normalizeEmail(email) === adminEmail;
};

/**
 * Admin rights come ONLY from the email matching ADMIN_EMAIL. The account keeps its own role
 * (e.g. a student who is also the admin), so admin access is added on top of that role.
 * A stored role of "admin" with any other email grants nothing.
 */
export const isAuthorizedAdmin = (user) => Boolean(user) && isAdminEmail(user.email);

export const getStudentDomain = () =>
  (process.env.ALLOWED_STUDENT_DOMAIN || "thapar.edu").trim().toLowerCase().replace(/^@/, "");

export const isInstitutionalEmail = (email) => normalizeEmail(email).endsWith(`@${getStudentDomain()}`);

export const signSessionToken = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, getJwtSecret(), { expiresIn: SESSION_TTL });

export const verifySessionToken = (token) => jwt.verify(token, getJwtSecret());

export const toSafeUser = (user) => {
  const obj = typeof user.toObject === "function" ? user.toObject() : { ...user };
  obj.hasPassword = Boolean(obj.password);
  obj.isAdmin = isAdminEmail(obj.email); // admin rights on top of the account's own role
  delete obj.password;
  delete obj.firebaseUid;
  delete obj.__v;
  if (obj.verification) {
    // Users see their own status and evidence, but not admin-only notes (other accounts, institutional record).
    const { adminRecord: _adminRecord, features: _features, flags = [], score, ...visible } = obj.verification;
    obj.verification = {
      ...visible,
      flags: flags.map((f) => ({ type: f.type, createdAt: f.createdAt })),
      ...(score && {
        score: {
          value: score.value,
          method: score.method,
          version: score.version,
          computedAt: score.computedAt,
          checks: (score.checks || []).map((c) => ({ key: c.key, label: c.label, result: c.result, detail: c.publicDetail })),
        },
      }),
    };
  }
  return obj;
};

// ---------------------------------------------------------------------------
// Firebase Admin (used ONLY to verify Google ID tokens at sign-in)
// ---------------------------------------------------------------------------
let firebaseAuth = null;

/** Firebase Admin Auth instance (modular API, firebase-admin v10+; the old admin.apps/admin.auth() API is gone in v14). */
export const getFirebaseAuth = async () => {
  if (firebaseAuth) return firebaseAuth;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY && !process.env.FIREBASE_PROJECT_ID) return null;

  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    const app =
      getApps()[0] ||
      (process.env.FIREBASE_SERVICE_ACCOUNT_KEY
        ? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)) })
        : // Verifying ID tokens only needs the project ID (Google's public certificates are fetched automatically).
          initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID }));
    firebaseAuth = getAuth(app);
  } catch (error) {
    console.error("Firebase Admin SDK failed to initialize:", error.message);
  }
  return firebaseAuth;
};

/**
 * Verifies a Google sign-in ID token issued by Firebase Auth.
 * Returns { uid, email, name, picture } or throws.
 */
export const verifyGoogleIdToken = async (idToken) => {
  const auth = await getFirebaseAuth();
  if (!auth) {
    const err = new Error("Google sign-in is not configured on the server (set FIREBASE_PROJECT_ID).");
    err.status = 503;
    throw err;
  }

  const decoded = await auth.verifyIdToken(idToken);

  if (decoded.firebase?.sign_in_provider !== "google.com") {
    const err = new Error("Only Google sign-in is accepted on this endpoint.");
    err.status = 401;
    throw err;
  }
  if (!decoded.email || decoded.email_verified !== true) {
    const err = new Error("Your Google account email is not verified.");
    err.status = 401;
    throw err;
  }

  return {
    uid: decoded.uid,
    email: normalizeEmail(decoded.email),
    name: decoded.name || decoded.email.split("@")[0],
    picture: decoded.picture || "",
  };
};
