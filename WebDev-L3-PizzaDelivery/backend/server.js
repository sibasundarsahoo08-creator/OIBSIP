require("dotenv").config();

const dns = require("node:dns");

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const {
  rateLimit,
} = require("express-rate-limit");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const catalogRoutes = require("./routes/catalogRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");

const {
  startLowStockJob,
} = require("./jobs/lowStockJob");

const app = express();

app.use(helmet());

const allowedOrigins = (
  process.env.FRONTEND_URL ||
  "http://localhost:5173"
)
  .split(",")
  .map((origin) =>
    origin.trim().replace(/\/$/, "")
  )
  .filter(Boolean);

const isLocalDevelopmentOrigin = (
  origin
) => {
  return /^http:\/\/(?:localhost|127\.0\.0\.1|192\.168(?:\.\d{1,3}){2}|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):5173$/.test(
    origin
  );
};

app.use(
  cors({
    origin(origin, callback) {
      // Allow requests without an Origin, such as
      // server health checks and API testing tools.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedOrigin =
        origin.replace(/\/$/, "");

      if (
        allowedOrigins.includes(
          normalizedOrigin
        )
      ) {
        callback(null, true);
        return;
      }

      if (
        process.env.NODE_ENV !==
          "production" &&
        isLocalDevelopmentOrigin(
          normalizedOrigin
        )
      ) {
        callback(null, true);
        return;
      }

      callback(
        new Error(
          "This website is not allowed to access the API"
        )
      );
    },

    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Pizza Delivery API",
    healthCheck: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Pizza Delivery API and MongoDB are running",
  });
});

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  startLowStockJob();

  app.listen(PORT, () => {
    console.log(
      `Server running at http://localhost:${PORT}`
    );
  });
};

startServer().catch((error) => {
  console.error(
    "Unable to start server:",
    error.message
  );

  process.exit(1);
});