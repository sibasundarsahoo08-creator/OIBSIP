const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
} = require("../controllers/orderController");

const {
  protect,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Every order route requires login
router.use(protect);

// Place a new order
router.post("/", createOrder);

// Get all orders belonging to logged-in customer
router.get("/my-orders", getMyOrders);

// Get one order belonging to logged-in customer
router.get("/:orderId", getOrderById);

module.exports = router;