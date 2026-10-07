require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function start() {
  if (!process.env.JWT_SECRET_KEY) {
    console.error(
      "JWT_SECRET_KEY is not set. Copy server/.env.example to server/.env first.",
    );

    process.exit(1);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);

    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`GyanKendra server listening on port ${PORT}`);
  });
}

start();
