const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Order = require("../models/Order");
const Pizza = require("../models/Pizza");
const Ingredient = require("../models/Ingredient");

const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getRazorpayClient = () => {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw createError(
      500,
      "Razorpay payment is not configured"
    );
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const applySession = (query, session) => {
  if (session) {
    query.session(session);
  }

  return query;
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
  session = null
) => {
  const ingredientId = getIngredientId(value);

  if (!mongoose.isValidObjectId(ingredientId)) {
    throw createError(
      400,
      `Invalid ${expectedCategory} selection`
    );
  }

  const ingredientQuery =
    Ingredient.findById(ingredientId);

  const ingredient = await applySession(
    ingredientQuery,
    session
  );

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

  if (
    !ingredient.isAvailable ||
    ingredient.stock <= 0
  ) {
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
    quantity:
      (existing?.quantity || 0) + quantity,
  });
};

const addStoredStockRequirement = (
  stockRequirements,
  selection,
  quantity
) => {
  const ingredientId = selection?.ingredientId;

  if (!mongoose.isValidObjectId(ingredientId)) {
    throw createError(
      500,
      "An ingredient stored in this order is invalid"
    );
  }

  const id = ingredientId.toString();
  const existing = stockRequirements.get(id);

  stockRequirements.set(id, {
    ingredientId,
    name: selection.name,
    quantity:
      (existing?.quantity || 0) + quantity,
  });
};

const validateDeliveryAddress = (
  deliveryAddress
) => {
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

const buildOrderDetails = async (
  items,
  deliveryAddress,
  session = null
) => {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(
      400,
      "Your cart is empty"
    );
  }

  const safeAddress =
    validateDeliveryAddress(deliveryAddress);

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
        "Item quantity must be between 1 and 20"
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
          "Invalid catalogue item"
        );
      }

      const pizzaQuery = Pizza.findById(
        cartItem.pizzaId
      );

      const pizza = await applySession(
        pizzaQuery,
        session
      );

      if (!pizza) {
        throw createError(
          404,
          "An item in your cart was not found"
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
        image: pizza.image || "",
        emoji: pizza.emoji || "🍕",
        menuSection: pizza.menuSection || "pizza",
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
      image: "/menu/custom-pizza.webp",
      emoji: "🍕",
      menuSection: "pizza",
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

  const subtotal = safeOrderItems.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  const deliveryFee = 40;
  const totalAmount = subtotal + deliveryFee;

  return {
    safeAddress,
    safeOrderItems,
    stockRequirements,
    subtotal,
    deliveryFee,
    totalAmount,
  };
};

const createStoredStockRequirements = (
  order
) => {
  const stockRequirements = new Map();

  for (const item of order.items) {
    if (
      item.itemType !== "custom" ||
      !item.customPizza
    ) {
      continue;
    }

    const quantity = Number(item.quantity || 1);

    addStoredStockRequirement(
      stockRequirements,
      item.customPizza.base,
      quantity
    );

    addStoredStockRequirement(
      stockRequirements,
      item.customPizza.sauce,
      quantity
    );

    addStoredStockRequirement(
      stockRequirements,
      item.customPizza.cheese,
      quantity
    );

    for (
      const vegetable of
      item.customPizza.vegetables || []
    ) {
      addStoredStockRequirement(
        stockRequirements,
        vegetable,
        quantity
      );
    }
  }

  return stockRequirements;
};

const ensureStockIsAvailable = async (
  stockRequirements
) => {
  for (const requirement of stockRequirements.values()) {
    const ingredient = await Ingredient.findOne({
      _id: requirement.ingredientId,
      isAvailable: true,
      stock: {
        $gte: requirement.quantity,
      },
    });

    if (!ingredient) {
      throw createError(
        400,
        `${requirement.name} does not have enough stock`
      );
    }
  }
};

const deductIngredientStock = async (
  stockRequirements,
  session
) => {
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

    if (
      updatedIngredient &&
      updatedIngredient.stock === 0
    ) {
      updatedIngredient.isAvailable = false;

      await updatedIngredient.save({
        session,
      });
    }
  }
};

const sendOrderError = (
  res,
  error,
  fallbackMessage
) => {
  const statusCode =
    error.statusCode ||
    (error.name === "ValidationError"
      ? 400
      : 500);

  if (statusCode === 500) {
    console.error(fallbackMessage, error.message);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? fallbackMessage
        : error.message,
  });
};

