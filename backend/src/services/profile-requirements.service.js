/**
 * What an alumni profile needs before the alumnus can use the portal and appear in the directory.
 *
 * Always: name, LinkedIn URL, batch and department (stored as `profileCompleted`).
 * Once the LinkedIn sign-in keys are configured: the alumnus must also connect their LinkedIn
 * account (official "Sign In with LinkedIn"), which confirms the LinkedIn name for verification.
 * This is checked at request time, so setting the keys applies it to existing accounts too.
 */

export const isLinkedinConnectConfigured = () =>
  Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET && process.env.LINKEDIN_REDIRECT_URI);

export const isLinkedinConnectRequired = () => isLinkedinConnectConfigured();

/** True when this alumni record meets every requirement (non-alumni are always complete). */
export const isAlumniProfileComplete = (user) => {
  if (!user || user.role !== "alumni") return true;
  if (!user.profileCompleted) return false;
  return !isLinkedinConnectRequired() || Boolean(user.linkedinAccount?.sub);
};

/** MongoDB conditions an alumni record must meet to be listed / visible to others. */
export const completeAlumniFilter = () =>
  isLinkedinConnectRequired()
    ? { profileCompleted: true, "linkedinAccount.sub": { $exists: true, $ne: null } }
    : { profileCompleted: true };
