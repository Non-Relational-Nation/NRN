import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import userService from "@/services/userService.ts";
import { AuthenticatedRequest } from "@/types/common.ts";
import { Follow, isActor } from "@fedify/fedify";
import { Request, Response, type NextFunction } from "express";

export class UserController {
  async registerUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
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
        context,
      });
      return res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const requestedId = req.params.id;
      const user = await userService.getUserById(requestedId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json(user);
    } catch (err) {
      next(err);
    }
  }

  async searchUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const search = req.query.search as string;
      const users = await userService.searchUsers(search);
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUserFollowers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userFollowers = await userService.getUserFollowers(
        req.params.username
      );
      return res.json({ followers: userFollowers });
    } catch (err) {
      next(err);
    }
  }

  async sendFollowRequest(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req?.user?.email) {
        return res.status(401).send("No username for logged in user");
      }
      const follower = await userService.getUserByEmail(req?.user?.email);
      if (!follower) {
        return res.status(401).send("No user found with email");
      }
      const followerUsername = follower?.username;

      const username = req.params.username;
      const ctx = createFederationContextFromExpressReq(req);

      const actor = await ctx.lookupObject(username);
      if (!isActor(actor)) {
        return res.status(400).send("Invalid actor handle or URL");
      }

      await ctx.sendActivity(
        { identifier: followerUsername },
        actor,
        new Follow({
          actor: ctx.getActorUri(followerUsername),
          object: actor.id,
          to: actor.id,
        })
      );
      return res
        .status(201)
        .json({ message: "Follow request sent successfully" });
    } catch (err) {
      next(err);
    }
  }

  async getUserFollowing(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const userFollowing = await userService.getUserFollowing(
        req.params.username
      );
      return res.json({ following: userFollowing });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
