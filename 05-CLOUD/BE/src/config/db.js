const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  mongoose.connection.on("connected",    () => console.log("✅ MongoDB connected"));
  mongoose.connection.on("disconnected", () => console.warn("⚠️  MongoDB disconnected"));
  mongoose.connection.on("error",        (e) => console.error("❌ MongoDB error:", e));

  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

module.exports = { connectDB };
