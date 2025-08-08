import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import { postRepository } from "@/repositories/postRepository.ts";
import { userRepository } from "@/repositories/userRepository.ts";
import actorService from "@/services/actorService.ts";
import { PostService } from "@/services/postService.ts";
import userService, { mapActorToUserObject } from "@/services/userService.ts";
import { AuthenticatedRequest } from "@/types/common.ts";
import { Create, Follow, isActor, lookupWebFinger, Note } from "@fedify/fedify";
import { Request, Response, type NextFunction } from "express";
import { GraphService} from "@services/graphService.js";

 class UserController {
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
      let actor=await userService.registerUser({
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

  async getUserByHandle(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const handle = req.params.handle;
      const match = await actorService.fetchActorByHandle(handle);
      if (!match) {
        return res.status(404).json({ error: "Actor not found" });
      }
      const user = await mapActorToUserObject(match);
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
      const match = await actorService.fetchActorByHandle(search);
      if (!match) {
        return res.status(200).json([]);
      }
      const user = await mapActorToUserObject(match);
      return res.json([user]);
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
      return res.json(userFollowers);
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

      const handle = req.params.handle;
      const ctx = createFederationContextFromExpressReq(req);

      const actor = await ctx.lookupObject(`${handle}`);

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

      try {
        await GraphService.addFollow(follower.id.toString(), actor.id!.toString());
      } catch (err) {
        console.error('Failed to add follow to Neo4j graph:', err);
      }

      // Ensure actor exists in Neo4j graph before follow
      try {
        // Add follower as actor if not present
        await GraphService.addActor(follower.id.toString(), 'User');
        // If ActivityPub actor, add as actor too
        if (isActor(actor)) {
          await GraphService.addActor(actor.preferredUsername?.toString() || actor.id!.toString(), 'Actor');
        }
      } catch (err) {
        console.error('Failed to ensure actors in Neo4j graph:', err);
      }

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

  async suggestUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const currentActorHandler = req.query.handle as string;
      if (!currentActorHandler) {
        return res.status(404).json({ error: 'Missing current actor handle' });
      }

      const ctx = createFederationContextFromExpressReq(req);
      const actor = await ctx.lookupObject(`${currentActorHandler}`);
      if (!isActor(actor)) {
        return res.status(400).json({ error: 'Invalid actor handle or URL' });
      }
      const suggestions = await GraphService.getSuggestedUsersToFollow(actor.id!.toString());
      res.json({ suggestions });
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();