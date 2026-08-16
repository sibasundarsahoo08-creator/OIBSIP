require("dotenv").config();

const dns = require("node:dns");
const mongoose = require("mongoose");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const connectDB = require("../config/db");

const {
  checkLowStockAndNotify,
} = require("../services/lowStockService");

const testLowStockAlert = async () => {
  try {
    await connectDB();

    console.log(
      "Checking for low-stock ingredients..."
    );

    const result =
      await checkLowStockAndNotify();

    console.log("Low-stock test result:");
    console.log(result);
  } catch (error) {
    console.error(
      "Low-stock email test failed:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

testLowStockAlert();