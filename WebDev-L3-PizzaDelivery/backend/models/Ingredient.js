const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "base",
        "sauce",
        "cheese",
        "vegetable",
      ],
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 100,
    },

    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 20,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    lowStockAlertSent: {
      type: Boolean,
      default: false,
    },

    lowStockAlertSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ingredientSchema.pre("save", function () {
  if (this.stock === 0) {
    this.isAvailable = false;
  }

  if (this.stock > this.lowStockThreshold) {
    this.lowStockAlertSent = false;
    this.lowStockAlertSentAt = null;
  }
});

ingredientSchema.index({
  stock: 1,
  lowStockThreshold: 1,
  lowStockAlertSent: 1,
});

module.exports = mongoose.model(
  "Ingredient",
  ingredientSchema
);