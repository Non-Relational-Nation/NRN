import { Request, Response } from 'express';
import { PostService } from '../services/postService';
import { CreatePostData, UpdatePostData } from '../types/post';

export class PostController {
  constructor(private postService: PostService) {}

  async createPost(req: Request, res: Response): Promise<void> {
    try {
      const postData: CreatePostData = {
        authorId: req.body.authorId,
        content: req.body.content,
        title: req.body.title,
        visibility: req.body.visibility || 'public'
      };

      const post = await this.postService.createPost(postData);
      
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to create post'
      });
    }
  }

  async getPost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const post = await this.postService.getPostWithAuthor(id);
      
      if (!post) {
        res.status(404).json({
          success: false,
          error: 'Post not found'
        });
        return;
      }
      
      res.json({
        success: true,
        data: post
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get post'
      });
    }
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdatePostData = req.body;
      const authorId = req.body.authorId; // In real app, get from auth middleware

      if (!authorId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const post = await this.postService.updatePost(id, updateData, authorId);
      
      if (!post) {
        res.status(404).json({
          success: false,
          error: 'Post not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Post updated successfully',
        data: post
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to update post'
      });
    }
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authorId = req.body.authorId; // In real app, get from auth middleware

      if (!authorId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const deleted = await this.postService.deletePost(id, authorId);
      
      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Post not found'
        });
        return;
      }
      
      res.json({
        success: true,
        message: 'Post deleted successfully'
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to delete post'
      });
    }
  }

  async getPostsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const { authorId } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const posts = await this.postService.getPostsByAuthor(authorId, limit, offset);
      
      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            limit,
            offset,
            total: posts.length
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to get posts by author'
      });
    }
  }

  async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const posts = await this.postService.searchPosts(query, limit, offset);
      
      res.json({
        success: true,
        data: {
          query,
          posts,
          pagination: {
            limit,
            offset,
            total: posts.length
          }
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        error: 'Failed to search posts'
      });
    }
  }

  async getPublicPosts(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const posts = await this.postService.getPublicPosts(limit, offset);
      
      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            limit,
            offset,
            total: posts.length
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get public posts'
      });
    }
  }

  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId; // In real app, get from auth middleware
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
        return;
      }

      const posts = await this.postService.getFeedForUser(userId, limit, offset);
      
      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            limit,
            offset,
            total: posts.length
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to get feed'
      });
    }
  }
}
