require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");

const Ingredient = require("../models/Ingredient");
const Pizza = require("../models/Pizza");

if (process.env.NODE_ENV !== "production") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

const ingredients = [
  { name: "Classic Hand Tossed", category: "base", price: 120, stock: 100 },
  { name: "Thin Crust", category: "base", price: 140, stock: 100 },
  { name: "Cheese Burst", category: "base", price: 190, stock: 100 },
  { name: "Whole Wheat", category: "base", price: 160, stock: 100 },
  { name: "Pan Pizza", category: "base", price: 150, stock: 100 },

  { name: "Classic Tomato", category: "sauce", price: 30, stock: 100 },
  { name: "Spicy Schezwan", category: "sauce", price: 40, stock: 100 },
  { name: "Creamy Pesto", category: "sauce", price: 60, stock: 100 },
  { name: "Barbecue", category: "sauce", price: 50, stock: 100 },
  { name: "Garlic Alfredo", category: "sauce", price: 55, stock: 100 },

  { name: "Mozzarella", category: "cheese", price: 70, stock: 100 },
  { name: "Cheddar", category: "cheese", price: 80, stock: 100 },
  { name: "Cheese Blend", category: "cheese", price: 100, stock: 100 },

  { name: "Onion", category: "vegetable", price: 20, stock: 100 },
  { name: "Capsicum", category: "vegetable", price: 25, stock: 100 },
  { name: "Mushroom", category: "vegetable", price: 35, stock: 100 },
  { name: "Sweet Corn", category: "vegetable", price: 25, stock: 100 },
  { name: "Tomato", category: "vegetable", price: 20, stock: 100 },
  { name: "Black Olive", category: "vegetable", price: 40, stock: 100 },
  { name: "Jalapeno", category: "vegetable", price: 35, stock: 100 },
  { name: "Paneer", category: "vegetable", price: 60, stock: 100 },
];

const pizzas = [
  {
    name: "Margherita Classic",
    description: "Classic tomato sauce, mozzarella cheese and Italian herbs.",
    price: 199,
    image: "/menu/margherita-classic.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Farmhouse Feast",
    description: "Onion, capsicum, tomato, mushroom and mozzarella cheese.",
    price: 349,
    image: "/menu/farmhouse-feast.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Paneer Tikka Pizza",
    description: "Spiced paneer, onion and capsicum with creamy tikka flavour.",
    price: 399,
    image: "/menu/paneer-tikka-pizza.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Veggie Supreme",
    description: "Colourful vegetables, olives, jalapeno and cheese.",
    price: 379,
    image: "/menu/veggie-supreme.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
  },
  {
    name: "Corn and Cheese",
    description: "Sweet corn with a rich mozzarella and cheddar blend.",
    price: 299,
    image: "/menu/corn-and-cheese.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
  },
  {
    name: "Spicy Chicken Pizza",
    description: "Spicy chicken, onion, jalapeno and mozzarella cheese.",
    price: 449,
    image: "/menu/spicy-chicken-pizza.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "non-vegetarian",
  },
  {
    name: "Mushroom Cheese Melt",
    description: "Sliced mushrooms with rich melted mozzarella cheese.",
    price: 329,
    image: "/menu/mushroom-cheese-melt.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
  },
  {
    name: "Tandoori Paneer Blaze",
    description: "Tandoori paneer, onion, capsicum and jalapeno.",
    price: 419,
    image: "/menu/tandoori-paneer-blaze.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "BBQ Chicken Supreme",
    description: "Roasted BBQ chicken, onion, capsicum and smoky sauce.",
    price: 469,
    image: "/menu/bbq-chicken-supreme.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "non-vegetarian",
    isFeatured: true,
  },
  {
    name: "Chicken Pepperoni",
    description: "Chicken pepperoni slices over melted mozzarella.",
    price: 479,
    image: "/menu/chicken-pepperoni.webp",
    emoji: "🍕",
    menuSection: "pizza",
    category: "non-vegetarian",
  },
  {
    name: "Classic Garlic Bread",
    description: "Golden garlic-butter breadsticks with parsley.",
    price: 129,
    image: "/menu/classic-garlic-bread.webp",
    emoji: "🥖",
    menuSection: "starter",
    category: "vegetarian",
  },
  {
    name: "Cheesy Garlic Bread",
    description: "Garlic bread covered with bubbling mozzarella.",
    price: 179,
    image: "/menu/cheesy-garlic-bread.webp",
    emoji: "🥖",
    menuSection: "starter",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Paneer Tikka Bites",
    description: "Roasted paneer tikka cubes with aromatic spices.",
    price: 239,
    image: "/menu/paneer-tikka-bites.webp",
    emoji: "🧀",
    menuSection: "starter",
    category: "vegetarian",
  },
  {
    name: "Veg Nuggets",
    description: "Crispy golden vegetable nuggets.",
    price: 159,
    image: "/menu/veg-nuggets.webp",
    emoji: "🥔",
    menuSection: "starter",
    category: "vegetarian",
  },
  {
    name: "Crispy Chicken Wings",
    description: "Crispy spicy chicken wings with a roasted glaze.",
    price: 269,
    image: "/menu/crispy-chicken-wings.webp",
    emoji: "🍗",
    menuSection: "starter",
    category: "non-vegetarian",
    isFeatured: true,
  },
  {
    name: "Chicken Nuggets",
    description: "Crunchy golden chicken nuggets.",
    price: 229,
    image: "/menu/chicken-nuggets.webp",
    emoji: "🍗",
    menuSection: "starter",
    category: "non-vegetarian",
  },
  {
    name: "Cola",
    description: "Chilled sparkling cola served over ice.",
    price: 79,
    image: "/menu/cola.webp",
    emoji: "🥤",
    menuSection: "drink",
    category: "vegetarian",
  },
  {
    name: "Lemon-Lime Soda",
    description: "Refreshing lemon-lime soda with ice.",
    price: 79,
    image: "/menu/lemon-lime-soda.webp",
    emoji: "🥤",
    menuSection: "drink",
    category: "vegetarian",
  },
  {
    name: "Orange Fizz",
    description: "Bright orange soda with lively bubbles.",
    price: 89,
    image: "/menu/orange-fizz.webp",
    emoji: "🥤",
    menuSection: "drink",
    category: "vegetarian",
    isFeatured: true,
  },
  {
    name: "Iced Tea",
    description: "Chilled lemon iced tea served over ice.",
    price: 99,
    image: "/menu/iced-tea.webp",
    emoji: "🧋",
    menuSection: "drink",
    category: "vegetarian",
  },
  {
    name: "Mineral Water",
    description: "Pure chilled mineral water.",
    price: 49,
    image: "/menu/mineral-water.webp",
    emoji: "💧",
    menuSection: "drink",
    category: "vegetarian",
  },
];

const seedCatalog = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

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
