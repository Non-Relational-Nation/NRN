import { Request, Response, type NextFunction } from "express";
import { mapOutboxToPosts, PostService } from "../services/postService.js";
import { UpdatePostData } from "../types/post.js";
import { uploadFileToS3 } from "../util/s3Upload.ts";
import actorService from "@/services/actorService.ts";
import { Create, Like, Note } from "@fedify/fedify";
import { createFederationContextFromExpressReq } from "@/federation/federationContext.ts";
import userService from "@/services/userService.ts";
import { imageSize } from "image-size";
import type { noteArgs } from "@/types/noteArgs.ts";
import type { AuthenticatedRequest } from "@/types/common.ts";

export class PostController {
  constructor(private postService: PostService) {
    this.postService = postService;
  }

  async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
      if (!req?.user?.email) {
        res.status(401).send("No username for logged in user");
        return;
      }
      const user = await userService.getUserByEmail(req?.user?.email);
      // Validate authorId and log more details for debugging
      let authorId = user?.id;
      // Always prefer user_id if present and valid (for actor->user mapping)
      if (
        req.body.user_id &&
        typeof req.body.user_id === "string" &&
        req.body.user_id.length === 24
      ) {
        if (authorId !== req.body.user_id) {
          console.warn(
            "Overriding authorId with user_id from body:",
            req.body.user_id
          );
        }
        authorId = req.body.user_id;
      }

      const ctx = createFederationContextFromExpressReq(req);

      if (!user) {
        res.status(400).json({ error: "User not found" });
        return;
      }

      const actor = await actorService.getActorByUserId(user.id);

      if (!actor) {
        res.status(404).json({ error: "Actor profile not found" });
        return;
      }

      // Handle file uploads
      let files: any[] = [];
      if (Array.isArray((req as any).files)) {
        files = (req as any).files;
      } else if (req.files && typeof req.files === "object") {
        // Multer can also provide files as an object (when using .fields)
        files = Object.values(req.files).flat();
      }
      // Debugging: log file info
      console.log(
        "Received files:",
        files.map((f) => ({
          originalname: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
        }))
      );
      let media: any[] = [];
      if (files.length > 0) {
        media = await Promise.all(
          files.map(async (file: any) => {
            const url = await uploadFileToS3(file);

            let width, height;
            if (file.mimetype && file.mimetype.startsWith("image/")) {
              const dimensions = imageSize(file.buffer);
              width = dimensions.width;
              height = dimensions.height;
            } else {
              width = undefined;
              height = undefined;
            }

            return {
              mediaType: file.mimetype,
              url: url,
              width,
              height,
            };
          })
        );
      }

      const content = req.body.content.toString();
      // Check if author exists in users collection before proceeding

      const postData = {
        actor_id: actor.id,
        content,
        attachment: media,
      };

      // Debugging: log postData
      console.log("Creating post with data:", postData);
      const post = await this.postService.createPost(
        ctx,
        user.username,
        postData
      );

