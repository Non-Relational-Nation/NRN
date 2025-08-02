import type mongoose from "mongoose";
import { ActorModel } from "../models/actorModel.ts";
import { UserModel } from "../models/userModel.ts";
import { User, CreateUserData, UpdateUserData } from "../types/user.js";

function toUser(obj: any): User {
  const { _id, __v, ...rest } = obj;
  return { ...rest, id: _id.toString() };
}

export const userRepository = {
  async create(data: CreateUserData): Promise<User> {
    const doc = await UserModel.create(data);
    return toUser(doc.toObject());
  },
  async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findById(id);
    return doc ? toUser(doc.toObject()) : null;
  },
  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserModel.findOne({ email });
    return doc ? toUser(doc.toObject()) : null;
  },
  async findByUsername(username: string): Promise<User | null> {
    const doc = await UserModel.findOne({ username });
    return doc ? toUser(doc.toObject()) : null;
  },
  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const doc = await UserModel.findByIdAndUpdate(id, data, { new: true });
    return doc ? toUser(doc.toObject()) : null;
  },
  async delete(id: string): Promise<boolean> {
    const doc = await UserModel.findByIdAndDelete(id);
    return !!doc;
  },
  async searchUsers(query: string, limit = 20, offset = 0): Promise<User[]> {
    const docs = await UserModel.find({
      username: { $regex: query, $options: "i" },
    })
      .skip(offset)
      .limit(limit);
    return docs.map((d: any) => toUser(d.toObject()));
  },
  async upsertUser(
    userId: mongoose.Types.ObjectId,
    data: {
      username: string;
      email: string;
      displayName: string;
      bio?: string;
      avatar?: string | null;
    }
  ): Promise<void> {
    await UserModel.updateOne(
      { _id: userId },
      {
        $setOnInsert: {
          followersCount: 0,
          followingCount: 0,
          postsCount: 0,
          createdAt: new Date(),
        },
        $set: {
          username: data.username,
          email: data.email,
          displayName: data.displayName,
          bio: data.bio || "",
          avatar: data.avatar || null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  },
  async upsertActor(
    userId: mongoose.Types.ObjectId,
    actor: any
  ): Promise<void> {
    const { username, name, context } = actor;
    const handle = `@${username}@${context.hostname}`;
    await ActorModel.updateOne(
      { user_id: userId },
      {
        $set: {
          user_id: userId,
          uri: context.getActorUri(username).href,
          handle,
          name,
          inbox_url: context.getInboxUri(username).href,
          shared_inbox_url: context.getInboxUri().href,
          url: context.getActorUri(username).href,
        },
      },
      { upsert: true }
    );
  },
};
