import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import { ActorModel } from "@/models/actorModel.ts";
import { FollowModel } from "@/models/followSchema.ts";
import actorService from "@/services/actorService.ts";
import userService, { mapActorToUserObject } from "@/services/userService.ts";
import { AuthenticatedRequest } from "@/types/common.ts";
import { Follow, getActorHandle, isActor, Undo } from "@fedify/fedify";
import { Request, Response, type NextFunction } from "express";
import { GraphService} from "@services/graphService.js";
import { Redis } from "ioredis";
import { config } from "@/config/index.ts";

async function persistActor(actor: any) {
  if (!actor.id || !actor.inboxId) {
    return null;
  }

  const updated = await ActorModel.findOneAndUpdate(
    { uri: actor.id.href },
    {
      handle: await getActorHandle(actor),
      name: actor.name?.toString(),
      inbox_url: actor.inboxId.href,
      url: actor.url?.href ?? null,
    },
    {
      new: true,
      upsert: true,
    }
  );

  return updated ?? null;
}

const redis = new Redis({
  host: config.databases.redis?.host || "localhost",
  port: config.databases.redis?.port || 6379,
});

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
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req?.user?.email) {
        return res.status(401).send("No username for logged in user");
      }
      const requester = await userService.getUserByEmail(req?.user?.email);
      if (!requester) {
        return res.status(401).send("No user found with email");
      }

      let requesterActor = await ActorModel.findOne({ user_id: requester.id });
      if (!requesterActor) {
        const ctx = createFederationContextFromExpressReq(req);
        await userService.ensureUserActor(requester, ctx);
        requesterActor = await ActorModel.findOne({ user_id: requester.id });
        if (!requesterActor) {
          return res.status(401).send("Failed to create actor for user");
        }
      }

      const handle = req.params.handle;
      const match = await actorService.fetchActorByHandle(handle);
      if (!match) {
        return res.status(204).send();
      }
      const user = await mapActorToUserObject(match, requesterActor.id);
      return res.json(user);
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
      return res.status(401).send("No email for logged in user");
    }

    const follower = await userService.getUserByEmail(req.user.email);
    if (!follower) {
      return res.status(401).send("No user found with email");
    }

    const followerUsername = follower.username;
    const handle = req.params.handle;
    const ctx = createFederationContextFromExpressReq(req);

    const actor = await ctx.lookupObject(handle);
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
      const followerActor = await ActorModel.findOne({ user_id: follower.id });
      const followingActor = await persistActor(actor);
      
      if (followerActor && followingActor) {
        await FollowModel.create({
          following_id: followingActor._id,
          follower_id: followerActor._id,
        });
      }
      
      const followerHandle = await getActorHandle(ctx.getActorUri(followerUsername));
      const actorHandle = await getActorHandle(actor.id!);
      
      await GraphService.ensureActors([
        {
          id: follower.id.toString(),
          username: followerHandle.toString(),
        },
        {
          id: actor.id!.toString(),
          username: actorHandle.toString(),
        },
      ]);

      await GraphService.addFollow(follower.id.toString(), actor.id!.toString());
    } catch (err) {
      console.error("Failed to update follow data:", err);
    }

    const followerActor = await ActorModel.findOne({ user_id: follower.id });
    await redis.del(`suggestions:${followerUsername}`);
    if (followerActor) {
      await redis.del(`recommendations:${followerActor.uri}`);
      await redis.del(`network-stats:${followerActor.uri}`);
    }

    return res.status(201).json({ message: "Follow request sent successfully" });
  } catch (err) {
    next(err);
  }
}

  async unfollow(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req?.user?.email) {
        return res.status(401).send("Unauthorized");
      }
      const follower = await userService.getUserByEmail(req?.user?.email);
      if (!follower) {
        return res.status(404).send("User not found");
      }
      const followerUsername = follower?.username;

      const handle = req.params.handle;
      const ctx = createFederationContextFromExpressReq(req);

      const actor = await ctx.lookupObject(`${handle}`);

      if (!isActor(actor)) {
        return res.status(400).send("Invalid actor handle or URL");
      }

      const followActivity = new Follow({
        actor: ctx.getActorUri(followerUsername),
        object: actor.id,
        to: actor.id,
      });

      const undoActivity = new Undo({
        actor: ctx.getActorUri(followerUsername),
        object: followActivity,
        to: actor.id,
      });

      await ctx.sendActivity(
        { identifier: followerUsername },
        actor,
        undoActivity
      );
      
      try {
        const followerActor = await ActorModel.findOne({ user_id: follower.id });
        const followingActor = await ActorModel.findOne({ uri: actor.id!.href });
        
        if (followerActor && followingActor) {
          await FollowModel.deleteOne({
            following_id: followingActor._id,
            follower_id: followerActor._id,
          });
        }
        
        await GraphService.removeFollow(follower.id.toString(), actor.id!.toString());
      } catch (err) {
        console.error("Failed to remove follow data:", err);
      }
      
      const followerActor = await ActorModel.findOne({ user_id: follower.id });
      if (followerActor) {
        await redis.del(`suggestions:${followerUsername}`);
        await redis.del(`recommendations:${followerActor.uri}`);
        await redis.del(`network-stats:${followerActor.uri}`);
      }
      
      return res
        .status(200)
        .json({ message: `You have unfollowed ${handle}` });
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

  async getUsersByHandles(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> {
    try {
      if (!req?.user?.email) {
        return res.status(401).send("No username for logged in user");
      }
      const requester = await userService.getUserByEmail(req?.user?.email);
      if (!requester) {
        return res.status(401).send("No user found with email");
      }
      const requesterActor = await ActorModel.findOne({ user_id: requester.id });
      if (!requesterActor) {
        return res.status(401).send("No actor found for user");
      }

      const { handles } = req.body;
      if (!handles || !Array.isArray(handles)) {
        return res.status(400).json({ error: "Invalid handles array" });
      }

      const cacheKey = `users:batch:${handles.sort().join(':')}:${requesterActor.id}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const users = [];
      for (const handle of handles) {
        try {
          const userCacheKey = `user:${handle}:${requesterActor.id}`;
          const cachedUser = await redis.get(userCacheKey);
          
          if (cachedUser) {
            users.push(JSON.parse(cachedUser));
          } else {
            const match = await actorService.fetchActorByHandle(handle);
            if (match) {
              const user = await mapActorToUserObject(match, requesterActor.id);
              users.push(user);
              await redis.setex(userCacheKey, 300, JSON.stringify(user)); 
            }
          }
        } catch (err) {
          console.error(`Failed to fetch user ${handle}:`, err);
        }
      }
      
      await redis.setex(cacheKey, 180, JSON.stringify(users));
      return res.json(users);
    } catch (err) {
      next(err);
    }
  }

  async suggestUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const currentActorHandler = req.query.handle;
      if (!currentActorHandler) {
        return res.status(404).json({ error: 'Missing current actor handle' });
      }

      const suggestionsCacheKey = `suggestions:${currentActorHandler}`;
      const cached = await redis.get(suggestionsCacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const ctx = createFederationContextFromExpressReq(req);
      const actor = await ctx.lookupObject(`${currentActorHandler}`);
      if (!isActor(actor)) {
        return res.status(400).json({ error: 'Invalid actor handle or URL' });
      }
      const suggestions = await GraphService.getSuggestedUsersToFollow(actor.id!.toString());
      const result = { suggestions };
      
      await redis.setex(suggestionsCacheKey, 600, JSON.stringify(result)); // 10 min cache
      return res.json(result);
    } catch (err) {
      next(err);
    }
  }

  async getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req?.user?.email) {
        return res.status(401).send("Unauthorized");
      }
      const user = await userService.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(401).send("User not found");
      }
      const actor = await ActorModel.findOne({ user_id: user.id });
      if (!actor) {
        return res.status(401).send("Actor not found");
      }

      const cacheKey = `recommendations:${actor.uri}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const recommendations = await GraphService.getFollowRecommendations(actor.uri, 10);
      await redis.setex(cacheKey, 300, JSON.stringify(recommendations));
      return res.json(recommendations);
    } catch (err) {
      next(err);
    }
  }

  async getNetworkStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      if (!req?.user?.email) {
        return res.status(401).send("Unauthorized");
      }
      const user = await userService.getUserByEmail(req.user.email);
      if (!user) {
        return res.status(401).send("User not found");
      }
      const actor = await ActorModel.findOne({ user_id: user.id });
      if (!actor) {
        return res.status(401).send("Actor not found");
      }

      const cacheKey = `network-stats:${actor.uri}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const stats = await GraphService.getNetworkStats(actor.uri);
      await redis.setex(cacheKey, 600, JSON.stringify(stats));
      return res.json(stats);
    } catch (err) {
      next(err);
    }
  }

  async findConnection(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, targetUsername } = req.params;
      
      const fromUser = await userService.getUserByUsername(username);
      const toUser = await userService.getUserByUsername(targetUsername);
      
      if (!fromUser || !toUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const fromActor = await ActorModel.findOne({ user_id: fromUser.id });
      const toActor = await ActorModel.findOne({ user_id: toUser.id });
      
      if (!fromActor || !toActor) {
        return res.status(404).json({ error: "Actor not found" });
      }

      const path = await GraphService.findShortestPath(fromActor.uri, toActor.uri);
      return res.json({ path, degrees: path.length - 1 });
    } catch (err) {
      next(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default new UserController();