import express from 'express';
import { activityPubRoutes } from './routes/activitypub';
import { UserController } from './controllers/UserController';
import { UserService } from './services/userService';
import { PostController } from './controllers/PostController';
import { PostService } from './services/postService';
import { MockUserRepository } from './repositories/implementations/MockUserRepository';
import { MockPostRepository } from './repositories/implementations/MockPostRepository';

// Create shared mock repositories for testing
const mockUserRepository = new MockUserRepository();
const mockPostRepository = new MockPostRepository();

// Create shared services
const userService = new UserService(mockUserRepository);
const postService = new PostService(mockPostRepository, mockUserRepository);

// Create shared controllers
const userController = new UserController(userService);
const postController = new PostController(postService);

export const createTestApp = () => {
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

  // ActivityPub routes (should be mounted before API routes to avoid conflicts)
  app.use(activityPubRoutes);

  // Auth routes
  app.post('/api/auth/register', (req, res) => userController.register(req, res));
  app.post('/api/auth/login', (req, res) => userController.login(req, res));
  app.post('/api/auth/logout', (req, res) => userController.logout(req, res));

  // User routes
  app.get('/api/users/:id', (req, res) => userController.getUserProfile(req, res));
  app.put('/api/users/:id', (req, res) => userController.updateUserProfile(req, res));
  app.get('/api/users', (req, res) => userController.searchUsers(req, res));

  // Post routes
  app.post('/api/posts', (req, res) => postController.createPost(req, res));
  app.get('/api/posts', (req, res) => postController.getPublicPosts(req, res));
  app.get('/api/posts/search', (req, res) => postController.searchPosts(req, res));
  app.get('/api/posts/author/:authorId', (req, res) => postController.getPostsByAuthor(req, res));
  app.get('/api/posts/feed', (req, res) => postController.getFeed(req, res));
  app.get('/api/posts/:id', (req, res) => postController.getPost(req, res));
  app.put('/api/posts/:id', (req, res) => postController.updatePost(req, res));
  app.delete('/api/posts/:id', (req, res) => postController.deletePost(req, res));

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({ 
      success: false, 
      error: 'Route not found' 
    });
  });

  return app;
};

// Function to clear mock repositories between tests
export const clearMockRepositories = () => {
  mockUserRepository.clear();
  mockPostRepository.clear();
}; 