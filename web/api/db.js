require("dotenv").config();
const mongoose = require("mongoose");
const { Redis } = require("@upstash/redis");

/**
 * Global cache for MongoDB connection across serverless invocations.
 */
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectMongo = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI_ATLAS;
  if (!mongoUri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log("[MongoDB] Connected successfully (cached connection established)");
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error("[MongoDB] Connection error:", err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
};

/**
 * Singleton instance of @upstash/redis REST client.
 */
let redisClient = null;

const getRedis = () => {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      console.warn("[Redis] Upstash REST credentials are missing.");
      return null;
    } else {
      redisClient = new Redis({ url, token });
    }
  }
  return redisClient;
};

module.exports = { connectMongo, getRedis };
