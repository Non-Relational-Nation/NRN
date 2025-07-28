import { Post, CreatePostData, UpdatePostData } from '../../types/post';

export interface IPostRepository {
  // Core CRUD operations
  create(data: CreatePostData & { authorId: string }): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  update(id: string, data: UpdatePostData): Promise<Post | null>;
  delete(id: string): Promise<boolean>;
  
  // Post queries
  findByAuthor(authorId: string, limit?: number, offset?: number): Promise<Post[]>;
  findByHashtag(hashtag: string, limit?: number, offset?: number): Promise<Post[]>;
  findMentions(userId: string, limit?: number, offset?: number): Promise<Post[]>;
  findPublicPosts(limit?: number, offset?: number): Promise<Post[]>;
}