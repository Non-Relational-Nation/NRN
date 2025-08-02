import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import userService from "@/services/userService.ts";
// import { validateRegisterInput } from "@/validators/userValidator.ts";
import { Request, Response, type NextFunction } from "express";

export class UserController {
  async registerUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, email, displayName, bio, avatar } = req.body;
      if (!username || !email || !displayName) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const context = createFederationContextFromExpressReq(req);
      await userService.registerUser({
        username,
        email,
        displayName,
        bio: bio || "",
        avatar: avatar || null,
        context
      });
      return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      next(err);
      return;
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestedId = req.params.id;
      const user = await userService.getUserById(requestedId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      next(err);
      return;
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const users = await userService.searchUsers(search);
      res.json(users);
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
