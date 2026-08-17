const Ingredient = require("../models/Ingredient");
const Pizza = require("../models/Pizza");

const getPizzas = async (req, res) => {
  try {
    const allowedSections = ["pizza", "starter", "drink"];
    const filter = { isAvailable: true };

    if (allowedSections.includes(req.query.section)) {
      filter.menuSection = req.query.section;
    }

    const pizzas = await Pizza.find(filter).sort({
      menuSection: 1,
      isFeatured: -1,
      name: 1,
    });

    return res.status(200).json({
      success: true,
      count: pizzas.length,
      pizzas,
    });
  } catch (error) {
    console.error("Get menu error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load the menu",
    });
  }
};

const getBuilderOptions = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({
      isAvailable: true,
      stock: { $gt: 0 },
    }).sort({ category: 1, name: 1 });

    const options = {
      bases: ingredients.filter((item) => item.category === "base"),
      sauces: ingredients.filter((item) => item.category === "sauce"),
      cheeses: ingredients.filter((item) => item.category === "cheese"),
      vegetables: ingredients.filter((item) => item.category === "vegetable"),
    };

    return res.status(200).json({ success: true, options });
  } catch (error) {
    console.error("Get builder options error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load pizza builder options",
    });
  }
};

module.exports = { getPizzas, getBuilderOptions };
