import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import userService from "@/services/userService.ts";
import { validateRegisterInput } from "@/validators/userValidator.ts";
import { Request, Response, type NextFunction } from "express";
import mongoose from "mongoose";
import * as userRepo from "@/repositories/userRepository.ts";

export class UserController {
  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, name } = validateRegisterInput(req.body);
      const existingUser = await userService.getUserByUsername(username);
      const context = createFederationContextFromExpressReq(req);
      const userId = existingUser?._id ?? new mongoose.Types.ObjectId();

      await userRepo.upsertUser(userId, username);
      await userRepo.upsertActor(userId, {
        username,
        name,
        context,
      });

      res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