/*
 * Cash-on-Delivery order
 */
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const paymentMethod =
      req.body.paymentMethod || "cod";

    if (paymentMethod !== "cod") {
      throw createError(
        400,
        "Use the Razorpay payment endpoint for online payment"
      );
    }

    let createdOrder;

    await session.withTransaction(async () => {
      const orderDetails =
        await buildOrderDetails(
          req.body.items,
          req.body.deliveryAddress,
          session
        );

      await deductIngredientStock(
        orderDetails.stockRequirements,
        session
      );

      const orders = await Order.create(
        [
          {
            user: req.user._id,
            items: orderDetails.safeOrderItems,
            deliveryAddress:
              orderDetails.safeAddress,
            subtotal: orderDetails.subtotal,
            deliveryFee:
              orderDetails.deliveryFee,
            totalAmount:
              orderDetails.totalAmount,
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
    return sendOrderError(
      res,
      error,
      "Unable to place order"
    );
  } finally {
    await session.endSession();
  }
};

/*
 * Create a Razorpay order
 */
const createRazorpayOrder = async (req, res) => {
  try {
    const orderDetails = await buildOrderDetails(
      req.body.items,
      req.body.deliveryAddress
    );

    await ensureStockIsAvailable(
      orderDetails.stockRequirements
    );

    const razorpay = getRazorpayClient();

    const amountInPaise = Math.round(
      orderDetails.totalAmount * 100
    );

    const receipt = `PZ${Date.now()}${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    let razorpayOrder;

    try {
      razorpayOrder =
        await razorpay.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt,
          notes: {
            userId: req.user._id.toString(),
            purpose: "Pizza Delivery Order",
          },
        });
    } catch (error) {
      console.error(
        "Razorpay order creation failed:",
        error.error?.description || error.message
      );

      throw createError(
        502,
        "Unable to start Razorpay payment"
      );
    }

    const localOrder = await Order.create({
      user: req.user._id,
      items: orderDetails.safeOrderItems,
      deliveryAddress: orderDetails.safeAddress,
      subtotal: orderDetails.subtotal,
      deliveryFee: orderDetails.deliveryFee,
      totalAmount: orderDetails.totalAmount,
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      razorpayOrderId: razorpayOrder.id,
      orderStatus: "placed",
    });

    return res.status(201).json({
      success: true,
      message: "Razorpay order created",
      keyId: process.env.RAZORPAY_KEY_ID,
      localOrderId: localOrder._id,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (error) {
    return sendOrderError(
      res,
      error,
      "Unable to start Razorpay payment"
    );
  }
};

/*
 * Verify and capture a Razorpay payment
 */
const verifyRazorpayPayment = async (
  req,
  res
) => {
  const {
    localOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    !localOrderId ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Complete Razorpay payment details are required",
    });
  }

  if (!mongoose.isValidObjectId(localOrderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid local order ID",
    });
  }

  let session;

  try {
    const localOrder = await Order.findOne({
      _id: localOrderId,
      user: req.user._id,
      paymentMethod: "razorpay",
    }).select("+razorpaySignature");

    if (!localOrder) {
      throw createError(
        404,
        "Razorpay order was not found"
      );
    }

    if (localOrder.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment was already verified",
        order: localOrder,
      });
    }

    if (
      localOrder.razorpayOrderId !==
      razorpay_order_id
    ) {
      throw createError(
        400,
        "Razorpay order ID does not match"
      );
    }

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${localOrder.razorpayOrderId}|${razorpay_payment_id}`
      )
      .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    const receivedBuffer = Buffer.from(
      String(razorpay_signature),
      "utf8"
    );

    const signatureIsValid =
      expectedBuffer.length ===
        receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!signatureIsValid) {
      throw createError(
        400,
        "Payment signature verification failed"
      );
    }

    const duplicatePayment = await Order.findOne({
      razorpayPaymentId: razorpay_payment_id,
      _id: {
        $ne: localOrder._id,
      },
    });

    if (duplicatePayment) {
      throw createError(
        409,
        "This Razorpay payment was already used"
      );
    }

    const stockRequirements =
      createStoredStockRequirements(localOrder);

    await ensureStockIsAvailable(
      stockRequirements
    );

    const razorpay = getRazorpayClient();

    let payment;

    try {
      payment = await razorpay.payments.fetch(
        razorpay_payment_id
      );

      const expectedAmount = Math.round(
        localOrder.totalAmount * 100
      );

      if (
        payment.order_id !==
          localOrder.razorpayOrderId ||
        Number(payment.amount) !== expectedAmount ||
        payment.currency !== "INR"
      ) {
        throw createError(
          400,
          "Razorpay payment details do not match this order"
        );
      }

      if (
        payment.status === "authorized" &&
        !payment.captured
      ) {
        payment =
          await razorpay.payments.capture(
            razorpay_payment_id,
            expectedAmount,
            "INR"
          );
      }

      if (
        payment.status !== "captured" &&
        !payment.captured
      ) {
        throw createError(
          400,
          "Razorpay payment has not been captured"
        );
      }
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }

      console.error(
        "Razorpay payment check failed:",
        error.error?.description || error.message
      );

      throw createError(
        502,
        "Unable to confirm Razorpay payment"
      );
    }

    session = await mongoose.startSession();

    let completedOrder;

    await session.withTransaction(async () => {
      const transactionOrder =
        await Order.findOne({
          _id: localOrder._id,
          user: req.user._id,
          paymentMethod: "razorpay",
        })
          .select("+razorpaySignature")
          .session(session);

      if (!transactionOrder) {
        throw createError(
          404,
          "Order was not found"
        );
      }

      if (
        transactionOrder.paymentStatus === "paid"
      ) {
        completedOrder = transactionOrder;
        return;
      }

      const transactionStockRequirements =
        createStoredStockRequirements(
          transactionOrder
        );

      await deductIngredientStock(
        transactionStockRequirements,
        session
      );

      transactionOrder.paymentStatus = "paid";
      transactionOrder.razorpayPaymentId =
        razorpay_payment_id;
      transactionOrder.razorpaySignature =
        razorpay_signature;
      transactionOrder.paymentCompletedAt =
        new Date();
      transactionOrder.orderStatus = "placed";

      await transactionOrder.save({
        session,
      });

      completedOrder = transactionOrder;
    });

    return res.status(200).json({
      success: true,
      message:
        "Payment verified and order placed successfully",
      order: completedOrder,
    });
  } catch (error) {
    return sendOrderError(
      res,
      error,
      "Unable to verify Razorpay payment"
    );
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id,
      $or: [
        {
          paymentMethod: "cod",
        },
        {
          paymentMethod: "razorpay",
          paymentStatus: "paid",
        },
      ],
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
      !mongoose.isValidObjectId(
        req.params.orderId
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await Order.findOne({
      _id: req.params.orderId,
      user: req.user._id,
      $or: [
        {
          paymentMethod: "cod",
        },
        {
          paymentMethod: "razorpay",
          paymentStatus: "paid",
        },
      ],
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
  createRazorpayOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderById,
};
