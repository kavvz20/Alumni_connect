/**
 * "Sign In with LinkedIn using OpenID Connect" (LinkedIn's official login API).
 * Used only to let a signed-in user connect their LinkedIn account so we can apply their
 * LinkedIn profile photo. No scraping: the user approves the request on LinkedIn.
 *
 * Env: LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_REDIRECT_URI (this backend's
 * /api/v1/linkedin/callback URL, registered in the LinkedIn app), FRONTEND_URL.
 */
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "./auth.service.js";
import { isLinkedinConnectConfigured } from "./profile-requirements.service.js";

const AUTHORIZE_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const STATE_AUDIENCE = "linkedin-connect";
const MAX_PICTURE_BYTES = 2 * 1024 * 1024;
const PICTURE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Tests replace fetch so no real network calls are made.
let fetchImpl = (...args) => globalThis.fetch(...args);
export const setFetchForTests = (fn) => {
  fetchImpl = fn || ((...args) => globalThis.fetch(...args));
};

const httpError = (status, message, code) => Object.assign(new Error(message), { status, code });

export { isLinkedinConnectConfigured };

export const getFrontendUrl = () => (process.env.FRONTEND_URL || "http://localhost:5173").trim().replace(/\/+$/, "");

/** URL to send the user to; `state` is a short-lived signed token tying the callback to this user. */
export const buildAuthorizationUrl = (userId) => {
  if (!isLinkedinConnectConfigured()) throw httpError(503, "LinkedIn connection is not configured on the server.");
  const state = jwt.sign({ sub: String(userId), nonce: crypto.randomBytes(8).toString("hex") }, getJwtSecret(), {
    audience: STATE_AUDIENCE,
    expiresIn: "10m",
  });
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    scope: "openid profile email",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
};

/** Returns the user ID the state was issued for, or throws. */
export const verifyState = (state) => {
  try {
    const payload = jwt.verify(String(state || ""), getJwtSecret(), { audience: STATE_AUDIENCE });
    return payload.sub;
  } catch (_) {
    throw httpError(400, "The LinkedIn connection link has expired. Please try again.", "bad_state");
  }
};

/** Exchanges the authorization code for the user's LinkedIn OpenID profile. */
export const fetchLinkedinProfile = async (code) => {
  const tokenRes = await fetchImpl(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: String(code),
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }).toString(),
  });
  const token = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !token.access_token) throw httpError(502, "LinkedIn did not accept the sign-in.", "token_failed");

  const infoRes = await fetchImpl(USERINFO_URL, { headers: { Authorization: `Bearer ${token.access_token}` } });
  const info = await infoRes.json().catch(() => ({}));
  if (!infoRes.ok || !info.sub) throw httpError(502, "Could not read your LinkedIn profile.", "userinfo_failed");

  return {
    sub: String(info.sub),
    name: info.name || [info.given_name, info.family_name].filter(Boolean).join(" "),
    email: info.email ? String(info.email).toLowerCase() : undefined,
    emailVerified: info.email_verified === true || info.email_verified === "true",
    picture: info.picture || null,
  };
};

/**
 * Downloads the LinkedIn photo and returns it as a data URL. LinkedIn photo links expire,
 * so the image itself is stored (the same way an uploaded photo is).
 */
export const downloadPictureAsDataUrl = async (url) => {
  if (!url || !/^https:\/\//i.test(url)) return null;
  const res = await fetchImpl(url);
  if (!res.ok) return null;
  const type = String(res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
  if (!PICTURE_TYPES.includes(type)) return null;
  const bytes = Buffer.from(await res.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_PICTURE_BYTES) return null;
  return `data:${type};base64,${bytes.toString("base64")}`;
};
