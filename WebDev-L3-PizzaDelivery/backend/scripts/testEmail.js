require("dotenv").config();

const {
  verifyEmailConnection,
  sendEmail,
} = require("../services/emailService");

const testEmail = async () => {
  try {
    await verifyEmailConnection();

    console.log("Gmail SMTP connection successful");

    await sendEmail({
      to: process.env.MAIL_USER,
      subject: "Pizza Delivery Email Test",
      text: "Your Pizza Delivery email configuration is working.",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px;">
          <h2 style="color: #e63946;">Pizza Delivery</h2>
          <p>Your email configuration is working successfully.</p>
        </div>
      `,
    });

    console.log("Test email sent successfully");
    process.exit(0);
  } catch (error) {
    console.error("Email test failed:", error.message);
    process.exit(1);
  }
};

testEmail();