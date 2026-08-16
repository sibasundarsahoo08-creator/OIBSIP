const mongoose = require("mongoose");

const User = require("../models/User");
const Order = require("../models/Order");
const Ingredient = require("../models/Ingredient");
const Pizza = require("../models/Pizza");

const orderStatuses = [
  "placed",
  "confirmed",
  "preparing",
  "out-for-delivery",
  "delivered",
  "cancelled",
];

const sendServerError = (res, message) => {
  return res.status(500).json({
    success: false,
    message,
  });
};

const getDashboardStats = async (_req, res) => {
  try {
    const [
      totalUsers,
      totalOrders,
      pendingOrders,
      ingredientCount,
      pizzaCount,
      lowStockIngredients,
      orderValueResult,
      recentOrders,
    ] = await Promise.all([
      User.countDocuments({
        role: "user",
      }),

      Order.countDocuments(),

      Order.countDocuments({
        orderStatus: {
          $nin: ["delivered", "cancelled"],
        },
      }),

      Ingredient.countDocuments(),

      Pizza.countDocuments({
        isAvailable: true,
      }),

      Ingredient.countDocuments({
        $expr: {
          $lte: [
            "$stock",
            "$lowStockThreshold",
          ],
        },
      }),

      Order.aggregate([
        {
          $match: {
            orderStatus: {
              $ne: "cancelled",
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),

      Order.find()
        .populate("user", "name email")
        .sort({
          createdAt: -1,
        })
        .limit(5),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        pendingOrders,
        ingredientCount,
        pizzaCount,
        lowStockIngredients,
        totalOrderValue:
          orderValueResult[0]?.total || 0,
      },
      recentOrders,
    });
  } catch {
    return sendServerError(
      res,
      "Unable to load admin dashboard"
    );
  }
};

const getInventory = async (_req, res) => {
  try {
    const ingredients = await Ingredient.find().sort({
      category: 1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: ingredients.length,
      ingredients,
    });
  } catch {
    return sendServerError(
      res,
      "Unable to load inventory"
    );
  }
};

const updateIngredient = async (req, res) => {
  try {
    const { ingredientId } = req.params;

    if (!mongoose.isValidObjectId(ingredientId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ingredient ID",
      });
    }

    const ingredient =
      await Ingredient.findById(ingredientId);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: "Ingredient not found",
      });
    }

    const {
      stock,
      price,
      lowStockThreshold,
      isAvailable,
    } = req.body;

    if (stock !== undefined) {
      const stockValue = Number(stock);

      if (
        !Number.isInteger(stockValue) ||
        stockValue < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be a non-negative whole number",
        });
      }

      ingredient.stock = stockValue;

      if (stockValue === 0) {
        ingredient.isAvailable = false;
      } else if (isAvailable === undefined) {
        ingredient.isAvailable = true;
      }
    }

    if (price !== undefined) {
      const priceValue = Number(price);

      if (
        !Number.isFinite(priceValue) ||
        priceValue < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Price must be a non-negative number",
        });
      }

      ingredient.price = priceValue;
    }

    if (lowStockThreshold !== undefined) {
      const thresholdValue = Number(
        lowStockThreshold
      );

      if (
        !Number.isInteger(thresholdValue) ||
        thresholdValue < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Low-stock threshold must be a non-negative whole number",
        });
      }

      ingredient.lowStockThreshold =
        thresholdValue;
    }

    if (typeof isAvailable === "boolean") {
      if (ingredient.stock === 0 && isAvailable) {
        return res.status(400).json({
          success: false,
          message:
            "An ingredient with zero stock cannot be made available",
        });
      }

      ingredient.isAvailable = isAvailable;
    }

    await ingredient.save();

    return res.status(200).json({
      success: true,
      message: "Ingredient updated successfully",
      ingredient,
    });
  } catch {
    return sendServerError(
      res,
      "Unable to update ingredient"
    );
  }
};

const getAllOrders = async (req, res) => {
  try {
    const query = {};

    if (req.query.status) {
      if (
        !orderStatuses.includes(req.query.status)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order status filter",
        });
      }

      query.orderStatus = req.query.status;
    }

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch {
    return sendServerError(
      res,
      "Unable to load customer orders"
    );
  }
};

const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { orderId } = req.params;
    const { orderStatus } = req.body;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    if (!orderStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findById(
        orderId
      ).session(session);

      if (!order) {
        const error = new Error(
          "Order not found"
        );

        error.statusCode = 404;
        throw error;
      }

      if (order.orderStatus === orderStatus) {
        const error = new Error(
          `Order is already ${orderStatus}`
        );

        error.statusCode = 400;
        throw error;
      }

      if (
        order.orderStatus === "delivered" ||
        order.orderStatus === "cancelled"
      ) {
        const error = new Error(
          `A ${order.orderStatus} order cannot be changed`
        );

        error.statusCode = 400;
        throw error;
      }

      if (orderStatus !== "cancelled") {
        const currentIndex = orderStatuses.indexOf(
          order.orderStatus
        );

        const newIndex =
          orderStatuses.indexOf(orderStatus);

        if (
          newIndex <= currentIndex ||
          orderStatus === "placed"
        ) {
          const error = new Error(
            "Order status cannot move backwards"
          );

          error.statusCode = 400;
          throw error;
        }
      }

      if (orderStatus === "cancelled") {
        for (const item of order.items) {
          if (
            item.itemType !== "custom" ||
            !item.customPizza
          ) {
            continue;
          }

          const selectedIngredients = [
            item.customPizza.base,
            item.customPizza.sauce,
            item.customPizza.cheese,
            ...(item.customPizza.vegetables || []),
          ];

          for (const selected of selectedIngredients) {
            if (!selected?.ingredientId) {
              continue;
            }

            await Ingredient.updateOne(
              {
                _id: selected.ingredientId,
              },
              {
                $inc: {
                  stock: item.quantity,
                },
                $set: {
                  isAvailable: true,
                },
              },
              {
                session,
              }
            );
          }
        }
      }

      order.orderStatus = orderStatus;

      if (
        orderStatus === "delivered" &&
        order.paymentMethod === "cod"
      ) {
        order.paymentStatus = "paid";
      }

      await order.save({
        session,
      });

      updatedOrder = order;
    });

    await updatedOrder.populate(
      "user",
      "name email"
    );

    return res.status(200).json({
      success: true,
      message: `Order status changed to ${orderStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({
        success: false,
        message:
          error.statusCode
            ? error.message
            : "Unable to update order status",
      });
  } finally {
    await session.endSession();
  }
};

module.exports = {
  getDashboardStats,
  getInventory,
  updateIngredient,
  getAllOrders,
  updateOrderStatus,
};