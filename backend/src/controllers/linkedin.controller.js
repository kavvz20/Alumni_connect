import { User } from "../models/index.js";
import {
  buildAuthorizationUrl,
  downloadPictureAsDataUrl,
  fetchLinkedinProfile,
  getFrontendUrl,
  isLinkedinConnectConfigured,
  verifyState,
} from "../services/linkedin-oidc.service.js";

const backToProfile = (res, result) => res.redirect(302, `${getFrontendUrl()}/profile?linkedin=${encodeURIComponent(result)}`);

/** GET /api/v1/linkedin/status — whether the "Connect LinkedIn" button should be shown. */
const getLinkedinStatus = (req, res) =>
  res.status(200).json({ success: true, data: { configured: isLinkedinConnectConfigured() } });

/** GET /api/v1/linkedin/connect — returns the LinkedIn authorization URL for the signed-in user. */
const startLinkedinConnect = (req, res) => {
  try {
    return res.status(200).json({ success: true, data: { url: buildAuthorizationUrl(req.user._id) } });
  } catch (err) {
    return res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/**
 * GET /api/v1/linkedin/callback — LinkedIn sends the browser here after the user approves.
 * Saves the LinkedIn account and applies the LinkedIn profile photo, then returns to /profile.
 */
const linkedinCallback = async (req, res) => {
  const { code, state, error } = req.query;
  if (error) return backToProfile(res, "cancelled");
  if (!code || !state) return backToProfile(res, "error");

  try {
    const userId = verifyState(state);
    const user = await User.findById(userId);
    if (!user) return backToProfile(res, "error");

    const profile = await fetchLinkedinProfile(code);

    // One LinkedIn account per user
    const other = await User.findOne({ "linkedinAccount.sub": profile.sub, _id: { $ne: user._id } }).select("_id");
    if (other) return backToProfile(res, "in_use");

    user.linkedinAccount = {
      sub: profile.sub,
      name: profile.name,
      email: profile.email,
      emailVerified: profile.emailVerified,
      connectedAt: new Date(),
    };

    let photoApplied = false;
    try {
      const photo = await downloadPictureAsDataUrl(profile.picture);
      if (photo) {
        user.profilePicture = photo;
        photoApplied = true;
      }
    } catch (photoErr) {
      console.warn("LinkedIn photo download failed:", photoErr.message);
    }

    await user.save();
    return backToProfile(res, photoApplied ? "connected" : "no_photo");
  } catch (err) {
    if (err.code !== "bad_state") console.error("LinkedIn connect error:", err.message);
    return backToProfile(res, err.code === "bad_state" ? "expired" : "error");
  }
};

export { getLinkedinStatus, startLinkedinConnect, linkedinCallback };
