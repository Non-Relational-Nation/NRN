import 'dotenv/config';
import { createApp } from './app';
import { database } from './config/database';

async function startServer() {
  try {
    // Connect to MongoDB
    await database.connect();
    
    const app = createApp();

    const port = process.env.PORT || 3001;
    const host = process.env.HOST || 'localhost';
    const environment = process.env.NODE_ENV || 'development';

    app.listen(Number(port), host, () => {
      console.log(`🚀 Server running on http://${host}:${port}`);
      console.log(`📊 Health check available at http://${host}:${port}/health`);
      console.log(`🌍 Environment: ${environment}`);
      console.log(`🗄️  Connected to MongoDB`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await database.disconnect();
  process.exit(0);
});

startServer();
