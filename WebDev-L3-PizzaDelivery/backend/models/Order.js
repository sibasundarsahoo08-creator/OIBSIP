const mongoose = require("mongoose");

const ingredientSelectionSchema = new mongoose.Schema(
  {
    ingredientId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const customPizzaSchema = new mongoose.Schema(
  {
    base: {
      type: ingredientSelectionSchema,
      required: true,
    },
    sauce: {
      type: ingredientSelectionSchema,
      required: true,
    },
    cheese: {
      type: ingredientSelectionSchema,
      required: true,
    },
    vegetables: {
      type: [ingredientSelectionSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

const orderItemSchema = new mongoose.Schema(
  {
    itemType: {
      type: String,
      enum: ["catalogue", "custom"],
      required: true,
    },
    pizzaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pizza",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    emoji: {
      type: String,
      default: "🍕",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    customPizza: {
      type: customPizzaSchema,
      default: null,
    },
  },
  {
    _id: true,
  }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    addressLine: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      default: () =>
        `ORD-${Date.now()}-${Math.floor(
          1000 + Math.random() * 9000
        )}`,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return items.length > 0;
        },
        message: "An order must contain at least one item",
      },
    },

    deliveryAddress: {
      type: addressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryFee: {
      type: Number,
      required: true,
      min: 0,
      default: 40,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay"],
      default: "cod",
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
    },

    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
      select: false,
    },

    paymentCompletedAt: {
      type: Date,
      default: null,
    },

    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "preparing",
        "out-for-delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  razorpayPaymentId: 1,
});

module.exports = mongoose.model(
  "Order",
  orderSchema
);