const express = require("express");
const { body } = require("express-validator");
const {
  register,
  verifyEmail,
  login,
  resendVerification,
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage("Name must contain between 2 and 60 characters"),

    body("email")
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must contain at least 8 characters")
      .matches(/\d/)
      .withMessage("Password must contain at least one number"),
  ],
  register
);

router.get("/verify-email/:token", verifyEmail);

router.post(
  "/login",
  [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),

    body("password")
      .notEmpty()
      .withMessage("Password is required"),
  ],
  login
);
router.post(
  "/resend-verification",
  [
    body("email")
      .isEmail()
      .withMessage("Enter a valid email address")
      .normalizeEmail(),
  ],
  resendVerification
);
module.exports = router;