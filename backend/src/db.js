require("dotenv").config();
const mongoose = require("mongoose");
const { createClient } = require("redis");

let redisClient;

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI_ATLAS);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); 
  }
};

const connectRedis = async () => {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error", err);
    });

    await redisClient.connect();
    console.log("Redis connected");
  } catch (err) {
    console.error("Redis connection failed:", err);
    process.exit(1);
  }
};

const getRedis = () => {
  if (!redisClient) {
    throw new Error("Redis is not connected yet!");
  }
  return redisClient;
};

const closeConnections = async () => {
  if (redis) await redis.quit();
  await mongoose.disconnect();
  console.log("MongoDB and Redis connections closed");
};

module.exports = { connectMongo, connectRedis, closeConnections, getRedis };
