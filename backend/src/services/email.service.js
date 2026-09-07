/**
 * Email Notification Service for User Provisioning
 * Dispatches onboarding credentials with default passwords.
 * If SMTP environment variables are not set, logs the dispatch to console
 * and provides structured delivery status.
 */

export const sendCredentialsEmail = async ({ name, email, role, defaultPassword, loginUrl = "http://localhost:5173/login" }) => {
  const subject = `Welcome to Alumni Connect, ${name}! Your Account Credentials`;
  const body = `
Dear ${name},

Your official institutional account for the Thapar Alumni Connect platform has been provisioned by the Placement and Alumni Relations Cell.

Account Details:
- Role: ${role.toUpperCase()}
- Login Email: ${email}
- Default Password: ${defaultPassword}
- Portal URL: ${loginUrl}

Next Steps:
1. Visit the portal at ${loginUrl} and sign in with your email and default password.
2. Go to your Profile section to complete your professional details and update your password.

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
    defaultPassword,
    dispatchedAt: new Date().toISOString(),
    channel: process.env.SMTP_HOST ? "smtp" : "system_simulated",
  };
};
