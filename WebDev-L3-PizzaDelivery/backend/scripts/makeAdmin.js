require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const makeAdmin = async () => {
  try {
    const email = String(
      process.argv[2] || ""
    )
      .trim()
      .toLowerCase();

    if (!email) {
      console.log(
        "Usage: node scripts/makeAdmin.js your-email@example.com"
      );

      process.exitCode = 1;
      return;
    }

    await connectDB();

    const user = await User.findOneAndUpdate(
      {
        email,
      },
      {
        $set: {
          role: "admin",
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      console.log(
        `No registered user found with email: ${email}`
      );

      process.exitCode = 1;
      return;
    }

    console.log("Admin account created successfully");
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Role: ${user.role}`);
  } catch (error) {
    console.error(
      "Unable to create admin:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

makeAdmin();