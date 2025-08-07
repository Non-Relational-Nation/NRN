import {
  createFederation,
  Endpoints,
  Person,
  RequestContext,
  exportJwk,
  generateCryptoKeyPair,
  importJwk,
  Follow,
  getActorHandle,
  Accept,
  Undo,
  isActor,
  type Actor as APActor,
  type Recipient,
  Note,
  PUBLIC_COLLECTION,
  Create,
  Like,
} from "@fedify/fedify";
import { MemoryKvStore, InProcessMessageQueue } from "@fedify/fedify";
import { UserModel } from "./models/userModel.ts";
import { KeyModel } from "./models/keySchema.ts";
import { ActorModel } from "./models/actorModel.ts";
import { FollowModel } from "./models/followSchema.ts";
import { ActivityPubPostModel } from "./models/postModel.ts";
import mongoose from "mongoose";
import { LikeModel } from "./models/likeModel.ts";
// import { RedisKvStore,RedisMessageQueue  } from "@fedify/redis";
// import { Redis } from "ioredis";
import { config } from "./config/index.ts";

type KeyType = "RSASSA-PKCS1-v1_5" | "Ed25519";

// For local development, use in-memory store and queue (no Redis needed)
const federation = createFederation({
  kv: new MemoryKvStore(),
  queue: new InProcessMessageQueue(),
  ...(config.nodeEnv === "production" && config.federation && {
    baseUrl: `https://${config.federation.domain}`,
  }),
});

async function persistActor(actor: APActor) {
  if (!actor.id || !actor.inboxId) {
    console.log("Actor is missing required fields");
    return null;
  }

  const updated = await ActorModel.findOneAndUpdate(
    { uri: actor.id.href },
    {
      handle: await getActorHandle(actor),
      name: actor.name?.toString(),
      inbox_url: actor.inboxId.href,
      shared_inbox_url: actor.endpoints?.sharedInbox?.href ?? null,
      url: actor.url?.href ?? null,
    },
    {
      new: true,
      upsert: true,
    }
  );

  return updated ?? null;
}

federation
  .setActorDispatcher(
    "/users/{identifier}",
    async (ctx: RequestContext<unknown>, identifier: string) => {
      const user = await UserModel.findOne({ username: identifier });

      if (!user) return null;

      const keys = await ctx.getActorKeyPairs(identifier);
      return new Person({
        id: ctx.getActorUri(identifier),
        preferredUsername: identifier,
        name: user.displayName,
        inbox: ctx.getInboxUri(identifier),
        endpoints: new Endpoints({
          sharedInbox: ctx.getInboxUri(),
        }),
        url: ctx.getActorUri(identifier),
        publicKey: keys[0]?.cryptographicKey,
        assertionMethods: keys.map((k) => k.multikey),
        followers: ctx.getFollowersUri(identifier),
      });
    }
  )
  .setKeyPairsDispatcher(async (ctx, identifier) => {
    const pairs: CryptoKeyPair[] = [];
    const user = await UserModel.findOne({ username: identifier });

    if (!user) return pairs;

    const keys = await KeyModel.find({ user_id: user.id }).lean();

    const keyMap = Object.fromEntries(keys.map((key) => [key.type, key]));

    for (const keyType of ["RSASSA-PKCS1-v1_5", "Ed25519"]) {
      if (!keyMap[keyType]) {
        console.log(
          `The actor ${identifier} is missing a ${keyType} key; generating...`,
          { identifier, keyType }
        );

        const { privateKey, publicKey } = await generateCryptoKeyPair(
          keyType as KeyType
        );

        const privateJwk = JSON.stringify(await exportJwk(privateKey));
        const publicJwk = JSON.stringify(await exportJwk(publicKey));

        await KeyModel.create({
          user_id: user.id,
          type: keyType,
          private_key: privateJwk,
          public_key: publicJwk,
        });

        pairs.push({ privateKey, publicKey });
      } else {
        pairs.push({
          privateKey: await importJwk(
            JSON.parse(keyMap[keyType].private_key),
            "private"
          ),
          publicKey: await importJwk(
            JSON.parse(keyMap[keyType].public_key),
            "public"
          ),
        });
      }
    }

    return pairs;
  });

federation
  .setInboxListeners("/users/{identifier}/inbox", "/inbox")
  .on(Follow, async (ctx, follow) => {
    if (follow.objectId == null) return;

    const object = ctx.parseUri(follow.objectId);

    if (object === null || object.type !== "actor") return;

    const follower = await follow.getActor();

    if (!follower?.id || !follower.inboxId) return;

    const user = await UserModel.findOne({ username: object.identifier });

    const followingId = user
      ? await ActorModel.findOne({ user_id: user.id })
      : null;

    if (!followingId) return;

    const followerId = (await persistActor(follower))?.id;

    await FollowModel.create({
      following_id: followingId,
      follower_id: followerId,
    });

    const accept = new Accept({
      actor: follow.objectId,
      to: follow.actorId,
      object: follow,
    });

    await ctx.sendActivity(object, follower, accept);
  })
  .on(Undo, async (ctx, undo) => {
    const object = await undo.getObject();
    if (object instanceof Follow) {
      if (undo.actorId == null || object.objectId == null) return;

      const parsed = ctx.parseUri(object.objectId);
      if (parsed == null || parsed.type !== "actor") return;

      const user = await UserModel.findOne({ username: parsed.identifier });
      if (!user) throw new Error("User not found");

      const followingActor = await ActorModel.findOne({ user_id: user._id });
      if (!followingActor) throw new Error("Following actor not found");

      const followerActor = await ActorModel.findOne({
        uri: undo.actorId.href,
      });
      if (!followerActor) throw new Error("Follower actor not found");

      await FollowModel.deleteOne({
        following_id: followingActor._id,
        follower_id: followerActor._id,
      });
    } else if (object instanceof Like) {
      const liker = await persistActor((await undo.getActor()) as Person);
      if (!liker || !object.objectId) return;

      const post = await ActivityPubPostModel.findOne({
        uri: object.objectId.href,
      });
      if (!post) return;

      await LikeModel.deleteOne({
        actor_id: liker._id,
        post_id: post._id,
      });

      await ActivityPubPostModel.updateOne(
        { _id: post._id },
        { $inc: { likesCount: -1 } }
      );
    }
  })
  .on(Accept, async (ctx, accept) => {
    const follow = await accept.getObject();
    if (!(follow instanceof Follow)) return;

    const following = await accept.getActor();
    if (!isActor(following)) return;

    const follower = follow.actorId;
    if (follower == null) return;

    const parsed = ctx.parseUri(follower);
    if (parsed == null || parsed.type !== "actor") return;

    const followingActor = await persistActor(following);
    if (!followingActor) return;

    const user = await UserModel.findOne({ username: parsed.identifier });
    if (!user) return;

    const followerActor = await ActorModel.findOne({ user_id: user._id });
    if (!followerActor) return;

    try {
      await FollowModel.create({
        following_id: followingActor._id,
        follower_id: followerActor._id,
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // Duplicate follow; ignore
      } else {
        throw err;
      }
    }
  })
  .on(Create, async (ctx, create) => {
    const object = await create.getObject();
    if (!(object instanceof Note)) return;

    const actor = create.actorId;
    if (!actor) return;

    const author = await object.getAttribution();
    if (!isActor(author) || author.id?.href !== actor.href) return;

    const actorId = (await persistActor(author))?.id;
    if (!actorId || !object.id) return;

    const content = object.content?.toString();
    const existingPost = await ActivityPubPostModel.findOne({
      uri: object.id.href,
    });
    if (existingPost) return; // Already saved

    await ActivityPubPostModel.create({
      uri: object.id.href,
      actor_id: actorId,
      content: content,
      url: object.url?.href,
    });
  })
  .on(Like, async (ctx, like) => {
    if (!like.objectId || !like.actorId) return;

    const liker = await persistActor((await like.getActor()) as Person);
    if (!liker) return;

    const postUri = like.objectId.href;

    const post = await ActivityPubPostModel.findOne({ uri: postUri });
    if (!post) return;

    // Prevent duplicate likes
    const existing = await LikeModel.findOne({
      actor_id: liker._id,
      post_id: post._id,
    });

    if (!existing) {
      await LikeModel.create({
        actor_id: liker._id,
        post_id: post._id,
      });

      // Optional: increment likes counter on the post
    }
  });

federation
  .setFollowersDispatcher(
    "/users/{identifier}/followers",
    async (ctx, identifier, cursor) => {
      const user = await UserModel.findOne({ username: identifier });
      if (!user) return { items: [] };

      const actor = await ActorModel.findOne({ user_id: user._id });
      if (!actor) return { items: [] };

      const follows = await FollowModel.find({ following_id: actor._id }).sort({
        created: -1,
      });

      const followerIds = follows.map((f) => f.follower_id);

      const followerActors = await ActorModel.find({
        _id: { $in: followerIds },
      });

      const items: Recipient[] = followerActors.map((follower) => {
        return {
          id: new URL(follower.uri),
          inboxId: new URL(follower.inbox_url),
          endpoints: follower.shared_inbox_url
            ? { sharedInbox: new URL(follower.shared_inbox_url) }
            : null,
        };
      });

      return { items };
    }
  )
  .setCounter(async (ctx, identifier) => {
    const user = await UserModel.findOne({ username: identifier });
    if (!user) return 0;

    const actor = await ActorModel.findOne({ user_id: user._id });
    if (!actor) return 0;

    const count = await FollowModel.countDocuments({ following_id: actor._id });

    return count;
  });

federation.setObjectDispatcher(
  Note,
  "/users/{identifier}/posts/{id}",
  async (ctx, values) => {
    const [post] = await ActivityPubPostModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(values.id),
        },
      },
      {
        $lookup: {
          from: "actors",
          localField: "actor_id",
          foreignField: "_id",
          as: "actor",
        },
      },
      { $unwind: "$actor" },
      {
        $lookup: {
          from: "users",
          localField: "actor.user_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $match: {
          "user.username": values.identifier,
        },
      },
    ]);

    if (!post) return null;

    return new Note({
      id: ctx.getObjectUri(Note, values),
      attribution: ctx.getActorUri(values.identifier),
      to: PUBLIC_COLLECTION,
      cc: ctx.getFollowersUri(values.identifier),
      content: post.content,
      mediaType: "text/html",
      url: ctx.getObjectUri(Note, values),
    });
  }
);

export default federation;
