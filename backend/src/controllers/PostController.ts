import { Request, Response } from 'express';
import { PostService } from '../services/postService.js';
import { CreatePostData, UpdatePostData, PostType } from '../types/post.js';
import { uploadFileToS3 } from "../util/s3Upload.ts";

export class PostController {
  constructor(private postService: PostService) {}

  async createPost(req: Request, res: Response): Promise<void> {
    try {
      // Handle file uploads
      let files: any[] = [];
      if (Array.isArray((req as any).files)) {
        files = (req as any).files;
      } else if (req.files && typeof req.files === 'object') {
        // Multer can also provide files as an object (when using .fields)
        files = Object.values(req.files).flat();
      }
      // Debugging: log file info
      console.log('Received files:', files.map(f => ({ originalname: f.originalname, mimetype: f.mimetype, size: f.size })));
      let media: any[] = [];
      if (files.length > 0) {
        media = await Promise.all(
          files.map(async (file: any) => {
            const url = await uploadFileToS3(file);
            return {
              type: file.mimetype.startsWith("video") ? "video" : "image",
              url,
              size: file.size,
              width: undefined,
              height: undefined,
              altText: file.originalname,
            };
          })
        );
      }
      // Determine post type
      let type: PostType = PostType.TEXT;
      if (media.length > 0) {
        type = media.some(m => m.type === 'video') ? PostType.VIDEO : PostType.IMAGE;
      }
      // Validate authorId and log more details for debugging
      let authorId = req.body.authorId;
      // Always prefer user_id if present and valid (for actor->user mapping)
      if (req.body.user_id && typeof req.body.user_id === 'string' && req.body.user_id.length === 24) {
        if (authorId !== req.body.user_id) {
          console.warn('Overriding authorId with user_id from body:', req.body.user_id);
        }
        authorId = req.body.user_id;
      }
      if (!authorId || typeof authorId !== 'string' || authorId.length !== 24) {
        console.error('Invalid or missing authorId:', authorId, '| type:', typeof authorId, '| body:', req.body);
        res.status(400).json({
          success: false,
          error: 'Invalid or missing authorId. Please ensure you are sending the correct MongoDB user id.'
        });
        return;
      }
      // Check if author exists in users collection before proceeding
      const userRepo = this.postService.getUserRepository();
      const author = await userRepo.findById(authorId);
      if (!author) {
        console.error('Author not found for authorId:', authorId, '| body:', req.body);
        res.status(400).json({
          success: false,
          error: 'Author not found. Please ensure you are sending a valid MongoDB user id.'
        });
        return;
      }
      const postData: CreatePostData = {
        authorId,
        content: req.body.content,
        title: req.body.title,
        visibility: req.body.visibility || 'public',
        media,
        type,
      };
      // Debugging: log postData
      console.log('Creating post with data:', postData);
      const post = await this.postService.createPost(postData);
      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: post
      });
    } catch (error) {
      console.error('Error in createPost:', error);
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

  async getPost(req: Request, res: Response, next: Function): Promise<void> {
    try {
      const post = await this.postService.getPostWithAuthor(req.params.id);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json(post);
    } catch (err) {
      next(err);
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

  async getPostsByAuthor(req: Request, res: Response, next: Function): Promise<void> {
    try {
      const posts = await this.postService.getPostsByAuthor(req.params.authorId, 20, 0);
      res.json(posts);
    } catch (err) {
      next(err);
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

  async getPublicPosts(req: Request, res: Response, next: Function): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const posts = await this.postService.getPublicPosts(limit, offset);
      // Fetch author info for each post
      const userRepo = this.postService.getUserRepository();
      const postsWithAuthor = await Promise.all(posts.map(async (post) => {
        const author = await userRepo.findById(post.authorId);
        return {
          ...post,
          author: author ? { id: author.id, username: author.username, displayName: author.displayName, avatar: author.avatar } : undefined
        };
      }));
      res.json({
        success: true,
        data: {
          posts: postsWithAuthor,
          pagination: {
            limit,
            offset,
            total: postsWithAuthor.length
          }
        }
      });
    } catch (err) {
      next(err);
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
  // Like a post
  async likePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.body.MY_USER_ID || req.body.authorId; // fallback for now
      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }
      const post = await this.postService.likePost(id, userId);
      res.json({ success: true, data: post });
    } catch (error) {
      console.error('Error in likePost:', error);
      res.status(500).json({ success: false, error: 'Failed to like post' });
    }
  }
}