      if (!post) {
        res.status(500).json({ error: "Failed to create a post" });
        return;
      } else {
        const noteArgs: Record<string, string> = {
          identifier: user.username,
          id: post.id!,
        };
        const note = await ctx.getObject(Note, noteArgs);

        await ctx.sendActivity(
          { identifier: user.username },
          "followers",
          new Create({
            id: new URL("#activity", note?.id ?? undefined),
            object: note,
            actors: note?.attributionIds,
            tos: note?.toIds,
            ccs: note?.ccIds,
          })
        );

        res.status(201).json({
          success: true,
          message: "Post created successfully",
          data: post,
        });
      }
    } catch (error) {
      console.error("Error in createPost:", error);
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }
      res.status(500).json({
        success: false,
        error: "Failed to create post",
      });
    }
  }

  async getPost(req: Request, res: Response, next: Function): Promise<void> {
    try {
      const post = await this.postService.getPostWithAuthor(req.params.id);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }
      res.json(post);
    } catch (err) {
      next(err);
    }
  }

  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdatePostData = req.body;
      const authorId = req.body.authorId; // In real app, get from auth middleware

      if (!authorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const post = await this.postService.updatePost(id, updateData, authorId);

      if (!post) {
        res.status(404).json({
          success: false,
          error: "Post not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Post updated successfully",
        data: post,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to update post",
      });
    }
  }

  async deletePost(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const authorId = req.body.authorId; // In real app, get from auth middleware

      if (!authorId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const deleted = await this.postService.deletePost(id, authorId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: "Post not found",
        });
        return;
      }

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to delete post",
      });
    }
  }

  async getPostsByAuthor(
    req: Request,
    res: Response,
    next: Function
  ): Promise<void> {
    try {
      const handle = req.params.handle;

      const author = await actorService.fetchActorByHandle(handle);
      console.log("author: ", author);

      if (!author) {
        res.status(404).json({
          success: false,
          error: "Author not found",
        });
        return;
      }

      const outboxUrl = author?.outbox;

      if (!outboxUrl) {
        res.status(201).json({
          success: true,
          data: [],
        });
        return;
      }

      const userPosts = await fetch(outboxUrl, {
        headers: {
          Accept: "application/json",
        },
      });
      const data = await userPosts.json();
      if (!data) {
        res.status(404).json({
          success: false,
          error: "No posts found for this author",
        });
        return;
      }

      if (data?.first) {
        const firstPage = await fetch(data?.first, {
          headers: {
            Accept: "application/json",
          },
        });
        res.json(mapOutboxToPosts(await firstPage.json()));
      } else {
        res.json(mapOutboxToPosts(data));
      }
    } catch (err) {
      next(err);
    }
  }

  async searchPosts(req: Request, res: Response): Promise<void> {
    try {
      const { q: query } = req.query;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;

      if (!query || typeof query !== "string") {
        res.status(400).json({
          success: false,
          error: "Search query is required",
        });
        return;
      }

      const posts = await this.postService.searchPosts(query, limit, offset);

      res.json({
        success: true,
        data: {
          query,
          posts,
          pagination: {
            limit,
            offset,
            total: posts.length,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Failed to search posts",
      });
    }
  }

  async getPublicPosts(
    req: AuthenticatedRequest,
    res: Response,
    next: Function
  ): Promise<void> {
    try {

      if (!req?.user?.email) {
        res.status(401).send("No username for logged in user");
        return;
      }

      const user = await userService.getUserByEmail(req?.user?.email);

      if(!user){
        res.status(404).send("User not found");
        return;
      }

      const actor = await actorService.getActorByUserId(user.id);

      
      if(!actor){
        res.status(404).send("Actor not found");
        return;
      }

      const author = await actorService.fetchActorByHandle(actor.handle);

      if (!author) {
        res.status(404).json({
          success: false,
          error: "Author not found",
        });
        return;
      }

      const inboxUrl = author?.inbox;

      if (!inboxUrl) {
        res.status(201).json({
          success: true,
          data: [],
        });
        return;
      }

      const userPosts = await fetch(inboxUrl, {
        headers: {
          Accept: "application/json",
        },
      });
      const data = await userPosts.json();
      if (!data) {
        res.status(404).json({
          success: false,
          error: "No posts found for this author",
        });
        return;
      }

      if (data?.first) {
        const firstPage = await fetch(data?.first, {
          headers: {
            Accept: "application/json",
          },
        });
        res.json(mapOutboxToPosts(await firstPage.json()));
      } else {
        res.json(mapOutboxToPosts(data));
      }
    } catch (err) {
      next(err);
    }
  }

  async getFeed(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.body.userId; // In real app, get from auth middleware
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const offset = req.query.offset
        ? parseInt(req.query.offset as string)
        : 0;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const posts = await this.postService.getFeedForUser(
        userId,
        limit,
        offset
      );

      res.json({
        success: true,
        data: {
          posts,
          pagination: {
            limit,
            offset,
            total: posts.length,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to get feed",
      });
    }
  }
  // Like a post
  async likePost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const userId = req.body.userId;

<<<<<<< Updated upstream
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        res.status(404).send("User not found");
        return;
      }

      const post = await this.postService.getPostById(id);
      if (!post) {
        res.status(404).send("Post not found");
        return;
      }

      const liker = await actorService.getActorByUserId(userId);
      if (!liker) {
        res.status(404).json({ message: "Actor not found" });
        return;
      }

      const existingPostLike = await this.postService.getLikedPost(liker.id, post.id);
      if (existingPostLike) {
        res.status(409).json({ message: "Post already liked" });
        return;
      }

      // Prepare federated Like activity
      const like = new Like({
        id: new URL(`#like-${liker.id}-${post.id}`, post.uri), // unique
        actor: liker.uri,
        object: new URL(post.uri),
      });

      const authorActor = await actorService.getActorById(post.actor_id);
      if (!authorActor) {
        res.status(404).json({ message: "Post author not found" });
        return;
      }

      let likeResult;
      try {
        likeResult = await this.postService.likePost(liker.id, post.id);
      } catch (err: any) {
        console.error("Error in repository likePost:", err);
        res.status(500).json({ success: false, error: "Failed to like post", details: err.message, stack: err.stack });
        return;
      }
      if (!likeResult) {
        res.status(409).json({ message: "Post already liked" });
        return;
      }

      const likeRecipient = {
        id: new URL(authorActor.uri),
        inboxId: new URL(authorActor.inbox_url),
      };

      const ctx = createFederationContextFromExpressReq(req);
      try {
        await ctx.sendActivity(
          { identifier: user.username },
          likeRecipient,
          like
        );
      } catch (err: any) {
        console.error("Error in ctx.sendActivity:", err);
        res.status(500).json({ success: false, error: "Failed to federate like activity", details: err.message, stack: err.stack });
        return;
      }

      res.status(200).json({ message: "Post liked" });
      return;
    } catch (error: any) {
      console.error("Error in likePost:", error);
      res.status(500).json({ success: false, error: "Failed to like post", details: error.message, stack: error.stack });
=======
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
>>>>>>> Stashed changes
    }

    const user = await userService.getUserById(userId);
    if (!user) {
      res.status(404).send("User not found");
      return;
    }

    const post = await this.postService.getPostById(id);
    if (!post) {
      res.status(404).send("Post not found");
      return;
    }

    const liker = await actorService.getActorByUserId(userId);
    if (!liker || !liker.uri) {
      res.status(404).json({ message: "Actor not found or missing URI" });
      return;
    }

    if (!post.uri) {
      res.status(400).json({ message: "Post URI missing" });
      return;
    }

    const existingPostLike = await this.postService.getLikedPost(
      liker.id,
      post.id
    );

    if (existingPostLike) {
      res.status(409).json({ message: "Post already liked" });
      return;
    }

    // Make sure post.uri is a valid absolute URL string
    const postUrlString = typeof post.uri === "string" ? post.uri : post.uri?.toString();
    if (!postUrlString) {
      res.status(400).json({ message: "Invalid post URI" });
      return;
    }

    // Create a unique Like id URL based on post URL
    const likeId = new URL(`#like-${liker.id}-${post.id}`, postUrlString);

    const actorUrl = new URL(liker.uri);

    // Create Like activity with actor as liker URI string and object as post URL
    const like = new Like({
      id: likeId,
      actor: actorUrl,
      object: new URL(postUrlString),
    });

    const authorActor = await actorService.getActorById(post.actor_id);
    if (!authorActor || !authorActor.uri || !authorActor.inbox_url) {
      res.status(404).json({ message: "Post author actor or inbox missing" });
      return;
    }

    await this.postService.likePost(liker.id, post.id);

    const likeRecipient = {
      id: new URL(authorActor.uri),
      inboxId: new URL(authorActor.inbox_url),
    };

    const ctx = createFederationContextFromExpressReq(req);

    await ctx.sendActivity(
      { identifier: user.username },
      likeRecipient,
      like
    );

    res.status(200).json({ message: "Post liked" });
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ success: false, error: "Failed to like post" });
  }
}
}
