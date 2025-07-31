import { Post, CreatePostData, UpdatePostData } from '../../types/post';
import { IPostRepository } from '../interfaces/IPostRepository';

export class MockPostRepository implements IPostRepository {
  private posts: Post[] = [];
  private nextId = 1;

  async create(data: CreatePostData): Promise<Post> {
    const post: Post = {
      id: this.nextId.toString(),
      authorId: data.authorId,
      content: data.content,
      title: data.title,
      visibility: data.visibility || 'public',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.posts.push(post);
    this.nextId++;

    return post;
  }

  async findById(id: string): Promise<Post | null> {
    return this.posts.find(post => post.id === id) || null;
  }

  async findByAuthorId(authorId: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const authorPosts = this.posts
      .filter(post => post.authorId === authorId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return authorPosts;
  }

  async update(id: string, data: UpdatePostData): Promise<Post | null> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return null;

    const updatedPost = {
      ...this.posts[postIndex],
      ...data,
      updatedAt: new Date()
    };

    this.posts[postIndex] = updatedPost;
    return updatedPost;
  }

  async delete(id: string): Promise<boolean> {
    const postIndex = this.posts.findIndex(post => post.id === id);
    if (postIndex === -1) return false;

    this.posts.splice(postIndex, 1);
    return true;
  }

  async searchPosts(query: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const matchingPosts = this.posts
      .filter(post => 
        post.visibility === 'public' &&
        (post.content.toLowerCase().includes(query.toLowerCase()) ||
         (post.title && post.title.toLowerCase().includes(query.toLowerCase())))
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return matchingPosts;
  }

  async getPublicPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    const publicPosts = this.posts
      .filter(post => post.visibility === 'public')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return publicPosts;
  }

  async getPostsByVisibility(authorId: string, visibility: 'public' | 'private' | 'followers', limit: number = 20, offset: number = 0): Promise<Post[]> {
    const visibilityPosts = this.posts
      .filter(post => post.authorId === authorId && post.visibility === visibility)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return visibilityPosts;
  }

  // Helper method for testing
  clear(): void {
    this.posts = [];
    this.nextId = 1;
  }
} 