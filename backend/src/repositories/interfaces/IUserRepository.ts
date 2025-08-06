import mongoose, { type Types } from "mongoose";
import { User, CreateUserData, UpdateUserData } from "../../types/user.js";

export interface IUserRepository {
  create(data: CreateUserData): Promise<User>;
  findById(id: Types.ObjectId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
  searchUsers(query: string, limit?: number, offset?: number): Promise<User[]>;
  upsertUser(
    userId: mongoose.Types.ObjectId,
    data: {
      username: string;
      email: string;
      displayName: string;
      bio?: string;
      avatar?: string | null;
    }
  ): Promise<void>;
  upsertActor(userId: mongoose.Types.ObjectId, actor: any): Promise<void>;
}