require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");

const Ingredient = require("../models/Ingredient");
const Pizza = require("../models/Pizza");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const ingredients = [
  // 5 pizza bases
  {
    name: "Classic Hand Tossed",
    category: "base",
    price: 120,
    stock: 100,
  },
  {
    name: "Thin Crust",
    category: "base",
    price: 140,
    stock: 100,
  },
  {
    name: "Cheese Burst",
    category: "base",
    price: 190,
    stock: 100,
  },
  {
    name: "Whole Wheat",
    category: "base",
    price: 160,
    stock: 100,
  },
  {
    name: "Pan Pizza",
    category: "base",
    price: 150,
    stock: 100,
  },

  // 5 sauces
  {
    name: "Classic Tomato",
    category: "sauce",
    price: 30,
    stock: 100,
  },
  {
    name: "Spicy Schezwan",
    category: "sauce",
    price: 40,
    stock: 100,
  },
  {
    name: "Creamy Pesto",
    category: "sauce",
    price: 60,
    stock: 100,
  },
  {
    name: "Barbecue",
    category: "sauce",
    price: 50,
    stock: 100,
  },
  {
    name: "Garlic Alfredo",
    category: "sauce",
    price: 55,
    stock: 100,
  },

  // Cheese options
  {
    name: "Mozzarella",
    category: "cheese",
    price: 70,
    stock: 100,
  },
  {
    name: "Cheddar",
    category: "cheese",
    price: 80,
    stock: 100,
  },
  {
    name: "Cheese Blend",
    category: "cheese",
    price: 100,
    stock: 100,
  },

  // Vegetables
  {
    name: "Onion",
    category: "vegetable",
    price: 20,
    stock: 100,
  },
  {
    name: "Capsicum",
    category: "vegetable",
    price: 25,
    stock: 100,
  },
  {
    name: "Mushroom",
    category: "vegetable",
    price: 35,
    stock: 100,
  },
  {
    name: "Sweet Corn",
    category: "vegetable",
    price: 25,
    stock: 100,
  },
  {
    name: "Tomato",
    category: "vegetable",
    price: 20,
    stock: 100,
  },
  {
    name: "Black Olive",
    category: "vegetable",
    price: 40,
    stock: 100,
  },
  {
    name: "Jalapeno",
    category: "vegetable",
    price: 35,
    stock: 100,
  },
  {
    name: "Paneer",
    category: "vegetable",
    price: 60,
    stock: 100,
  },
];

const pizzas = [
  {
    name: "Margherita Classic",
    description:
      "Classic tomato sauce topped with mozzarella cheese and Italian herbs.",
    price: 199,
    emoji: "🍕",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Farmhouse Feast",
    description:
      "Onion, capsicum, tomato, mushroom and mozzarella cheese.",
    price: 349,
    emoji: "🫑",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Paneer Tikka Pizza",
    description:
      "Spiced paneer, onion and capsicum with creamy tikka flavour.",
    price: 399,
    emoji: "🧀",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Veggie Supreme",
    description:
      "Loaded with colourful vegetables, olives, jalapeno and cheese.",
    price: 379,
    emoji: "🥬",
    category: "vegetarian",
  },
  {
    name: "Corn and Cheese",
    description:
      "Sweet corn covered with a rich mozzarella and cheddar blend.",
    price: 299,
    emoji: "🌽",
    category: "vegetarian",
  },
  {
    name: "Spicy Chicken Pizza",
    description:
      "Spicy chicken pieces, onion, jalapeno and mozzarella cheese.",
    price: 449,
    emoji: "🍗",
    category: "non-vegetarian",
  },
];

const seedCatalog = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    // Replaces only existing sample pizzas and ingredients.
    await Ingredient.deleteMany({});
    await Pizza.deleteMany({});

    await Ingredient.insertMany(ingredients);
    await Pizza.insertMany(pizzas);

    console.log(`${ingredients.length} ingredients added`);
    console.log(`${pizzas.length} pizzas added`);
    console.log("Catalogue seeded successfully");
  } catch (error) {
    console.error("Catalogue seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedCatalog();