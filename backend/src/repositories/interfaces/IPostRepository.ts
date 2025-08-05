import { Post, CreatePostData, UpdatePostData, type PostLike } from '../../types/post.js';

export interface IPostRepository {
  create(data: CreatePostData): Promise<Post>;
  createPost(data: CreatePostData): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findByAuthorId(authorId: string, limit?: number, offset?: number): Promise<Post[]>;
  update(id: string, data: UpdatePostData): Promise<Post | null>;
  delete(id: string): Promise<boolean>;
  searchPosts(query: string, limit?: number, offset?: number): Promise<Post[]>;
  getPublicPosts(limit?: number, offset?: number): Promise<Post[]>;
  getPostsByVisibility(authorId: string, visibility: 'public' | 'private' | 'followers', limit?: number, offset?: number): Promise<Post[]>;
  likePost(authorId: string, postId: string): Promise<PostLike | null>;
  findLikedPost(authorId: string, postId: string): Promise<PostLike | null>;
}