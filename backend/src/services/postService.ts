import { Post, CreatePostData, UpdatePostData } from '../types/post.js';
import { IPostRepository } from '../repositories/interfaces/IPostRepository.js';
import { IUserRepository } from '../repositories/interfaces/IUserRepository.js';
import { Note, type RequestContext } from '@fedify/fedify';
import type { Actor } from '@/types/actor.ts';
import mongoose from 'mongoose';
import he from 'he';
import { ActivityPubPostModel } from '@/models/postModel.ts';

// Define PostWithAuthor type if not already defined elsewhere
export type PostWithAuthor = Post & {
  author: {
    id: string;
    username: string;
    displayName?: string;
    avatar?: string;
  };
};

export class PostService {
  constructor(
    private postRepository: IPostRepository,
    private userRepository: IUserRepository
  ) {}

  private validatePostContent(content: string | undefined): void {
    if (!content || content.trim().length === 0) {
      throw new Error("Post content is required");
    }

    if (content.length > 10000) {
      throw new Error("Post content is too long (max 10,000 characters)");
    }
  }

  private validatePostTitle(title?: string): void {
    if (title && title.length > 200) {
      throw new Error("Post title is too long (max 200 characters)");
    }
  }

  async createPost(data: CreatePostData): Promise<Post> {
    this.validatePostContent(data.content);
    // Only validate title if it exists on data and is a string
    if ("title" in data && typeof data.title === "string") {
      this.validatePostTitle(data.title);
    }

    const author = await this.userRepository.findById(data.authorId);
    if (!author) {
      throw new Error("Author not found");
    }

    return this.postRepository.create(data);
  }

  async createActivityPubPost(
    ctx: RequestContext<unknown>,
    actor: Actor,
    username: string,
    content: string
  ): Promise<Post | undefined> {
    const session = await mongoose.startSession();
    try {
      let newPost;
      await session.withTransaction(async () => {
        const escapedContent = he.encode(content, { allowUnsafeSymbols: true });

        // Create post with temporary URI
        const [post] = await ActivityPubPostModel.create(
          [
            {
              uri: "https://localhost/",
              actor_id: actor.id,
              content: escapedContent,
            },
          ],
          { session }
        );

        if (!post) {
          throw new Error("Failed to create post");
        }

        // Generate final object URI
        const url = ctx.getObjectUri(Note, {
          identifier: username,
          id: post.id,
        }).href;

        const updatedPost = await ActivityPubPostModel.findByIdAndUpdate(
          post._id,
          {
            uri: url,
            url: url,
          },
          { session, new: true }
        );

        if (!updatedPost) {
          throw new Error("Failed to update post with final URI");
        }

        newPost = updatedPost;
      });

      return newPost;

    } catch (err) {
      console.error("Transaction failed:", err);
      return;
    } finally {
      await session.endSession();
    }
  }

  async getPostById(id: string): Promise<Post | null> {
    return this.postRepository.findById(id);
  }

  async getPostWithAuthor(id: string): Promise<PostWithAuthor | null> {
    const post = await this.postRepository.findById(id);
    if (!post) return null;

    const author = await this.userRepository.findById(post.authorId);
    if (!author) return null;

    return {
      ...post,
      author: {
        id: author.id,
        username: author.username,
        displayName: author.displayName,
        avatar: author.avatar
      }
    };
  }

  async getPostsByAuthor(
    authorId: string,
    limit?: number,
    offset?: number
  ): Promise<Post[]> {
    const author = await this.userRepository.findById(authorId);
    if (!author) {
      throw new Error("Author not found");
    }

    return this.postRepository.findByAuthorId(authorId, limit, offset);
  }

  async updatePost(
    id: string,
    data: UpdatePostData,
    authorId: string
  ): Promise<Post | null> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== authorId) {
      throw new Error("You can only update your own posts");
    }

    if (data.content) {
      this.validatePostContent(data.content);
    }

    if (data.title) {
      this.validatePostTitle(data.title);
    }

    return this.postRepository.update(id, data);
  }

  async deletePost(id: string, authorId: string): Promise<boolean> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }

    if (post.authorId !== authorId) {
      throw new Error("You can only delete your own posts");
    }

    return this.postRepository.delete(id);
  }

  async searchPosts(
    query: string,
    limit?: number,
    offset?: number
  ): Promise<Post[]> {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query is required");
    }

    return this.postRepository.searchPosts(query, limit, offset);
  }

  async getPublicPosts(limit?: number, offset?: number): Promise<Post[]> {
    return this.postRepository.getPublicPosts(limit, offset);
  }

  async getPostsByVisibility(
    authorId: string,
    visibility: "public" | "private" | "followers",
    limit?: number,
    offset?: number
  ): Promise<Post[]> {
    const author = await this.userRepository.findById(authorId);
    if (!author) {
      throw new Error("Author not found");
    }

    return this.postRepository.getPostsByVisibility(
      authorId,
      visibility,
      limit,
      offset
    );
  }

  async getFeedForUser(
    userId: string,
    limit?: number,
    offset?: number
  ): Promise<Post[]> {
    // For now, return public posts
    // In a real implementation, you would:
    // 1. Get the user's following list
    // 2. Get posts from followed users (public and followers-only)
    // 3. Mix with some public posts from other users
    return this.postRepository.getPublicPosts(limit, offset);
  }

  // Like a post
  async likePost(postId: string, userId: string) {
    // For demo: just increment a like count array on the post (no unlike, no user tracking)
    // In real app, you would track which users liked which posts
    const post = await this.postRepository.findById(postId);
    if (!post) throw new Error("Post not found");
    // Add a likes field if not present
    if (!("likes" in post)) (post as any).likes = 0;
    (post as any).likes++;
    // Save likes to DB (assume a setLikes method or updatePost)
    await this.postRepository.update(postId, {
      likesCount: (post as any).likes,
    });
    return post;
  }

  public getUserRepository() {
    return this.userRepository;
  }
}
