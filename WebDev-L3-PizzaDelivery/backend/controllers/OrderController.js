const mongoose = require("mongoose");

const Order = require("../models/Order");
const Pizza = require("../models/Pizza");
const Ingredient = require("../models/Ingredient");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getIngredientId = (value) => {
  if (typeof value === "string") {
    return value;
  }

  return value?.ingredientId;
};

const loadIngredient = async (
  value,
  expectedCategory,
  session
) => {
  const ingredientId = getIngredientId(value);

  if (!mongoose.isValidObjectId(ingredientId)) {
    throw createError(
      400,
      `Invalid ${expectedCategory} selection`
    );
  }

  const ingredient = await Ingredient.findById(
    ingredientId
  ).session(session);

  if (!ingredient) {
    throw createError(
      404,
      `Selected ${expectedCategory} was not found`
    );
  }

  if (ingredient.category !== expectedCategory) {
    throw createError(
      400,
      `${ingredient.name} is not a valid ${expectedCategory}`
    );
  }

  if (!ingredient.isAvailable || ingredient.stock <= 0) {
    throw createError(
      400,
      `${ingredient.name} is currently unavailable`
    );
  }

  return ingredient;
};

const createIngredientSnapshot = (ingredient) => ({
  ingredientId: ingredient._id,
  name: ingredient.name,
  price: ingredient.price,
});

const addStockRequirement = (
  stockRequirements,
  ingredient,
  quantity
) => {
  const ingredientId = ingredient._id.toString();
  const existing = stockRequirements.get(ingredientId);

  stockRequirements.set(ingredientId, {
    ingredientId: ingredient._id,
    name: ingredient.name,
    quantity: (existing?.quantity || 0) + quantity,
  });
};

