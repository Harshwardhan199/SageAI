require("dotenv").config();
const app = require("./app");
const { connectMongo } = require("./db");

/**
 * Vercel Serverless Function entrypoint.
 * Ensures cached MongoDB connection is established before delegating to Express app.
 */
module.exports = async (req, res) => {
  try {
    await connectMongo();
  } catch (err) {
    console.error("[Serverless Entrypoint] Database connection error:", err.message);
  }

  return app(req, res);
};
