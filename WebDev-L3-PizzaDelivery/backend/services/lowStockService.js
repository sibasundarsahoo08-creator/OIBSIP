const Ingredient = require("../models/Ingredient");

const {
  sendLowStockEmail,
} = require("./emailService");

let checkInProgress = false;

const checkLowStockAndNotify = async () => {
  if (checkInProgress) {
    return {
      success: true,
      skipped: true,
      message:
        "A low-stock check is already running",
    };
  }

  checkInProgress = true;

  try {
    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.MAIL_USER;

    if (!adminEmail) {
      throw new Error(
        "ADMIN_EMAIL or MAIL_USER is not configured"
      );
    }

    const lowStockIngredients =
      await Ingredient.find({
        lowStockAlertSent: {
          $ne: true,
        },
        $expr: {
          $lte: [
            "$stock",
            "$lowStockThreshold",
          ],
        },
      }).sort({
        stock: 1,
        name: 1,
      });

    if (lowStockIngredients.length === 0) {
      return {
        success: true,
        notified: false,
        count: 0,
        message:
          "No new low-stock ingredients found",
      };
    }

    await sendLowStockEmail({
      to: adminEmail,
      ingredients: lowStockIngredients,
    });

    const ingredientIds =
      lowStockIngredients.map(
        (ingredient) => ingredient._id
      );

    const alertTime = new Date();

    await Ingredient.updateMany(
      {
        _id: {
          $in: ingredientIds,
        },
      },
      {
        $set: {
          lowStockAlertSent: true,
          lowStockAlertSentAt: alertTime,
        },
      }
    );

    console.log(
      `Low-stock email sent for ${lowStockIngredients.length} ingredient(s)`
    );

    return {
      success: true,
      notified: true,
      count: lowStockIngredients.length,
      ingredients: lowStockIngredients.map(
        (ingredient) => ({
          id: ingredient._id,
          name: ingredient.name,
          category: ingredient.category,
          stock: ingredient.stock,
          lowStockThreshold:
            ingredient.lowStockThreshold,
        })
      ),
    };
  } catch (error) {
    console.error(
      "Low-stock notification failed:",
      error.message
    );

    throw error;
  } finally {
    checkInProgress = false;
  }
};

module.exports = {
  checkLowStockAndNotify,
};