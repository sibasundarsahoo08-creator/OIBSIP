const crypto = require("crypto");
const { validationResult } = require("express-validator");

const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

const getBackendUrl = () => {
  return (
    process.env.BACKEND_URL ||
    `http://localhost:${process.env.PORT || 5000}`
  );
};

const getVerificationUrl = (token) => {
  return `${getBackendUrl()}/api/auth/verify-email/${token}`;
};

const getResetUrl = (token) => {
  const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:5173";

  return `${frontendUrl}/reset-password/${token}`;
};

const register = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = new User({
      name,
      email,
      password,
    });

    const verificationToken =
      user.createEmailVerificationToken();

    await user.save();

    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl: getVerificationUrl(
          verificationToken
        ),
      });
    } catch (emailError) {
      console.error(
        "Verification email error:",
        emailError.message
      );

      return res.status(201).json({
        success: true,
        message:
          "Registration successful, but the verification email could not be sent. Please request another verification email.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Registration successful. Check your email to verify your account.",
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to register user",
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Verification link is invalid or has expired",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      success: true,
      message:
        "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to verify email",
    });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password"
    );

    if (
      !user ||
      !(await user.comparePassword(password))
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message:
          "Please verify your email before logging in",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account exists with this email",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    const verificationToken =
      user.createEmailVerificationToken();

    await user.save({ validateBeforeSave: false });

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl: getVerificationUrl(
        verificationToken
      ),
    });

    return res.status(200).json({
      success: true,
      message:
        "A new verification email has been sent.",
    });
  } catch (error) {
    console.error(
      "Resend verification error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to send another verification email",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset message has been sent.",
      });
    }

    const resetToken =
      user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });

    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl: getResetUrl(resetToken),
    });

    return res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset message has been sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to process password reset request",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select(
      "+passwordResetToken +passwordResetExpires"
    );

    if (!user) {
      return res.status(400).json({
        success: false,
        message:
          "Password reset link is invalid or has expired",
      });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      token,
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  resendVerification,
  forgotPassword,
  resetPassword,
};