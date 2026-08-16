const express = require("express");

const {
  getDashboardStats,
  getInventory,
  updateIngredient,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/adminController");

const {
  protect,
  authorizeRoles,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Every route below requires an admin account
router.use(protect);
router.use(authorizeRoles("admin"));

router.get("/dashboard", getDashboardStats);

router.get("/inventory", getInventory);

router.patch(
  "/inventory/:ingredientId",
  updateIngredient
);

router.get("/orders", getAllOrders);

router.patch(
  "/orders/:orderId/status",
  updateOrderStatus
);

module.exports = router;