import "dotenv/config";
import app from "./src/app.js";
import prisma from "./src/db/prisma.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log("🗄️  Database connected successfully!");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Kinglet Backend API running at http://localhost:${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/health`);
      console.log(`🛍️ Products Endpoint: http://localhost:${PORT}/api/v1/products`);
    });

    // Graceful Shutdown
    const signals = ["SIGINT", "SIGTERM"];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
        server.close(async () => {
          await prisma.$disconnect();
          console.log("👋 Database disconnected. Process terminated.");
          process.exit(0);
        });
      });
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();

