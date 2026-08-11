const dns = require("node:dns");
const nodemailer = require("nodemailer");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === "true",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  return transporter.sendMail({
    from: `"${process.env.MAIL_FROM || "Pizza Delivery"}" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationEmail = async ({
  to,
  name,
  verificationUrl,
}) => {
  return sendEmail({
    to,
    subject: "Verify your Pizza Delivery account",
    text: `Hello ${name}, verify your account using this link: ${verificationUrl}`,
    html: `
      <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background:#fff8f0;border-radius:12px;">
        <h1 style="color:#d62828;text-align:center;">Pizza Delivery</h1>

        <h2>Hello ${name},</h2>

        <p>Thank you for creating your Pizza Delivery account.</p>

        <p>Click the button below to verify your email address:</p>

        <div style="text-align:center;margin:30px 0;">
          <a
            href="${verificationUrl}"
            style="background:#d62828;color:white;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:bold;"
          >
            Verify Email
          </a>
        </div>

        <p>This link expires in 30 minutes.</p>

        <p>If you did not create this account, you can ignore this email.</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async ({
  to,
  name,
  resetUrl,
}) => {
  return sendEmail({
    to,
    subject: "Reset your Pizza Delivery password",
    text: `Hello ${name}, reset your password using this link: ${resetUrl}`,
    html: `
      <div style="max-width:600px;margin:auto;padding:30px;font-family:Arial,sans-serif;background:#fff8f0;border-radius:12px;">
        <h1 style="color:#d62828;text-align:center;">Pizza Delivery</h1>

        <h2>Hello ${name},</h2>

        <p>We received a request to reset your password.</p>

        <p>Click the button below to create a new password:</p>

        <div style="text-align:center;margin:30px 0;">
          <a
            href="${resetUrl}"
            style="background:#d62828;color:white;padding:14px 24px;text-decoration:none;border-radius:8px;font-weight:bold;"
          >
            Reset Password
          </a>
        </div>

        <p>This link expires in 15 minutes.</p>

        <p>If you did not request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
};