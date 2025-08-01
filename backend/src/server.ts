import { createApp } from "./app.ts";
import { connectDB } from "./config/db.ts";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

const app = createApp();

// Start server first, then attempt database connection
app.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Health check available at http://${HOST}:${PORT}/api/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  
  // Attempt database connection after server is running
  connectDB().catch((err) => {
    console.error("⚠️ Failed to connect to database on startup:", err);
    console.log("🔄 Server will continue running. Database connectivity will be reported in health checks.");
  });
});
