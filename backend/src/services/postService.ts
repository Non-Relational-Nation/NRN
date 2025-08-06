import { Post, CreatePostData, UpdatePostData } from '../types/post.js';
import { IPostRepository } from '../repositories/interfaces/IPostRepository.js';
import { IUserRepository } from '../repositories/interfaces/IUserRepository.js';
import { Note, type RequestContext } from '@fedify/fedify';
import type { Actor } from '@/types/actor.ts';
import mongoose, { type Types } from 'mongoose';
import he from 'he';
import { PostModel } from '@/models/postModel.ts';
import { actorRepository } from '@/repositories/actorRepository.ts';

// Define PostWithAuthor type if not already defined elsewhere
export type PostWithAuthor = Post & {
  author: {
    id: Types.ObjectId;
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

  // async createPost(data: CreatePostData): Promise<Post> {
  //   this.validatePostContent(data.content);
  //   // Only validate title if it exists on data and is a string
  //   if ("title" in data && typeof data.title === "string") {
  //     this.validatePostTitle(data.title);
  //   }

  //   const author = await this.userRepository.findById(data.authorId);
  //   if (!author) {
  //     throw new Error("Author not found");
  //   }

  //   return this.postRepository.create(data);
  // }

  async createPost(
    ctx: RequestContext<unknown>,
    username: string,
    postData: Partial<CreatePostData>
  ): Promise<Post | undefined> {
    const session = await mongoose.startSession();
    try {
      let newPost;
      await session.withTransaction(async () => {
        const escapedContent = he.encode(postData.content ?? "");

        // Create post with temporary URI
        const [post] = await PostModel.create(
          [
            {
              ...postData,
              uri: "https://localhost/",
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

        const updatedPost = await PostModel.findByIdAndUpdate(
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
    
    const author = await this.userRepository.findById(post.actor_id!);

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
  async likePost(actorId: string, postId: string, ) {
    return await this.postRepository.likePost(actorId, postId)
  }
 
  async getLikedPost(actorId: string, postId: string) {
    return this.postRepository.findLikedPost(actorId, postId);
  }

  public getUserRepository() {
    return this.userRepository;
  }
}