const validateDeliveryAddress = (deliveryAddress) => {
  const requiredFields = [
    "fullName",
    "phone",
    "addressLine",
    "city",
    "state",
    "postalCode",
  ];

  if (!deliveryAddress) {
    throw createError(
      400,
      "Delivery address is required"
    );
  }

  const cleanedAddress = {};

  for (const field of requiredFields) {
    const value = String(
      deliveryAddress[field] || ""
    ).trim();

    if (!value) {
      throw createError(
        400,
        `${field} is required`
      );
    }

    cleanedAddress[field] = value;
  }

  if (
    !/^[0-9+\-\s]{10,15}$/.test(
      cleanedAddress.phone
    )
  ) {
    throw createError(
      400,
      "Enter a valid phone number"
    );
  }

  if (
    !/^[A-Za-z0-9\-\s]{4,10}$/.test(
      cleanedAddress.postalCode
    )
  ) {
    throw createError(
      400,
      "Enter a valid postal code"
    );
  }

  return cleanedAddress;
};

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { items, deliveryAddress } = req.body;
    const paymentMethod =
      req.body.paymentMethod || "cod";

    if (!Array.isArray(items) || items.length === 0) {
      throw createError(
        400,
        "Your cart is empty"
      );
    }

    if (paymentMethod !== "cod") {
      throw createError(
        400,
        "Online payment will be added in the payment step"
      );
    }

    const safeAddress =
      validateDeliveryAddress(deliveryAddress);

    let createdOrder;

    await session.withTransaction(async () => {
      const safeOrderItems = [];
      const stockRequirements = new Map();

      for (const cartItem of items) {
        const quantity = Number(
          cartItem.quantity || 1
        );

        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          quantity > 20
        ) {
          throw createError(
            400,
            "Pizza quantity must be between 1 and 20"
          );
        }

        if (cartItem.itemType === "catalogue") {
          if (
            !mongoose.isValidObjectId(
              cartItem.pizzaId
            )
          ) {
            throw createError(
              400,
              "Invalid catalogue pizza"
            );
          }

          const pizza = await Pizza.findById(
            cartItem.pizzaId
          ).session(session);

          if (!pizza) {
            throw createError(
              404,
              "A pizza in your cart was not found"
            );
          }

          if (!pizza.isAvailable) {
            throw createError(
              400,
              `${pizza.name} is currently unavailable`
            );
          }

          safeOrderItems.push({
            itemType: "catalogue",
            pizzaId: pizza._id,
            name: pizza.name,
            emoji: pizza.emoji || "🍕",
            price: pizza.price,
            quantity,
            customPizza: null,
          });

          continue;
        }

        if (cartItem.itemType !== "custom") {
          throw createError(
            400,
            "Invalid cart item type"
          );
        }

        const customPizza = cartItem.customPizza;

        if (!customPizza) {
          throw createError(
            400,
            "Custom pizza details are missing"
          );
        }

        const base = await loadIngredient(
          customPizza.base,
          "base",
          session
        );

        const sauce = await loadIngredient(
          customPizza.sauce,
          "sauce",
          session
        );

        const cheese = await loadIngredient(
          customPizza.cheese,
          "cheese",
          session
        );

        const vegetableInputs = Array.isArray(
          customPizza.vegetables
        )
          ? customPizza.vegetables
          : [];

        const vegetables = [];
        const selectedVegetableIds = new Set();

        for (const vegetableInput of vegetableInputs) {
          const vegetableId =
            getIngredientId(vegetableInput);

          if (
            selectedVegetableIds.has(
              String(vegetableId)
            )
          ) {
            throw createError(
              400,
              "The same vegetable cannot be selected twice"
            );
          }

          const vegetable = await loadIngredient(
            vegetableInput,
            "vegetable",
            session
          );

          selectedVegetableIds.add(
            vegetable._id.toString()
          );

          vegetables.push(vegetable);
        }

        const customPizzaPrice =
          Number(base.price) +
          Number(sauce.price) +
          Number(cheese.price) +
          vegetables.reduce(
            (total, vegetable) =>
              total + Number(vegetable.price),
            0
          );

        addStockRequirement(
          stockRequirements,
          base,
          quantity
        );

        addStockRequirement(
          stockRequirements,
          sauce,
          quantity
        );

        addStockRequirement(
          stockRequirements,
          cheese,
          quantity
        );

        for (const vegetable of vegetables) {
          addStockRequirement(
            stockRequirements,
            vegetable,
            quantity
          );
        }

        safeOrderItems.push({
          itemType: "custom",
          pizzaId: null,
          name: "My Custom Pizza",
          emoji: "🍕",
          price: customPizzaPrice,
          quantity,
          customPizza: {
            base: createIngredientSnapshot(base),
            sauce: createIngredientSnapshot(sauce),
            cheese: createIngredientSnapshot(cheese),
            vegetables: vegetables.map(
              createIngredientSnapshot
            ),
          },
        });
      }

      for (const requirement of stockRequirements.values()) {
        const result = await Ingredient.updateOne(
          {
            _id: requirement.ingredientId,
            isAvailable: true,
            stock: {
              $gte: requirement.quantity,
            },
          },
          {
            $inc: {
              stock: -requirement.quantity,
            },
          },
          {
            session,
          }
        );

        if (result.modifiedCount !== 1) {
          throw createError(
            400,
            `${requirement.name} does not have enough stock`
          );
        }

        const updatedIngredient =
          await Ingredient.findById(
            requirement.ingredientId
          ).session(session);

        if (updatedIngredient.stock === 0) {
          updatedIngredient.isAvailable = false;
          await updatedIngredient.save({
            session,
          });
        }
      }

      const subtotal = safeOrderItems.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      );

      const deliveryFee = 40;
      const totalAmount = subtotal + deliveryFee;

      const orders = await Order.create(
        [
          {
            user: req.user._id,
            items: safeOrderItems,
            deliveryAddress: safeAddress,
            subtotal,
            deliveryFee,
            totalAmount,
            paymentMethod: "cod",
            paymentStatus: "pending",
            orderStatus: "placed",
          },
        ],
        {
          session,
        }
      );

      createdOrder = orders[0];
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order: createdOrder,
    });
  } catch (error) {
    const statusCode =
      error.statusCode ||
      (error.name === "ValidationError"
        ? 400
        : 500);

    return res.status(statusCode).json({
      success: false,
      message:
        statusCode === 500
          ? "Unable to place order"
          : error.message,
    });
  } finally {
    await session.endSession();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load your orders",
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    if (
      !mongoose.isValidObjectId(req.params.orderId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load order",
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
};