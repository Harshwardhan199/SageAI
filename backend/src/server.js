require("dotenv").config();
const app = require("./app");
const { connectMongo, connectRedis, closeConnections } = require("./db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectMongo();
  await connectRedis();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log("\nShutting down server...");
    await closeConnections();
    server.close(() => {
      console.log("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

startServer();
