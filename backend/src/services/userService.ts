import mongoose from "mongoose";
import { IUserRepository } from "@/repositories/interfaces/IUserRepository.ts";
import { userRepository } from "@/repositories/userRepository.ts";
import { UserResponse } from "@/types/user.ts";
import { ActorModel } from "@/models/actorModel.ts";
import { FollowModel } from "@/models/followSchema.ts";
import { GraphService } from "@/services/graphService.ts";
export class UserService {
  constructor(private userRepository: IUserRepository) {}

  getUserByUsername = async (username: string) => {
    return this.userRepository.findByUsername(username);
  };

  async registerUser({
    username,
    email,
    displayName,
    bio = "",
    avatar = null,
    context,
  }: {
    username: string;
    email: string;
    displayName: string;
    bio?: string;
    avatar?: string | null;
    context: any;
  }) {
    if (!username || !email || !displayName) {
      throw new Error("Missing required fields");
    }

    const existingUser = await this.getUserByUsername(username);
    if (existingUser) {
      throw new Error("User already exists");
    }

    const userId = new mongoose.Types.ObjectId();
    await this.userRepository.upsertUser(userId, {
      username,
      email,
      displayName,
      bio,
      avatar,
    });
    await this.userRepository.upsertActor(userId, {
      username,
      name: displayName,
      context,
    });

    try {
      await GraphService.addActor(userId.toString(), 'User');
    } catch (err) {
      console.error('Failed to add user to Neo4j graph:', err);
    }

    return { message: "User registered successfully" };
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async getUserByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async ensureUserActor(user: any, context: any) {
    const existingActor = await ActorModel.findOne({ user_id: user.id });
    if (!existingActor) {
      await this.userRepository.upsertActor(new mongoose.Types.ObjectId(user.id), {
        username: user.username,
        name: user.displayName,
        context,
      });
      
      try {
        await GraphService.addActor(user.id.toString(), 'User');
      } catch (err) {
        console.error('Failed to add user to Neo4j graph:', err);
      }
    }
    return existingActor;
  }

  async searchUsers(query?: string) {
    return this.userRepository.searchUsers(query || "");
  }

  async getUserFollowers(username: string) {
    return userRepository.findUserFollowers(username);
  }

  async getUserFollowing(username: string) {
    return userRepository.findUserFollowing(username);
  }
}

async function fetchCount(url?: string): Promise<number> {
  if (!url) return 0;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/activity+json" },
    });
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.totalItems === "number" ? data.totalItems : 0;
  } catch {
    return 0;
  }
}

export async function mapActorToUserObject(
  actor: any,
  requester: string
): Promise<UserResponse> {
  let handle = "";
  if (typeof actor.id === "string") {
    try {
      const url = new URL(actor.id);
      const parts = url.pathname.split("/");
      const username = parts[parts.length - 1];
      const domain = url.hostname;
      handle = `${username}@${domain}`;
    } catch {
      handle = "";
    }
  }
  const actorObj = await ActorModel.findOne({ handle: `@${handle}` });

  const follow = await FollowModel.findOne({
    following_id: actorObj?.id,
    follower_id: requester,
  });
  return {
    avatar: actor?.icon?.url ?? actor?.image?.url ?? undefined,
    bio: actor?.summary ?? "",
    displayName: actor?.name ?? actor?.preferredUsername ?? "",
    followersCount: await fetchCount(actor?.followers),
    followingCount: await fetchCount(actor?.following),
    postsCount: await fetchCount(actor?.outbox),
    username: actor.preferredUsername ?? "",
    id: actor.id ?? "",
    handle,
    following: !!follow,
  };
}

const userService = new UserService(userRepository);
export default userService;
