import { createApp } from "./app.ts";
import { connectDB } from "./config/db.ts";

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "localhost";

const app = createApp();

connectDB().then(() => {
  app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Health check available at http://${HOST}:${PORT}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
});
