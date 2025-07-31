import { Collection, ObjectId } from 'mongodb';
import { Post, CreatePostData, UpdatePostData } from '../../types/post';
import { IPostRepository } from '../interfaces/IPostRepository';
import { database } from '../../config/database';

export class MongoPostRepository implements IPostRepository {
  private collection: Collection;

  constructor() {
    this.collection = database.getDb().collection('posts');
  }

  async create(data: CreatePostData): Promise<Post> {
    const postData = {
      ...data,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      visibility: data.visibility || 'public',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.collection.insertOne(postData);
    
    return {
      id: result.insertedId.toString(),
      ...postData
    };
  }

  async findById(id: string): Promise<Post | null> {
    try {
      const objectId = new ObjectId(id);
      const post = await this.collection.findOne({ _id: objectId });
      
      if (!post) return null;
      
      return {
        id: post._id.toString(),
        authorId: post.authorId,
        content: post.content,
        title: post.title,
        visibility: post.visibility,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        sharesCount: post.sharesCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      };
    } catch (error) {
      return null;
    }
  }

  async findByAuthorId(authorId: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const posts = await this.collection
      .find({ authorId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return posts.map(post => ({
      id: post._id.toString(),
      authorId: post.authorId,
      content: post.content,
      title: post.title,
      visibility: post.visibility,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  }

  async update(id: string, data: UpdatePostData): Promise<Post | null> {
    try {
      const objectId = new ObjectId(id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await this.collection.findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) return null;

      return {
        id: result._id.toString(),
        authorId: result.authorId,
        content: result.content,
        title: result.title,
        visibility: result.visibility,
        likesCount: result.likesCount,
        commentsCount: result.commentsCount,
        sharesCount: result.sharesCount,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const objectId = new ObjectId(id);
      const result = await this.collection.deleteOne({ _id: objectId });
      return result.deletedCount > 0;
    } catch (error) {
      return false;
    }
  }

  async searchPosts(query: string, limit: number = 20, offset: number = 0): Promise<Post[]> {
    const posts = await this.collection
      .find({
        $or: [
          { content: { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } }
        ],
        visibility: 'public'
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return posts.map(post => ({
      id: post._id.toString(),
      authorId: post.authorId,
      content: post.content,
      title: post.title,
      visibility: post.visibility,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  }

  async getPublicPosts(limit: number = 20, offset: number = 0): Promise<Post[]> {
    const posts = await this.collection
      .find({ visibility: 'public' })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return posts.map(post => ({
      id: post._id.toString(),
      authorId: post.authorId,
      content: post.content,
      title: post.title,
      visibility: post.visibility,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  }

  async getPostsByVisibility(authorId: string, visibility: 'public' | 'private' | 'followers', limit: number = 20, offset: number = 0): Promise<Post[]> {
    const posts = await this.collection
      .find({ authorId, visibility })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return posts.map(post => ({
      id: post._id.toString(),
      authorId: post.authorId,
      content: post.content,
      title: post.title,
      visibility: post.visibility,
      likesCount: post.likesCount,
      commentsCount: post.commentsCount,
      sharesCount: post.sharesCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));
  }
} 