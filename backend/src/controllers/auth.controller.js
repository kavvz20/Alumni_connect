import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import {
  getStudentDomain,
  isAdminEmail,
  isInstitutionalEmail,
  normalizeEmail,
  signSessionToken,
  toSafeUser,
  verifyGoogleIdToken,
} from "../services/auth.service.js";
import { applyEvidenceToken, flagIfDuplicateLinkedin, sanitizeEducation } from "../services/alumni-profile.service.js";

const SELF_SERVICE_ROLES = ["student", "alumni"];

// Profile fields a user may supply when registering themselves.
// Anything security-related (role escalation, isVerified, firebaseUid) is never taken from the client.
const REGISTRATION_FIELDS = [
  "branch",
  "batch",
  "skills",
  "bio",
  "linkedinUrl",
  "githubUrl",
  "profilePicture",
  "careerGoal",
  "resumeUrl",
  "currentCompany",
  "currentRole",
  "industry",
  "areasOfExpertise",
  "experience",
  "availableForMentorshipCalls",
  "willingToRefer",
];

const pickRegistrationFields = (body = {}) => {
  const picked = {};
  for (const key of REGISTRATION_FIELDS) {
    if (body[key] !== undefined) picked[key] = body[key];
  }
  return picked;
};

const sendSession = (res, status, user, extra = {}) =>
  res.status(status).json({
    success: true,
    data: {
      user: toSafeUser(user),
      token: signSessionToken(user),
      ...extra,
    },
  });

const fail = (res, status, message) => res.status(status).json({ success: false, message });

/**
 * POST /api/v1/auth/google
 * Body: { idToken, requestedRole: "student" | "alumni" | "admin" }
 */
const googleSignIn = async (req, res) => {
  try {
    const { idToken, requestedRole } = req.body || {};
    if (!idToken) return fail(res, 400, "Google ID token is required.");
    if (requestedRole && !["student", "alumni", "admin"].includes(requestedRole)) {
      return fail(res, 400, "requestedRole must be student, alumni, or admin.");
    }

    let google;
    try {
      google = await verifyGoogleIdToken(idToken);
    } catch (err) {
      return fail(res, err.status || 401, err.status ? err.message : "Google sign-in could not be verified.");
    }

    // Existing account: first by linked Google UID, then by email (links admin-created records, no duplicates).
    let user =
      (await User.findOne({ firebaseUid: google.uid })) || (await User.findOne({ email: google.email }));

    // ---- Admin: decided only by ADMIN_EMAIL on the server ----
    // An existing account keeps its own role (e.g. student) and gets admin rights on top of it.
    if (isAdminEmail(google.email)) {
      if (!user) {
        user = await User.create({
          role: "admin",
          name: google.name,
          email: google.email,
          firebaseUid: google.uid,
          profilePicture: google.picture,
        });
        return sendSession(res, 201, user, { isNewUser: true });
      }
      user.firebaseUid = google.uid;
      await user.save();
      return sendSession(res, 200, user, { isNewUser: false });
    }

    if (requestedRole === "admin") {
      return fail(res, 403, "This Google account does not have administrator access.");
    }

    // ---- Existing student / alumni ----
    if (user) {
      if (user.role === "admin") {
        return fail(res, 403, "This account is not authorized as an administrator.");
      }
      if (requestedRole && requestedRole !== user.role) {
        return fail(
          res,
          409,
          `This email is registered as ${user.role === "alumni" ? "an Alumni" : "a Student"}. Please select "${
            user.role === "alumni" ? "Alumni" : "Student"
          }" and try again.`
        );
      }
      // Google has proven ownership of this email, so link (or re-link) the Google account.
      user.firebaseUid = google.uid;
      if (!user.profilePicture && google.picture) user.profilePicture = google.picture;
      await user.save();
      return sendSession(res, 200, user, { isNewUser: false });
    }

    // ---- New account ----
    if (!requestedRole) return fail(res, 400, "Please select whether you are a Student or an Alumni.");

    if (requestedRole === "student" && !isInstitutionalEmail(google.email)) {
      return fail(
        res,
        403,
        `This Google account is not registered as a student. Sign in with your @${getStudentDomain()} account, or contact the admin.`
      );
    }

    user = await User.create({
      role: requestedRole,
      name: google.name,
      email: google.email,
      firebaseUid: google.uid,
      profilePicture: google.picture,
      profileSource: "self_registered", // alumni start pending admin verification (model default)
    });

    return sendSession(res, 201, user, { isNewUser: true });
  } catch (error) {
    if (error.code === 11000) return fail(res, 409, "An account with this email already exists.");
    console.error("Google sign-in error:", error);
    return fail(res, 500, "Unable to complete Google sign-in.");
  }
};

/**
 * POST /api/v1/auth/login  (also mounted at /api/v1/users/login)
 * Body: { email, password }
 */
const passwordLogin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) return fail(res, 400, "Email and password are required.");

    const user = await User.findOne({ email });
    if (!user) return fail(res, 401, "Incorrect email or password.");

    if (!user.password) {
      return fail(
        res,
        400,
        "This account has no password yet. Use \"Continue with Google\", then set a password from your Profile page if you want one."
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return fail(res, 401, "Incorrect email or password.");

    if (user.role === "admin" && !isAdminEmail(user.email)) {
      return fail(res, 403, "This account is not authorized as an administrator.");
    }

    return sendSession(res, 200, user);
  } catch (error) {
    console.error("Password login error:", error);
    return fail(res, 500, "Unable to complete sign in.");
  }
};

/**
 * POST /api/v1/auth/register  (also mounted at POST /api/v1/users)
 * Self-registration with email + password.
 */
const passwordRegister = async (req, res) => {
  try {
    const { role, name, password } = req.body || {};
    const email = normalizeEmail(req.body?.email);

    if (!role || !name?.trim() || !email || !password) {
      return fail(res, 400, "role, name, email, and password are required.");
    }
    if (!SELF_SERVICE_ROLES.includes(role) || isAdminEmail(email)) {
      return fail(res, 403, "Admin accounts cannot be created through sign-up.");
    }
    if (String(password).trim().length < 6) {
      return fail(res, 400, "Password must be at least 6 characters long.");
    }
    if (role === "student" && !isInstitutionalEmail(email)) {
      return fail(
        res,
        403,
        `Students must register with their @${getStudentDomain()} email. If the admin registered you, sign in instead.`
      );
    }

    if (await User.exists({ email })) {
      return fail(res, 409, "An account with this email already exists. Please sign in instead.");
    }

    const user = new User({
      ...pickRegistrationFields(req.body),
      role,
      name: name.trim(),
      email,
      password: await bcrypt.hash(String(password).trim(), 10),
      profileSource: "self_registered",
    });

    if (role === "alumni") {
      user.education = sanitizeEducation(req.body.education);
      if (req.body.evidenceToken) {
        try {
          applyEvidenceToken(user, req.body.evidenceToken, null);
        } catch (err) {
          return fail(res, err.status || 400, err.message);
        }
      }
      await flagIfDuplicateLinkedin(user);
    }

    await user.save();
    return sendSession(res, 201, user, { isNewUser: true });
  } catch (error) {
    if (error.code === 11000) return fail(res, 409, "An account with this email already exists.");
    if (error.name === "ValidationError") return fail(res, 400, error.message);
    console.error("Register error:", error);
    return fail(res, 500, "Unable to create the account.");
  }
};

/** GET /api/v1/auth/me */
const getCurrentUser = async (req, res) =>
  res.status(200).json({ success: true, data: { user: toSafeUser(req.user) } });

export { googleSignIn, passwordLogin, passwordRegister, getCurrentUser };
