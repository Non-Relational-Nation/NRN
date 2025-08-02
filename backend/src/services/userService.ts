// import { validateRegisterInput } from "@/validators/userValidator.ts";
import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import mongoose from "mongoose";
import { IUserRepository } from "@/repositories/interfaces/IUserRepository.ts";
import { userRepository } from "@/repositories/userRepository.ts";

export class UserService {
  constructor(private userRepository: IUserRepository) {}

  getUserByUsername = async (username: string) => {
    return this.userRepository.findByUsername(username);
  };

  async registerUser({ username, email, displayName, bio = "", avatar = null, context }: {
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
    return { message: "User registered successfully" };
  }

  async getUserById(id: string) {
    return this.userRepository.findById(id);
  }

  async searchUsers(query?: string) {
    return this.userRepository.searchUsers(query || "");
  }

  async getUserFollowers(username: string){
    return userRepository.findUserFollowers(username)
  }
}

const userService = new UserService(userRepository);
export default userService;
