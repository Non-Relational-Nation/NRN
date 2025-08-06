import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import { postRepository } from "@/repositories/postRepository.ts";
import { userRepository } from "@/repositories/userRepository.ts";
import actorService from "@/services/actorService.ts";
import { PostService } from "@/services/postService.ts";
import userService from "@/services/userService.ts";
import { Create, Follow, isActor, Note } from "@fedify/fedify";
import { Request, Response, type NextFunction } from "express";

export class UserController {
  async registerUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

  async getUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
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

  async searchUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const search = req.query.search as string;
      const users = await userService.searchUsers(search);
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async getUserFollowers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userFollowers = await userService.getUserFollowers(
        req.params.username
      );
      return res.json(userFollowers);
    } catch (err) {
      next(err);
    }
  }

  async sendFollowRequest(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const username = req.params.username;
      const handle = req.body.actor;
      if (typeof handle !== "string") {
        return res.status(400).send("Invalid actor handle or URL");
      }
      const ctx = createFederationContextFromExpressReq(req);

      const actor = await ctx.lookupObject(handle.trim());
      if (!isActor(actor)) {
        return res.status(400).send("Invalid actor handle or URL");
      }

      await ctx.sendActivity(
        { identifier: username },
        actor,
        new Follow({
          actor: ctx.getActorUri(username),
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

  async getUserFollowing(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const userFollowing = await userService.getUserFollowing(
        req.params.username
      );
      return res.json({ following: userFollowing });
    } catch (err) {
      next(err);
    }
  }

  //Added here to avoid confusion with the post in posts routes
  async addPost(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      const username = req.params.username;

      const user = await userService.getUserByUsername(username);

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const actor = await actorService.getActorByUserId(user.id);

      if (!actor) {
        return res.status(404).json({ error: "Actor profile not found" });
      }

      const content = req.body.content.toString();

      if (content == null || content.trim() === "") {
        return res.status(400).json({ error: "Content is required" });
      }

      const ctx = createFederationContextFromExpressReq(req);

      const post = await new PostService(
        postRepository,
        userRepository
      ).createPost(ctx, actor, username, content);

      if (!post) {
        return res.status(500).json({ error: "Failed to create a post" });
      } else {
        const noteArgs = { identifier: username, id: post.id };
        const note = await ctx.getObject(Note, noteArgs);
        
        
        await ctx.sendActivity(
          { identifier: username },
          "followers",
          new Create({
            id: new URL("#activity", note?.id ?? undefined),
            object: note,
            actors: note?.attributionIds,
            tos: note?.toIds,
            ccs: note?.ccIds,
          })
        );
        
        return res.status(201).json({postUrl: ctx.getObjectUri(Note, noteArgs).href});
      }
    } catch (err) {
      next(err);
    }
  }
}

export default new UserController();
