import express from 'express';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { postRoutes } from './routes/posts';

export const createApp = () => {
  const app = express();

  // Basic middleware
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/posts', postRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      error: 'Route not found' 
    });
  });

  return app;
};
