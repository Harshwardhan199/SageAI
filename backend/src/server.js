require("dotenv").config();
const app = require("./app");
const { connectMongo, connectRedis, closeConnections } = require("./db");
const EmbeddingWorker = require("./services/workers/embeddingWorker");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectMongo();
  await connectRedis();

  // Start background Redis embedding worker
  EmbeddingWorker.start();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log("\nShutting down server...");
    EmbeddingWorker.stop();
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
