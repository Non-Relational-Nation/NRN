import request from 'supertest';
import { createTestApp, clearMockRepositories } from '../testHelpers';

describe('Post Routes', () => {
  let app: any;

  beforeEach(() => {
    clearMockRepositories();
    app = createTestApp();
  });

  describe('POST /api/posts', () => {
    it('should create a new post successfully', async () => {
      // First create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      expect(userResponse.status).toBe(201);
      const user = userResponse.body.data;

      // Create a post
      const postResponse = await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'This is a test post content',
          title: 'Test Post',
          visibility: 'public'
        });
      expect(postResponse.status).toBe(201);
      expect(postResponse.body.success).toBe(true);
      expect(postResponse.body.data.content).toBe('This is a test post content');
      expect(postResponse.body.data.title).toBe('Test Post');
      expect(postResponse.body.data.visibility).toBe('public');
      expect(postResponse.body.data.authorId).toBe(user.id);
    });

    it('should return 400 for missing content', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({
          authorId: 'some-user-id',
          title: 'Test Post'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post content is required');
    });

    it('should return 400 for content too long', async () => {
      const longContent = 'a'.repeat(10001);
      const response = await request(app)
        .post('/api/posts')
        .send({
          authorId: 'some-user-id',
          content: longContent
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post content is too long (max 10,000 characters)');
    });

    it('should return 400 for title too long', async () => {
      const longTitle = 'a'.repeat(201);
      const response = await request(app)
        .post('/api/posts')
        .send({
          authorId: 'some-user-id',
          content: 'Test content',
          title: longTitle
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post title is too long (max 200 characters)');
    });

    it('should return 400 for non-existent author', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({
          authorId: 'non-existent-user',
          content: 'Test content'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Author not found');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a post by ID with author information', async () => {
      // Create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      const user = userResponse.body.data;

      // Create a post
      const postResponse = await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'Test post content',
          title: 'Test Post'
        });

      const post = postResponse.body.data;

      // Get the post
      const getResponse = await request(app)
        .get(`/api/posts/${post.id}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.success).toBe(true);
      expect(getResponse.body.data.content).toBe('Test post content');
      expect(getResponse.body.data.author).toBeDefined();
      expect(getResponse.body.data.author.id).toBe(user.id);
      expect(getResponse.body.data.author.username).toBe('testuser');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update a post successfully', async () => {
      // Create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      const user = userResponse.body.data;

      // Create a post
      const postResponse = await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'Original content',
          title: 'Original title'
        });

      const post = postResponse.body.data;

      // Update the post
      const updateResponse = await request(app)
        .put(`/api/posts/${post.id}`)
        .send({
          authorId: user.id,
          content: 'Updated content',
          title: 'Updated title'
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.success).toBe(true);
      expect(updateResponse.body.data.content).toBe('Updated content');
      expect(updateResponse.body.data.title).toBe('Updated title');
    });

    it('should return 400 for unauthorized update', async () => {
      // Create two users
      const user1Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
          displayName: 'User 1'
        });

      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
          displayName: 'User 2'
        });

      const user1 = user1Response.body.data;
      const user2 = user2Response.body.data;

      // Create a post with user1
      const postResponse = await request(app)
        .post('/api/posts')
        .send({
          authorId: user1.id,
          content: 'Original content'
        });

      const post = postResponse.body.data;

      // Try to update with user2
      const updateResponse = await request(app)
        .put(`/api/posts/${post.id}`)
        .send({
          authorId: user2.id,
          content: 'Updated content'
        });

      expect(updateResponse.status).toBe(400);
      expect(updateResponse.body.success).toBe(false);
      expect(updateResponse.body.error).toBe('You can only update your own posts');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a post successfully', async () => {
      // Create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      const user = userResponse.body.data;

      // Create a post
      const postResponse = await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'Test content'
        });

      const post = postResponse.body.data;

      // Delete the post
      const deleteResponse = await request(app)
        .delete(`/api/posts/${post.id}`)
        .send({
          authorId: user.id
        });

      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Post deleted successfully');
    });

    it('should return 400 for unauthorized deletion', async () => {
      // Create two users
      const user1Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
          displayName: 'User 1'
        });

      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
          displayName: 'User 2'
        });

      const user1 = user1Response.body.data;
      const user2 = user2Response.body.data;

      // Create a post with user1
      const postResponse = await request(app)
        .post('/api/posts')
        .send({
          authorId: user1.id,
          content: 'Test content'
        });

      const post = postResponse.body.data;

      // Try to delete with user2
      const deleteResponse = await request(app)
        .delete(`/api/posts/${post.id}`)
        .send({
          authorId: user2.id
        });

      expect(deleteResponse.status).toBe(400);
      expect(deleteResponse.body.success).toBe(false);
      expect(deleteResponse.body.error).toBe('You can only delete your own posts');
    });
  });

  describe('GET /api/posts/author/:authorId', () => {
    it('should get posts by author', async () => {
      // Create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      const user = userResponse.body.data;

      // Create multiple posts
      await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'First post'
        });

      await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'Second post'
        });

      // Get posts by author
      const response = await request(app)
        .get(`/api/posts/author/${user.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });
  });

  describe('GET /api/posts/search', () => {
    it('should search posts successfully', async () => {
      // Create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      const user = userResponse.body.data;

      // Create posts with searchable content
      await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'This post contains the word technology',
          visibility: 'public'
        });

      await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'This post contains the word science',
          visibility: 'public'
        });

      // Search for posts
      const response = await request(app)
        .get('/api/posts/search?q=technology');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.query).toBe('technology');
      expect(response.body.data.posts.length).toBeGreaterThan(0);
    });

    it('should return 400 for missing search query', async () => {
      const response = await request(app)
        .get('/api/posts/search');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Search query is required');
    });
  });

  describe('GET /api/posts', () => {
    it('should get public posts', async () => {
      // Create a user
      const userResponse = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          displayName: 'Test User'
        });

      const user = userResponse.body.data;

      // Create public posts
      await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'Public post 1',
          visibility: 'public'
        });

      await request(app)
        .post('/api/posts')
        .send({
          authorId: user.id,
          content: 'Public post 2',
          visibility: 'public'
        });

      // Get public posts
      const response = await request(app)
        .get('/api/posts');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
    });
  });
}); 