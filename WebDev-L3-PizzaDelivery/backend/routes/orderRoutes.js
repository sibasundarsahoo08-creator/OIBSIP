const express = require("express");

const {
  createOrder,
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
} = require("../controllers/orderController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Every order route requires login
router.use(protect);

// Place a Cash-on-Delivery order
router.post("/", createOrder);

// Create a Razorpay payment order
router.post(
  "/razorpay/create",
  createRazorpayOrder
);

// Verify Razorpay payment and complete the order
router.post(
  "/razorpay/verify",
  verifyRazorpayPayment
);

// Get orders belonging to the logged-in customer
router.get("/my-orders", getMyOrders);

// Keep this dynamic route last
router.get("/:orderId", getOrderById);

module.exports = router;