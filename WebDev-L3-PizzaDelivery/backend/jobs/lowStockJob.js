const cron = require("node-cron");

const {
  checkLowStockAndNotify,
} = require("../services/lowStockService");

const startLowStockJob = () => {
  const schedule =
    process.env.LOW_STOCK_CRON ||
    "*/30 * * * *";

  const timezone =
    process.env.CRON_TIMEZONE ||
    "Asia/Kolkata";

  if (!cron.validate(schedule)) {
    console.error(
      `Invalid low-stock cron schedule: ${schedule}`
    );

    return null;
  }

  const task = cron.schedule(
    schedule,
    async () => {
      try {
        const result =
          await checkLowStockAndNotify();

        if (
          result.notified === false &&
          result.count === 0
        ) {
          console.log(
            "Low-stock check completed: no new alerts"
          );
        }
      } catch (error) {
        console.error(
          "Scheduled low-stock check failed:",
          error.message
        );
      }
    },
    {
      timezone,
    }
  );

  console.log(
    `Low-stock job scheduled: ${schedule} (${timezone})`
  );

  return task;
};

module.exports = {
  startLowStockJob,
};