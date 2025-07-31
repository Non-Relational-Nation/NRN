import { Collection, ObjectId } from 'mongodb';
import { User, CreateUserData, UpdateUserData } from '../../types/user.js';
import { IUserRepository } from '../interfaces/IUserRepository.js';
import { database } from '../../config/database.js';

export class MongoUserRepository implements IUserRepository {
  private collection: Collection | null = null;

  constructor() {}

  private getCollection(): Collection {
    if (!this.collection) {
      this.collection = database.getDb().collection('users');
    }
    return this.collection;
  }

  async create(data: CreateUserData): Promise<User> {
    const userData = {
      ...data,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await this.getCollection().insertOne(userData);
    
    return {
      id: result.insertedId.toString(),
      ...userData
    };
  }

  async findById(id: string): Promise<User | null> {
    try {
      const objectId = new ObjectId(id);
      const user = await this.getCollection().findOne({ _id: objectId });
      
      if (!user) {
        return null;
      }

      return {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        avatar: user.avatar,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
    } catch (error) {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.getCollection().findOne({ email });
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async findByUsername(username: string): Promise<User | null> {
    const user = await this.getCollection().findOne({ username });
    
    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    try {
      const objectId = new ObjectId(id);
      const updateData = {
        ...data,
        updatedAt: new Date()
      };

      const result = await this.getCollection().findOneAndUpdate(
        { _id: objectId },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result) {
        return null;
      }

      return {
        id: result._id.toString(),
        username: result.username,
        email: result.email,
        displayName: result.displayName,
        bio: result.bio,
        avatar: result.avatar,
        followersCount: result.followersCount,
        followingCount: result.followingCount,
        postsCount: result.postsCount,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      };
    } catch (error) {
      // Invalid ObjectId format
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const objectId = new ObjectId(id);
      const result = await this.getCollection().deleteOne({ _id: objectId });
      return result.deletedCount > 0;
    } catch (error) {
      // Invalid ObjectId format
      return false;
    }
  }

  async searchUsers(query: string, limit?: number, offset?: number): Promise<User[]> {
    const filter = {
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    };

    const cursor = this.getCollection().find(filter);
    
    if (offset) {
      cursor.skip(offset);
    }
    
    if (limit) {
      cursor.limit(limit);
    }

    const users = await cursor.toArray();

    return users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatar: user.avatar,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
      postsCount: user.postsCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
  }
} 