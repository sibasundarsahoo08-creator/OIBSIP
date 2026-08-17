const mongoose = require("mongoose");

const pizzaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "", trim: true },
    emoji: { type: String, default: "🍕" },
    menuSection: {
      type: String,
      enum: ["pizza", "starter", "drink"],
      default: "pizza",
      index: true,
    },
    category: {
      type: String,
      enum: ["vegetarian", "non-vegetarian"],
      default: "vegetarian",
    },
    isFeatured: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pizza", pizzaSchema);
