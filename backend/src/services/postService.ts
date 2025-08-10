import { Post, CreatePostData, UpdatePostData } from "../types/post.js";
import { IPostRepository } from "../repositories/interfaces/IPostRepository.js";
import { IUserRepository } from "../repositories/interfaces/IUserRepository.js";
import { Note, type RequestContext } from "@fedify/fedify";
import mongoose, { Types } from "mongoose";
import he from "he";
import { PostModel } from "@/models/postModel.ts";
import { actorRepository } from "@/repositories/actorRepository.ts";
import { LikeModel } from "../models/likeModel.ts";

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

  async createPost(
    ctx: RequestContext<unknown>,
    username: string,
    postData: Partial<CreatePostData>
  ): Promise<Partial<CreatePostData> | undefined> {
    try {
      let newPost;
      const escapedContent = he.encode(postData.content ?? "");

      // Create post with temporary URI
      const [post] = await PostModel.create([
        {
          ...postData,
          uri: "https://localhost/",
          content: escapedContent,
        },
      ]);

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
        { new: true }
      );

      if (!updatedPost) {
        throw new Error("Failed to update post with final URI");
      }

      newPost = updatedPost;

      return updatedPost;
    } catch (err) {
      console.error("Transaction failed:", err);
      return;
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
        avatar: author.avatar,
      },
    };
  }

  async getPostsByAuthor(
    authorId: string,
    limit?: number,
    offset?: number
  ): Promise<Post[]> {
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

    if (post.actor_id !== authorId) {
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

    if (post.actor_id !== authorId) {
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
    return this.postRepository.getPublicPosts(limit, offset);
  }

  async likePost(actorId: string, postId: string) {
    // Ensure actorId and postId are ObjectIds
    const actorObjectId = new Types.ObjectId(actorId);
    const postObjectId = new Types.ObjectId(postId);

    // Prevent duplicate likes (optional, as schema is unique)
    const existing = await LikeModel.findOne({
      actor_id: actorObjectId,
      post_id: postObjectId,
    });
    if (existing) return existing;

    return LikeModel.create({
      actor_id: actorObjectId,
      post_id: postObjectId,
    });
  }

  async getLikedPost(actorId: string, postId: string) {
    return this.postRepository.findLikedPost(actorId, postId);
  }

  public getUserRepository() {
    return this.userRepository;
  }
}

function extractHandleFromActor(actorUrl: string): string {
  const url = new URL(actorUrl);
  const username = url.pathname.split("/").pop() || "";
  return `${username}@${url.hostname}`;
}

export function mapOutboxToPosts(outbox: any): Post[] {
  return (outbox.orderedItems || []).map(async (item: any) => {
    const obj = item.object || {};
    const postId = item?.id?.split("/").pop()
    const count = await LikeModel.countDocuments({ post_id: postId });
    return {
      id: obj?.id || item.id,
      authorId: obj?.attributedTo || item.actor,
      authorHandle: extractHandleFromActor(obj?.attributedTo || item.actor),
      type: obj?.type || "Note",
      content: obj?.content || "",
      media: obj?.attachment
        ? Array.isArray(obj?.attachment)
          ? obj.attachment.map((att: any) => ({
              url: att?.url,
              type: att?.type,
              mediaType: att?.mediaType,
            }))
          : [obj.attachment]
        : [],
      isLiked: false,
      likesCount: 0,
      created_at: obj?.published ? new Date(obj?.published) : undefined,
    };
  });
}
