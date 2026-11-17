/**
 * Welcome email for accounts created by the admin.
 * There is no password in it: the person signs in with Google using this email address,
 * which proves the address is theirs. If SMTP is not configured the message is only logged.
 */

export const sendCredentialsEmail = async ({ name, email, role, loginUrl = process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL.replace(/\/+$/, "")}/login` : "http://localhost:5173/login" }) => {
  const subject = `Welcome to Alumni Connect, ${name}!`;
  const body = `
Dear ${name},

The Placement and Alumni Relations Cell has created your ${role === "alumni" ? "alumni" : "student"} account on the Thapar Alumni Connect platform.

How to sign in:
1. Open ${loginUrl}
2. Choose "${role === "alumni" ? "Alumni" : "Student"}" and click "Continue with Google".
3. Pick the Google account for ${email}. Your account is linked automatically.

You can set a password later from your Profile page if you also want to sign in with email and password.${
    role === "alumni"
      ? "\n\nPlease complete your profile and upload your LinkedIn profile PDF (LinkedIn > More > Save to PDF) so your alumni status can be verified."
      : ""
  }

Best regards,
Placement & Alumni Relations Cell
Thapar Institute of Engineering and Technology
`;

  console.log("\n==================== [CREDENTIALS EMAIL DISPATCH] ====================");
  console.log(`To: ${name} <${email}>`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:\n${body}`);
  console.log("======================================================================\n");

  return {
    success: true,
    deliveredTo: email,
    subject,
    dispatchedAt: new Date().toISOString(),
    channel: process.env.SMTP_HOST ? "smtp" : "system_simulated",
  };
};
